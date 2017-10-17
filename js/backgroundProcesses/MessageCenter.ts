import { LOG }                from "../logging/Log";
import { NativeBus }          from "../native/libInterface/NativeBus";
import { CLOUD }              from "../cloud/cloudAPI";
import { LocalNotifications } from "../notifications/LocalNotifications";
import { Util }               from "../util/Util";
import {MapProvider} from "./MapProvider";

class MessageCenterClass {
  _initialized: boolean = false;
  _store: any;

  constructor() { }

  _loadStore(store: any) {
    LOG.info('LOADED STORE MessageSearcher', this._initialized);
    if (this._initialized === false) {
      this._store = store;

      NativeBus.on(NativeBus.topics.enterSphere, (sphereId) => { this._enterSphere(sphereId); });
      NativeBus.on(NativeBus.topics.exitSphere,  (sphereId) => { this._exitSphere(sphereId); });
      NativeBus.on(NativeBus.topics.enterRoom,   (data)     => { this._enterRoom(data); }); // data = {region: sphereId, location: locationId}
      NativeBus.on(NativeBus.topics.exitRoom,    (data)     => { this._exitRoom(data); });  // data = {region: sphereId, location: locationId}

    }
    this._initialized = true;
  }

  _isMessageEqual(dbMessage, cloudMessage, cloudRecipientIds) {
    if (
      dbMessage.config.everyoneInSphere === cloudMessage.everyoneInSphere &&
      dbMessage.config.everyoneInSphereIncludingOwner === cloudMessage.everyoneInSphereIncludingOwner &&
       (dbMessage.config.content === cloudMessage.content) &&
        (
          (dbMessage.config.triggerLocationId === null && cloudMessage.triggerLocationId === undefined) ||
          (dbMessage.config.triggerLocationId === MapProvider.cloud2localMap.locations[cloudMessage.triggerLocationId])
        )
      ) {

      let dbRecipientIds = Object.keys(dbMessage.recipients);
      if (dbRecipientIds.length === cloudRecipientIds.length) {
        for (let i = 0; i < dbRecipientIds.length; i++) {
          if (cloudRecipientIds.indexOf(dbRecipientIds[i]) === -1) {
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

  _processMessage(actions, state, cloudMessage) {
    let notified = LocalNotifications._handleNewMessage(cloudMessage, state);
    if (notified) {
      this._generateMessageStoringActions(actions, state, cloudMessage);
    }
  }

  _findMatchingLocalMessageId(cloudMessage, state, recipientIds = null) {
    let dbMessageId = null;

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
          dbMessageId = dbMessageIds[i];
          break;
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

    let dbMessageId = localMessageId || Util.getUUID();

    // add message to the store
    actions.push({
      type:'ADD_CLOUD_MESSAGE',
      sphereId: localSphereId,
      messageId: dbMessageId,
      data: {
        senderId: cloudMessage.ownerId,
        cloudId: cloudMessage.id,
        content: cloudMessage.content,
        everyoneInSphereIncludingOwner: cloudMessage.everyoneInSphereIncludingOwner,
        everyoneInSphere: cloudMessage.everyoneInSphere,
        triggerEvent: cloudMessage.triggerEvent,
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
        at: new Date().valueOf(),
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
    let state = this._store.getState();
    this._generateMessageStoringActions(actions, state, cloudMessage);
    if (actions.length > 0) {
      this._store.batchDispatch(actions);
    }
  }

  deliveredMessage(localSphereId, localMessageId) {
    let state = this._store.getState();
    if (localMessageId) {
      this._store.dispatch({
        type: "I_RECEIVED_MESSAGE",
        sphereId: localSphereId,
        messageId: localMessageId,
        data: {
          userId: state.user.userId,
          at: new Date().valueOf(),
        }
      });
    }
  }

  readMessage(localSphereId, localMessageId) {
    let state = this._store.getState();
    if (localMessageId) {
      this._store.dispatch({
        type: "I_READ_MESSAGE",
        sphereId: localSphereId,
        messageId: localMessageId,
        data: {userId: state.user.userId}
      });
    }
  }

  _enterSphere(localSphereId) {
    LOG.info("MessageSearcher: enter sphere", localSphereId);
    this._handleMessageInSphere(localSphereId, 'enter');
  }

  _exitSphere(localSphereId) {
    LOG.info("MessageSearcher: exit sphere", localSphereId);
    this._handleMessageInSphere(localSphereId, 'exit');
  }

  _enterRoom(data : locationDataContainer) {
    LOG.info("MessageSearcher: enter room", data);
    this._handleMessageInLocation(data.region, data.location, 'enter');
  }

  _exitRoom(data : locationDataContainer) {
    LOG.info("MessageSearcher: exit room", data);
    this._handleMessageInLocation(data.region, data.location, 'exit');
  }

  _handleMessageInLocation(localSphereId, localLocationId, triggerEvent) {
    let state = this._store.getState();

    CLOUD.forSphere(localSphereId).getNewMessagesInLocation(localLocationId)
      .then((messages) => {
        if (messages && Array.isArray(messages)) {
          let actions = [];
          messages.forEach((cloudMessage) => {
            if (cloudMessage.triggerEvent === triggerEvent) {
              this._processMessage(actions, state, cloudMessage);
            }
          });
          if (actions.length > 0) {
            this._store.batchDispatch(actions);
          }
        }
      })
      .catch((err) => { LOG.error("MessageCenter: Could not handle message in Location:", err);})
  }

  _handleMessageInSphere(localSphereId, triggerEvent) {
    let state = this._store.getState();

    CLOUD.forSphere(localSphereId).getNewMessagesInSphere()
      .then((messages) => {
        if (messages && Array.isArray(messages)) {
          let actions = [];
          messages.forEach((cloudMessage) => {
            if (cloudMessage.triggerEvent === triggerEvent) {
              this._processMessage(actions, state, cloudMessage);
            }
          });
          if (actions.length > 0) {
            this._store.batchDispatch(actions);
          }
        }
      })
      .catch((err) => { LOG.error("MessageCenter: Could not handle message in Sphere:", err);})
  }

  /**
   * This will check for messages in the current location. It is self contained and can be called whenever.
   */
  checkForMessages() {
    let state = this._store.getState();
    let presentSphereId = Util.data.getPresentSphere(state);

    if (presentSphereId) {
      let presentLocationId = Util.data.getUserLocationIdInSphere(state, presentSphereId, state.user.userId);
      if (presentLocationId) {
        this._enterRoom({region: presentSphereId, location: presentLocationId});
      }
      else {
        this._enterSphere(presentSphereId);
      }
    }
  }
}

export const MessageCenter = new MessageCenterClass();