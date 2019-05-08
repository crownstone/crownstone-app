import { core } from "../core";
import { NavigationUtil } from "../util/NavigationUtil";
import { Platform } from "react-native";
import { CLOUD } from "../cloud/cloudAPI";
import { LocalNotifications } from "./LocalNotifications";
import { MessageCenter } from "../backgroundProcesses/MessageCenter";
import { LOG, LOGe } from "../logging/Log";
import { MapProvider } from "../backgroundProcesses/MapProvider";
import { SphereUserSyncer } from "../cloud/sections/sync/modelSyncs/SphereUserSyncer";
import { getGlobalIdMap } from "../cloud/sections/sync/modelSyncs/SyncingBase";
import { StoneUtil } from "../util/StoneUtil";
import { INTENTS } from "../native/libInterface/Constants";
import { BatchCommandHandler } from "../logic/BatchCommandHandler";

class NotificationParserClass {

  handle(messageData) {
    if (messageData && messageData.command) {
      this._handleRemoteNotifications(messageData);
    }

    if (messageData && messageData.type && messageData.source === 'localNotification') {
      this._handleLocalNotifications(messageData);
    }

    core.eventBus.emit("NotificationReceived", messageData);
  }

  _handleLocalNotifications(messageData) {
    switch (messageData.type) {
      case 'newMessage':
        NavigationUtil.navigate("MessageInbox");

        // actually go to the message tab
        if (Platform.OS === 'ios') {
          NavigationUtil.navigate("Messages");
        }

        break;
    }
  }

  _handleRemoteNotifications(messageData) {
    let state = core.store.getState();
    switch(messageData.command) {
      case 'setSwitchStateRemotely':
        this._handleSetSwitchStateRemotely(messageData, state); break;
      case 'newMessage':
        if (messageData.id) {
          CLOUD.getMessage(messageData.id)
            .then((result) => {
              state = core.store.getState();
              let notified = LocalNotifications._handleNewMessage(messageData, state);
              if (notified) {
                MessageCenter.storeMessage(result);
              }
            })
            .catch((err) => { LOGe.notifications("NotificationParser: Couldn't get message to store", err)})
        }
        break;
      case "sphereUsersUpdated":
        if (messageData.sphereId) {
          this._updateSphereUsers(messageData);
        }
        break;
      case "sphereUserRemoved":
        if (messageData.sphereId) {
          if (messageData.removedUserId === state.user.userId) {
            CLOUD.sync(core.store).catch((err) => { LOGe.notifications("Could not sync to remove user from sphere!", err); });
          }
          else {
            this._updateSphereUsers(messageData);
          }
        }
        break;
    }
  }

  _updateSphereUsers(messageData) {
    let localSphereId = MapProvider.cloud2localMap.spheres[messageData.sphereId];
    if (localSphereId) {
      let actions = [];
      let sphereUserSyncer = new SphereUserSyncer(actions, [], localSphereId, messageData.sphereId, MapProvider.cloud2localMap, getGlobalIdMap());
      sphereUserSyncer.sync(core.store)
        .then(() => {
          if (actions.length > 0) {
            core.store.batchDispatch(actions);
          }
        })
        .catch((err) => { LOGe.notifications("NotifcationParser: Failed to update sphere users.", err); })
    }
  }

  _handleSetSwitchStateRemotely(messageData, state) {
    if (!messageData.sphereId || !messageData.stoneId) {
      return;
    }

    let localSphereId = MapProvider.cloud2localMap.spheres[messageData.sphereId];
    let localStoneId  = MapProvider.cloud2localMap.stones[messageData.stoneId];
    if (!localSphereId || !localStoneId) { return; }


    if (state && state.spheres[localSphereId] && state.spheres[localSphereId].stones[localStoneId]) {
      LOG.notifications("NotificationParser: switching based on notification", messageData);
      StoneUtil.switchBHC(
        localSphereId,
        localStoneId,
        state.spheres[localSphereId].stones[localStoneId],
        Math.min(1, Math.max(0, messageData.switchState || 0)),
        core.store,
        {},
        (err) => {},
        INTENTS.manual,
        25,
        'from handle in NotificationParser'
      );
      BatchCommandHandler.executePriority();
    }
  }
}

export const NotificationParser  = new NotificationParserClass();