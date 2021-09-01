import { core }                  from "../Core";
import { NavigationUtil }        from "../util/NavigationUtil";
import { Platform }              from "react-native";
import { CLOUD }                 from "../cloud/cloudAPI";
import { LocalNotifications }    from "./LocalNotifications";
import { MessageCenter }         from "../backgroundProcesses/MessageCenter";
import { LOG, LOGe, LOGi, LOGw } from "../logging/Log";
import { MapProvider }           from "../backgroundProcesses/MapProvider";
import { SphereUserSyncer }      from "../cloud/sections/sync/modelSyncs/SphereUserSyncer";
import { getGlobalIdMap }        from "../cloud/sections/sync/modelSyncs/SyncingBase";
import { INTENTS }               from "../native/libInterface/Constants";
import { InviteCenter }          from "../backgroundProcesses/InviteCenter";
import { tell }                  from "../logic/constellation/Tellers";

class NotificationParserClass {

  timekeeper = {};

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
    // check if we should handle this notification.
    let sequenceTime = notificationData?.sequenceTime;
    if (sequenceTime) {
      if (typeof sequenceTime === 'string') {
        try {
          sequenceTime = JSON.parse(sequenceTime);
        }
        catch (e) {
          LOGw.info("Invalid sequence time data", sequenceTime, e);
          return;
        }
      }

      let notificationTimestamp = sequenceTime.timestamp || null;
      let notificationIndex     = sequenceTime.counter   || null;
      if (notificationTimestamp && notificationIndex !== null) {
        if (Date.now() - notificationTimestamp > 30000) {
          LOGw.info("This notification is more than 30 seconds old. Ignoring it.", notificationData, Date.now() - notificationTimestamp);
          return;
        }

        if (this.timekeeper[notificationData.command]) {
          let cloudTimeBetweenNotifications = notificationTimestamp - this.timekeeper[notificationData.command].timestamp;
          if (cloudTimeBetweenNotifications < -500) {
            LOGw.info("Notifications received out of order. Difference is more than 500ms. Ignoring it.", notificationData, cloudTimeBetweenNotifications);
            return;
          }

          if (this.timekeeper[notificationData.command].counter === notificationIndex) {
            LOGw.info("Duplicate notifications received. Ignoring it.", notificationData, cloudTimeBetweenNotifications);
            return
          }
        }

        this.timekeeper[notificationData.command] = sequenceTime;
      }
    }

    let state = core.store.getState();
    switch(notificationData.command) {
      case 'multiSwitch':
        this._handleMultiswitch(notificationData, state); break;
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

    if (notificationData.event && typeof notificationData.event === 'object' && Object.keys(notificationData.event).length > 0) {
      return this._handleMultiswitch(notificationData, state);
    }

    let localSphereId = MapProvider.cloud2localMap.spheres[notificationData.sphereId];
    let localStoneId  = MapProvider.cloud2localMap.stones[notificationData.stoneId];
    if (!localSphereId || !localStoneId) { return; }

    let stone = state?.spheres[localSphereId]?.stones[localStoneId] || null;
    if (stone) {
      LOG.notifications("NotificationParser: switching based on notification", notificationData);
      // remap existing 0..1 range from cloud to 0..100
      if (notificationData.switchState > 0 && notificationData.switchState <= 1) {
        notificationData.switchState = 100*notificationData.switchState;
      }
      let switchState = Math.min(100, notificationData.switchState);
      if (switchState === 100) {
        tell(stone).turnOn(true).catch();
      }
      else {
        tell(stone).multiSwitch(switchState,true).catch();
      }
    }
  }

  _handleMultiswitch(notificationData, state) {
    let switchEventData : MultiSwitchCrownstoneEvent = notificationData.event;
    if (!switchEventData) { return; };

    let cloudSphereId = switchEventData.sphere?.id;
    if (!cloudSphereId) { return; };
    let sphereId = MapProvider.cloud2localMap.spheres[cloudSphereId] || cloudSphereId

    let sphere = state.spheres[sphereId];
    if (!sphere) { return; }

    let switchDataArr = switchEventData.switchData;
    if (!switchDataArr || !Array.isArray(switchDataArr)) { return; };


    let actionToPerform = false;
    switchDataArr.forEach((switchData) => {
      let stoneId = MapProvider.cloud2localMap.stones[switchData.id] || switchData.id;
      let stone = sphere.stones[stoneId];
      if (!stone) { return; }

      let switchState = switchData.percentage;
      switch (switchData.type) {
        case "PERCENTAGE":
          if (switchData.percentage === undefined || switchData.percentage === null) { return };
          switchState = switchData.percentage;
          break;
        case "TURN_OFF":
          switchState = 0;
          break;
        case "TURN_ON":
          actionToPerform = true;
          tell(stone).turnOn(true).catch((err) => {});
          return;
        default:
          return;
      }
      actionToPerform = true;
      tell(stone).multiSwitch(switchState,true).catch((err) => {});
    });
  }
}

export const NotificationParser  = new NotificationParserClass();