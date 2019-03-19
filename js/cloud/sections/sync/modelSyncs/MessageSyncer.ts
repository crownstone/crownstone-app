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
import { xUtil } from "../../../../util/StandAloneUtil";

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
    let userInState = store.getState().user;
    this.userId = userInState.userId;

    return this.download()
      .then((messagesInCloud) => {
        // used to transform the locationId for the triggerLocationIds
        this._constructLocalIdMap();

        let messagesInState = this._getLocalData(store);
        this.syncDown(messagesInState, messagesInCloud);

        // we do NOT sync up.

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
          localId = xUtil.getUUID();
          let cloudDataForLocal = {...message_from_cloud};
          cloudDataForLocal['localTriggerLocationId'] = this._getLocalLocationId(message_from_cloud.triggerLocationId);
          transferMessages.createLocal( this.actions, {
            localSphereId: this.localSphereId,
            localId: localId,
            cloudId: message_from_cloud.id,
            cloudData: cloudDataForLocal,
            extraFields: { sent: true, sentAt: message_from_cloud['createdAt']}
          })
        }
      }
    });

    return localMessageIdsSynced;
  }

  _getLocalLocationId(cloudId) {
    if (!cloudId) { return null; }
    return this.globalCloudIdMap.locations[cloudId] || null;
  }


  syncLocalMessageDown(localId, messageInState, message_from_cloud) {
    if (shouldUpdateInCloud(messageInState.config, message_from_cloud)) {
      // update in cloud --> not possible for messages. Sent is sent.
    }
    else if (shouldUpdateLocally(messageInState.config, message_from_cloud)) {
      // update local
      let cloudDataForLocal = {...message_from_cloud};
      cloudDataForLocal['localTriggerLocationId'] = this._getLocalLocationId(message_from_cloud.triggerLocationId);
      transferMessages.updateLocal( this.actions, {
        localSphereId: this.localSphereId,
        localId: localId,
        cloudId: message_from_cloud.id,
        cloudData: cloudDataForLocal
      })
    }

    if (!messageInState.config.cloudId) {
      this.actions.push({type:'UPDATE_MESSAGE_CLOUD_ID', sphereId: this.localSphereId, messageId: localId, data:{cloudId: message_from_cloud.id}})
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
