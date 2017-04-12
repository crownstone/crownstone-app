const PushNotification = require('react-native-push-notification');
import { Platform } from 'react-native';
import { LOG } from "../logging/Log";
import { eventBus } from '../util/EventBus'
import { Util } from "../util/Util";
import {CLOUD} from "../cloud/cloudAPI";

class PushNotificationHandlerClass {
  store: any = {};

  constructor() {
  }

  loadStore(store) {
    this.store = store;
    this.configure();

    // double check the token if we should have one.
    if (this.store.getState().app.notificationToken !== null) {
      this.request();
    }
  }

  configure() {
    PushNotification.configure({

      // (optional) Called when Token is generated (iOS and Android)
      onRegister: (token) => {
        this.store.dispatch({
          type: "SET_NOTIFICATION_TOKEN",
          data: {
            notificationToken: token
          }
        });
        LOG.info("NotificationHandler: Got notification token!", token);

        let state = this.store.getState();
        let deviceId = Util.data.getCurrentDeviceId(state);
        if (!deviceId) { return LOG.error("NotificationHandler: NO DEVICE CONFIGURED"); }

        let installationId = state.devices[deviceId].installationId;

        if (!installationId) {
          LOG.warn("NotificationHandler: No Installation found.");
          CLOUD.forDevice(deviceId).createInstallation({ deviceType: Platform.OS })
            .then((installation) => {
              LOG.info("NotificationHandler: Creating new installation and connecting it to the device.");
              let actions = [];
              actions.push({
                type: 'ADD_INSTALLATION',
                installationId: installation.id,
                data: { deviceToken: token }
              });
              actions.push({
                type: 'UPDATE_DEVICE_CONFIG',
                deviceId: deviceId,
                data: { installationId: installation.id }
              });
              this.store.batchDispatch(actions);
            })
            .catch((err) => {
              LOG.error("NotificationHandler: Error during creation of Installation", err);
            });
        }
        else {
          if (state.installation[installationId].deviceToken !== token) {
            this.store.dispatch({
              type:'UPDATE_INSTALLATION_CONFIG',
              installationId: installationId,
              data: {
                notificationToken: token
              }
            });
          }
        }

      },

      // (required) Called when a remote or local notification is opened or received
      onNotification: function(notification) {
        console.log( 'NOTIFICATION:', notification );
      },

      // ANDROID ONLY: GCM Sender ID (optional - not required for local notifications, but is need to receive remote push notifications)
      senderID: "YOUR GCM SENDER ID",

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
      requestPermissions: true,
    });
  }

  request() {
    LOG.info("Requesting push permissions");
    PushNotification.requestPermissions();
  }
}

export const NotificationHandler = new PushNotificationHandlerClass();