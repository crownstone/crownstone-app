import {LOG, LOGe, LOGi} from "../logging/Log";
import {CLOUD} from "../cloud/cloudAPI";
import {LocalNotifications} from "../notifications/LocalNotifications";
import {Util} from "../util/Util";
import {MapProvider} from "./MapProvider";
import {xUtil} from "../util/StandAloneUtil";
import {core} from "../Core";
import {Get} from "../util/GetUtil";

class MessageCenterClass {
  _initialized: boolean = false;
  _enterSphereInProgress : boolean = false;
  _exitSphereInProgress  : boolean = false;
  _enterRoomInProgress   : boolean = false;
  _exitRoomInProgress    : boolean = false;

  constructor() { }

  init() {
    LOG.info('LOADED STORE MessageCenter', this._initialized);
    if (this._initialized === false) {

      core.nativeBus.on(core.nativeBus.topics.enterSphere, (sphereId) => { this._enterSphere(sphereId); });
      core.nativeBus.on(core.nativeBus.topics.exitSphere,  (sphereId) => { this._exitSphere(sphereId); });
      core.eventBus.on('enterRoom',   (data)     => { this._enterRoom(data); }); // data = {sphereId: sphereId, locationId: locationId}
      core.eventBus.on('exitRoom',    (data)     => { this._exitRoom(data); });  // data = {sphereId: sphereId, locationId: locationId}

    }
    this._initialized = true;
  }

  _isMessageEqual(dbMessage, cloudMessage, cloudRecipientIds) {
    if (
      dbMessage.config.everyoneInSphere               === cloudMessage.everyoneInSphere &&
      dbMessage.config.everyoneInSphereIncludingOwner === cloudMessage.everyoneInSphereIncludingOwner &&
       (dbMessage.config.content === cloudMessage.content) &&
        (
          (!dbMessage.config.triggerLocationId && !cloudMessage.triggerLocationId) ||
          (dbMessage.config.triggerLocationId === MapProvider.cloud2localMap.locations[cloudMessage.triggerLocationId])
        )
      ) {

      let dbRecipientIds = Object.keys(dbMessage.recipients);
      if (dbRecipientIds.length === cloudRecipientIds.length) {
        for (let i = 0; i < dbRecipientIds.length; i++) {
          if (cloudRecipientIds.includes(dbRecipientIds[i]) === false) {
            return false;
          }
        }
      }
      else {
        return false;
      }
    }
    else {
      return false;
    }
    return true;
  }

  _processMessage(actions, state, cloudMessage, alreadyNotified) {
    let notified = LocalNotifications._handleNewMessage(cloudMessage, state, alreadyNotified);
    if (notified) {
      this._generateMessageStoringActions(actions, state, cloudMessage);
    }
    return notified || alreadyNotified;
  }

  _findMatchingLocalMessageId(cloudMessage, state, recipientIds = null) {
    if (recipientIds === null) {
      recipientIds = [];
      cloudMessage.recipients.forEach((idObject) => {
        recipientIds.push(idObject.id);
      });
    }
    let localSphereId = MapProvider.cloud2localMap.spheres[cloudMessage.sphereId];
    if (!localSphereId) { return null }

    if (cloudMessage.ownerId === state.user.userId) {
      let dbMessages = state.spheres[localSphereId].messages;
      // this should check if we already have this message before storing it in the store.
      // match recipients, content, triggerLocationId and triggerEvent for this.
      let dbMessageIds = Object.keys(dbMessages);
      for (let i = 0; i < dbMessageIds.length; i++) {
        let dbMessage = dbMessages[dbMessageIds[i]];
        let match = this._isMessageEqual(dbMessage, cloudMessage, recipientIds);
        if (match) {
          return dbMessageIds[i];
        }
      }
    }
  }

  _generateMessageStoringActions(actions, state, cloudMessage) {
    let recipientIds = [];
    cloudMessage.recipients.forEach((idObject) => {
      recipientIds.push(idObject.id);
    });

    let localMessageId = this._findMatchingLocalMessageId(cloudMessage, state, recipientIds);
    let localSphereId  = MapProvider.cloud2localMap.spheres[cloudMessage.sphereId];
    if (!localSphereId) { return null }

    let dbMessageId = localMessageId || xUtil.getUUID();

    // add message to the store
    actions.push({
      type:'ADD_CLOUD_MESSAGE',
      sphereId: localSphereId,
      messageId: dbMessageId,
      data: {
        senderId:          cloudMessage.ownerId,
        cloudId:           cloudMessage.id,
        content:           cloudMessage.content,
        everyoneInSphereIncludingOwner: cloudMessage.everyoneInSphereIncludingOwner,
        everyoneInSphere:  cloudMessage.everyoneInSphere,
        triggerEvent:      cloudMessage.triggerEvent,
        triggerLocationId: cloudMessage.triggerLocationId,
        recipientIds: recipientIds,
        sent: true,
      }
    });

    // indicate that you have received this message
    actions.push({
      type:'I_RECEIVED_MESSAGE',
      sphereId: localSphereId,
      messageId: dbMessageId,
      data: {
        userId: state.user.userId,
        at: Date.now(),
      }
    });

    // put the cloud's knowledge of the delivered state in the local database.
    if (cloudMessage.delivered) {
      cloudMessage.delivered.forEach((delivered) => {
        actions.push({
          type:'RECEIVED_MESSAGE',
          sphereId: localSphereId,
          messageId: dbMessageId,
          data: {
            userId: delivered.userId,
            at: new Date(delivered.timestamp).valueOf(),
          }
        });
      })
    }

    // put the cloud's knowledge of the read state in the local database.
    if (cloudMessage.read) {
      cloudMessage.read.forEach((read) => {
        actions.push({
          type:'READ_MESSAGE',
          sphereId: localSphereId,
          messageId: dbMessageId,
          data: {
            userId: read.userId,
            at: new Date(read.timestamp).valueOf(),
          }
        });
      })
    }
  }

  storeMessage(cloudMessage) {
    let actions = [];
    let state = core.store.getState();
    this._generateMessageStoringActions(actions, state, cloudMessage);
    if (actions.length > 0) {
      core.store.batchDispatch(actions);
    }
  }

  deliveredMessage(localSphereId, localMessageId) {
    let state = core.store.getState();
    if (localMessageId) {
      core.store.dispatch({
        type: "I_RECEIVED_MESSAGE",
        sphereId: localSphereId,
        messageId: localMessageId,
        data: {
          userId: state.user.userId,
          at: Date.now(),
        }
      });
    }
  }

  readMessage(localSphereId, localMessageId) {
    let state = core.store.getState();
    if (localMessageId) {
      core.store.dispatch({
        type: "I_READ_MESSAGE",
        sphereId: localSphereId,
        messageId: localMessageId,
        data: {userId: state.user.userId}
      });
    }
  }

  newMessageStateInSphere(localSphereId, newMessageReceived : boolean = true) {
    core.store.dispatch({
      type: "SET_SPHERE_MESSAGE_STATE",
      sphereId: localSphereId,
      data: {newMessageFound: newMessageReceived}
    });
  }

  _enterSphere(localSphereId) {
    if (this._enterSphereInProgress === true) { return; }
    this._enterSphereInProgress = true;

    LOG.info("MessageCenter: enter sphere / already in sphere", localSphereId);
    return this._handleMessageInSphere(localSphereId, 'enter')
      .then(() => { this._enterSphereInProgress = false; })
      .catch(() => {          this._enterSphereInProgress = false; })
  }

  _exitSphere(localSphereId) {
    if (this._exitSphereInProgress === true) { return; }
    this._exitSphereInProgress = true;

    LOG.info("MessageCenter: exit sphere", localSphereId);
    return this._handleMessageInSphere(localSphereId, 'exit')
      .then(() => { this._exitSphereInProgress = false; })
      .catch(() => {          this._exitSphereInProgress = false; })
  }

  _enterRoom(data : locationDataContainer) {
    if (this._enterRoomInProgress === true) { return; }
    this._enterRoomInProgress = true;

    LOG.info("MessageCenter: enter room / already in room", data);
    return this._handleMessageInLocation(data.sphereId, data.locationId, 'enter')
      .then(() => { this._enterRoomInProgress = false; })
      .catch(() => {          this._enterRoomInProgress = false; })
  }

  _exitRoom(data : locationDataContainer) {
    if (this._exitRoomInProgress === true) { return; }
    this._exitRoomInProgress = true;

    LOG.info("MessageCenter: exit room", data);
    return this._handleMessageInLocation(data.sphereId, data.locationId, 'exit')
      .then(() => { this._exitRoomInProgress = false; })
      .catch(() => {          this._exitRoomInProgress = false; })
  }

  _handleMessageInLocation(localSphereId, localLocationId, triggerEvent) {
    let state = core.store.getState();

    return CLOUD.forSphere(localSphereId).getNewMessagesInLocation(localLocationId)
      .then((messages) => {
        if (messages && Array.isArray(messages)) {
          let actions = [];

          let notified = false;
          messages.forEach((cloudMessage) => {
            if (cloudMessage.triggerEvent === triggerEvent) {
              notified = this._processMessage(actions, state, cloudMessage, notified) || notified;
            }
          });

          if (actions.length > 0) {
            core.store.batchDispatch(actions);
          }
        }
      })
      .catch((err) => { LOGe.info("MessageCenter: Could not handle message in Location:", err?.message);})
  }

  _handleMessageInSphere(localSphereId, triggerEvent) {
    let state = core.store.getState();

    return CLOUD.forSphere(localSphereId).getNewMessagesInSphere()
      .then((messages) => {
        if (messages && Array.isArray(messages)) {
          let actions = [];
          let notified = false;
          messages.forEach((cloudMessage) => {
            if (cloudMessage.triggerEvent === triggerEvent) {
              notified = this._processMessage(actions, state, cloudMessage, notified) || notified;
            }
          });
          if (actions.length > 0) {
            core.store.batchDispatch(actions);
          }
        }
      })
      .catch((err) => { LOGe.info("MessageCenter: Could not handle message in Sphere:", err?.message);})
  }

  /**
   * This will check for messages in the current location. It is self contained and can be called whenever.
   */
  checkForMessages() : Promise<void> {
    LOGi.info("MessageCenter: Checking for messages...");
    let state = core.store.getState();
    let presentSphereId = Util.data.getPresentSphereId();

    if (presentSphereId) {
      let presentLocationId = Util.data.getUserLocationIdInSphere(state, presentSphereId, state.user.userId);
      if (presentLocationId) {
        return this._enterRoom({sphereId: presentSphereId, locationId: presentLocationId});
      }
      else {
        return this._enterSphere(presentSphereId);
      }
    }
    else {
      return new Promise((resolve, reject) => { resolve(); })
    }
  }


  getUnreadMessages(sphereId: sphereId) : number {
    let sphere = Get.sphere(sphereId);
    if (!sphere) { return 0; }

    let myUserId = Get.userId();
    let unreadMessageCount = 0;
    for (let messageId in sphere.messages) {
      let message = sphere.messages[messageId];

      if (message.read[myUserId] === undefined) {
        unreadMessageCount++;
      }
    }

    return unreadMessageCount;
  }

}

export const MessageCenter = new MessageCenterClass();
