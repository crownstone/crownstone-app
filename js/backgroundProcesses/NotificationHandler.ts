import {BatchCommandHandler} from "../logic/BatchCommandHandler";
const PushNotification = require('react-native-push-notification');
import { Platform } from 'react-native';
import {LOG, LOGe, LOGi, LOGw} from "../logging/Log";
import { Util } from "../util/Util";
import { CLOUD } from "../cloud/cloudAPI";
import { INTENTS } from "../native/libInterface/Constants";
import { StoneUtil } from "../util/StoneUtil";
import {LocalNotifications} from "../notifications/LocalNotifications";

import {MessageCenter} from "./MessageCenter";
import {MapProvider} from "./MapProvider";
import {SphereUserSyncer} from "../cloud/sections/sync/modelSyncs/SphereUserSyncer";
import {getGlobalIdMap} from "../cloud/sections/sync/modelSyncs/SyncingBase";
import { core } from "../core";
import { NavigationUtil } from "../util/NavigationUtil";

class NotificationHandlerClass {
  store: any = {};
  requesting = false;

  constructor() {}

  loadStore(store) {
    this.store = store;
    this.configure();

    let state = this.store.getState();
    let device = Util.data.getDevice(state);
    // double check the token if we should have one.
    if (state.app.notificationToken !== null || device) {
      LOG.notifications("NotificationHandler: Request for notification permission submitted from loadStore");
      this.request();
    }
  }

  _verifyState() {
    let state = this.store.getState();
    let device = Util.data.getDevice(state);
    // double check the token if we should have one.
    if (state.app.notificationToken !== null || device) {
      LOG.notifications("NotificationHandler: Request for notification permission submitted from loadStore");
      this.request();
    }
  }

  configure() {
    LOG.notifications("NotificationHandler: Configuring Push");
    PushNotification.configure({

      // (optional) Called when Token is generated (iOS and Android)
      onRegister: (tokenData) => {
        this.requesting = false;
        this.store.dispatch({
          type: "SET_NOTIFICATION_TOKEN",
          data: {
            notificationToken: tokenData.token
          }
        });
        LOG.notifications("NotificationHandler: Got notification token!", tokenData, tokenData.token);

        let state = this.store.getState();
        let deviceId = Util.data.getCurrentDeviceId(state);
        if (!deviceId) { return LOGe.notifications("NotificationHandler: NO DEVICE CONFIGURED"); }

        let installationId = state.devices[deviceId].installationId;

        if (!installationId || !state.installations[installationId]) {
          LOGw.notifications("NotificationHandler: No Installation found.");
          CLOUD.forDevice(deviceId).createInstallation({ deviceType: Platform.OS })
            .then((installation) => {
              LOG.notifications("NotificationHandler: Creating new installation and connecting it to the device.");
              let actions = [];
              actions.push({
                type: 'ADD_INSTALLATION',
                installationId: installation.id,
                data: { deviceToken: tokenData.token }
              });
              actions.push({
                type: 'UPDATE_DEVICE_CONFIG',
                deviceId: deviceId,
                data: { installationId: installation.id }
              });
              this.store.batchDispatch(actions);
            })
            .catch((err) => {
              LOGe.notifications("NotificationHandler: Error during creation of Installation", err);
            });
        }
        else {
          if (state.installations[installationId].deviceToken !== tokenData.token) {
            this.store.dispatch({
              type:'UPDATE_INSTALLATION_CONFIG',
              installationId: installationId,
              data: {
                deviceToken: tokenData.token
              }
            });
          }
        }
      },

      // (required) Called when a remote or local notification is opened or received
      onNotification: function(notification) {
        LOG.notifications("NotificationHandler: Received notification", notification);
        if (Platform.OS === 'android') {
          NotificationParser.handle(notification)
        }
        else {
          NotificationParser.handle(notification.data)
        }
      },

      // ANDROID ONLY: GCM Sender ID (optional - not required for local notifications, but is need to receive remote push notifications)
      senderID: "922370214953",

      onRemoteFetch: (x) => {
        LOG.notifications("NotificationHandler: onRemoteFetch",x)
      },

      // IOS ONLY (optional): default: all - Permissions to register.
      permissions: {
        alert: true,
        badge: true,
        sound: true
      },

      // Should the initial notification be popped automatically
      // default: true
      popInitialNotification: true,

      /**
       * (optional) default: true
       * - Specified if permissions (ios) and token (android and ios) will requested or not,
       * - if not, you must call PushNotificationsHandler.requestPermissions() later
       */
      requestPermissions: false,
    });
  }

  request() {
    if (this.requesting === false) {
      LOGi.notifications("NotificationHandler: Requesting push permissions");
      this.requesting = true;
      PushNotification.requestPermissions();
    }
    else {
      LOGi.notifications("NotificationHandler: Push permissions request already pending.");
    }
  }
}


class NotificationParserClass {
  store: any = {};

  constructor() {}

  loadStore(store) {
    this.store = store;
  }

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
    let state = this.store.getState();
    switch(messageData.command) {
      case 'setSwitchStateRemotely':
        this._handleSetSwitchStateRemotely(messageData, state); break;
      case 'newMessage':
        if (messageData.id) {
          CLOUD.getMessage(messageData.id)
            .then((result) => {
              state = this.store.getState();
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
            CLOUD.sync(this.store).catch((err) => { LOGe.notifications("Could not sync to remove user from sphere!", err); });
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
      sphereUserSyncer.sync(this.store)
        .then(() => {
          if (actions.length > 0) {
            this.store.batchDispatch(actions);
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
        this.store,
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

export const NotificationHandler = new NotificationHandlerClass();
export const NotificationParser  = new NotificationParserClass();