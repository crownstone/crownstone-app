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
import { InviteCenter } from "../backgroundProcesses/InviteCenter";

class NotificationParserClass {

  handle(notificationData) {
    if (notificationData && notificationData.command) {
      this._handleRemoteNotifications(notificationData);
    }

    if (notificationData && notificationData.type && notificationData.source === 'localNotification') {
      this._handleLocalNotifications(notificationData);
    }

    core.eventBus.emit("NotificationReceived", notificationData);
  }

  _handleLocalNotifications(messageData) {
    switch (messageData.type) {
      case 'newMessage':
        NavigationUtil.navigate( "MessageInbox");

        break;
    }
  }

  _handleRemoteNotifications(notificationData) {
    let state = core.store.getState();
    switch(notificationData.command) {
      case 'setSwitchStateRemotely':
        this._handleSetSwitchStateRemotely(notificationData, state); break;
      case 'newMessage':
        if (notificationData.id) {
          CLOUD.getMessage(notificationData.id)
            .then((result) => {
              state = core.store.getState();
              let notified = LocalNotifications._handleNewMessage(notificationData, state);
              if (notified) {
                MessageCenter.storeMessage(result);
              }
            })
            .catch((err) => { LOGe.notifications("NotificationParser: Couldn't get message to store", err)})
        }
        break;
      case "sphereUsersUpdated":
        this._updateSphereUsers(notificationData);
        break;
      case "sphereUserRemoved":
        if (notificationData.sphereId) {
          if (notificationData.removedUserId === state.user.userId) {
            CLOUD.sync(core.store).catch((err) => { LOGe.notifications("Could not sync to remove user from sphere!", err); });
          }
          else {
            this._updateSphereUsers(notificationData);
          }
        }
        break;
      case "userEnterSphere":
      case "userExitSphere":
      case "userExitLocation":
      case "userEnterLocation":
        if (notificationData.sphereId) {
          CLOUD.syncUsers(notificationData.sphereId);
        }
        break;
      case "InvitationReceived":
        InviteCenter.checkForInvites();
        break;
    }
  }

  _updateSphereUsers(notificationData) {
    if (notificationData.sphereId) {
      let localSphereId = MapProvider.cloud2localMap.spheres[notificationData.sphereId];
      if (localSphereId) {
        let actions = [];
        let sphereUserSyncer = new SphereUserSyncer(actions, [], localSphereId, notificationData.sphereId, MapProvider.cloud2localMap, getGlobalIdMap());
        sphereUserSyncer.sync(core.store)
          .then(() => {
            if (actions.length > 0) {
              core.store.batchDispatch(actions);
            }
          })
          .catch((err) => {
            LOGe.notifications("NotifcationParser: Failed to update sphere users.", err);
          })
      }
    }
  }

  _handleSetSwitchStateRemotely(notificationData, state) {
    if (!notificationData.sphereId || !notificationData.stoneId) {
      return;
    }

    let localSphereId = MapProvider.cloud2localMap.spheres[notificationData.sphereId];
    let localStoneId  = MapProvider.cloud2localMap.stones[notificationData.stoneId];
    if (!localSphereId || !localStoneId) { return; }


    if (state && state.spheres[localSphereId] && state.spheres[localSphereId].stones[localStoneId]) {
      LOG.notifications("NotificationParser: switching based on notification", notificationData);
      let switchState = Math.min(1, Math.max(0, notificationData.switchState || 0))
      if (switchState === 1) {
        StoneUtil.turnOnBCH(
          localSphereId,
          localStoneId,
          state.spheres[localSphereId].stones[localStoneId],
          {},
          (err) => {},
          5,
          'from _getButton in DeviceSummary'
        );
      }
      else {
        StoneUtil.switchBCH(
          localSphereId,
          localStoneId,
          state.spheres[localSphereId].stones[localStoneId],
          switchState,
          {},
          (err) => {},
          5,
          'from handle in NotificationParser'
        );
      }

      BatchCommandHandler.executePriority();
    }
  }
}

export const NotificationParser  = new NotificationParserClass();