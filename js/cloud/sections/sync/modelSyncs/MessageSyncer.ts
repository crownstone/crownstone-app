/**
 *
 * Sync the messages from the cloud to the database.
 *
 */

import {shouldUpdateInCloud, shouldUpdateLocally} from "../shared/syncUtil";
import {CLOUD} from "../../../cloudAPI";
import {Util} from "../../../../util/Util";
import {SyncingSphereItemBase} from "./SyncingBase";
import {transferMessages} from "../../../transferData/transferMessages";

export class MessageSyncer extends SyncingSphereItemBase {
  userId: string;

  download() {
    return CLOUD.forSphere(this.cloudSphereId).getActiveMessages();
  }

  _getLocalData(store) {
    let state = store.getState();
    if (state && state.spheres[this.localSphereId]) {
      return state.spheres[this.localSphereId].messages;
    }
    return {};
  }

  sync(store) {
    // used to transform the locationId for the triggerLocationIds
    this._constructLocalIdMap();

    let userInState = store.getState().user;
    this.userId = userInState.userId;

    return this.download()
      .then((messagesInCloud) => {
        let messagesInState = this._getLocalData(store);
        let localMessageIdsSynced = this.syncDown(messagesInState, messagesInCloud);
        this.syncUp(messagesInState, localMessageIdsSynced);

        return Promise.all(this.transferPromises);
      })
      .then(() => { return this.actions });
  }

  syncDown(messagesInState, messagesInCloud) : object {
    let localMessageIdsSynced = {};
    let cloudIdMap = this._getCloudIdMap(messagesInState);
    messagesInCloud.forEach((message_from_cloud) => {
      // check if there is an existing message
      let localId = cloudIdMap[message_from_cloud.id];

      // item exists locally.
      if (localId) {
        cloudIdMap[message_from_cloud.id] = localId;
        localMessageIdsSynced[localId] = true;
        this.syncLocalMessageDown(localId, messagesInState[localId], message_from_cloud);
      }
      else {
        // if the user does not own this message, do not sync it into the local database, it will be handled by the MessageCenter
        if (message_from_cloud.ownerId !== this.userId) {
          // do nothing.
        }
        else {
          localId = Util.getUUID();
          let cloudDataForLocal = {...message_from_cloud};
          cloudDataForLocal['localTriggerLocationId'] = this._getLocalLocationId(message_from_cloud.triggerLocationId);
          this.transferPromises.push(
            transferMessages.createLocal( this.actions, {
              localSphereId: this.localSphereId,
              localId: localId,
              cloudId: message_from_cloud.id,
              cloudData: cloudDataForLocal,
              extraFields: { sent: true, sentAt: message_from_cloud['createdAt']}
            })
            .catch()
          );
        }
      }
    });

    return localMessageIdsSynced;
  }

  _getLocalLocationId(cloudId) {
    if (!cloudId) { return null; }
    return this.globalCloudIdMap.locations[cloudId] || null;
  }

  _getCloudLocationId(localId) {
    if (!localId) { return; }
    return this.globalLocalIdMap.locations[localId];
  }


  syncUp(messagesInState, localMessageIdsSynced) {
    let localMessageIds = Object.keys(messagesInState);

    localMessageIds.forEach((messageId) => {
      let message = messagesInState[messageId];
      this.syncLocalMessageUp(
        message,
        messageId,
        localMessageIdsSynced[messageId] === true
      )
    });
  }

  syncLocalMessageUp(localMessage, localMessageId, hasSyncedDown = false) {
    // if the object does not have a cloudId, it does not exist in the cloud but we have it locally.
    if (!hasSyncedDown) {
      if (localMessage.config.cloudId) {
        this.actions.push({ type: 'REMOVE_MESSAGE', sphereId: this.localSphereId, messageId: localMessageId });
      }
      else {
        // we transform the triggerLocationId since we refer to it with a local Id locally.
        let localDataForCloud = {...localMessage};
        localDataForCloud.config['cloudTriggerLocationId'] = this._getCloudLocationId(localMessage.triggerLocationId);
        this.transferPromises.push(
          transferMessages.createOnCloud(this.actions, {
            localId: localMessageId,
            localSphereId: this.localSphereId,
            cloudSphereId: this.cloudSphereId,
            localData: localDataForCloud
          })
        );
      }
    }
  }

  syncLocalMessageDown(localId, messageInState, message_from_cloud) {
    if (shouldUpdateInCloud(messageInState.config, message_from_cloud)) {
      // update in cloud --> not possible for messages. Sent is sent.
    }
    else if (shouldUpdateLocally(messageInState.config, message_from_cloud) || !messageInState.config.cloudId) {
      // update local
      let cloudDataForLocal = {...message_from_cloud};
      cloudDataForLocal['localTriggerLocationId'] = this._getLocalLocationId(message_from_cloud.triggerLocationId);
      this.transferPromises.push(
        transferMessages.updateLocal( this.actions, {
          localSphereId: this.localSphereId,
          localId: localId,
          cloudId: message_from_cloud.id,
          cloudData: cloudDataForLocal
        }).catch()
      );
    }
  };


  _getCloudIdMap(messagesInState) {
    let cloudIdMap = {};
    let messageIds = Object.keys(messagesInState);
    messageIds.forEach((messageId) => {
      let message = messagesInState[messageId];
      if (message.config.cloudId) {
        cloudIdMap[message.config.cloudId] = messageId;
      }
    });

    return cloudIdMap;
  }

}
