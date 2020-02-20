import { NotificationParser } from "../notifications/NotificationParser";

const PushNotification = require('react-native-push-notification');
import { Platform, PushNotificationIOS } from "react-native";
import { LOG, LOGd, LOGe, LOGi, LOGw } from "../logging/Log";
import { Util } from "../util/Util";
import { CLOUD } from "../cloud/cloudAPI";
import { core } from "../core";

class NotificationHandlerClass {
  requesting = false;

  notificationPermissionGranted = false;

  init() {
    this.configure();

    let state = core.store.getState();
    let device = Util.data.getDevice(state);
    // double check the token if we should have one.
    if (state.app.notificationToken !== null || device) {
      this.notificationPermissionGranted = false;
      LOG.notifications("NotificationHandler: Request for notification permission submitted from loadStore");
      this.request();
    }
  }

  _verifyState() {
    let state = core.store.getState();
    let device = Util.data.getDevice(state);
    // double check the token if we should have one.
    if (state.app.notificationToken !== null || device) {
      this.notificationPermissionGranted = false;
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
        this.notificationPermissionGranted = true;
        core.store.dispatch({
          type: "SET_NOTIFICATION_TOKEN",
          data: {
            notificationToken: tokenData.token
          }
        });
        LOG.notifications("NotificationHandler: Got notification token!", tokenData, tokenData.token);

        let state = core.store.getState();
        let deviceId = Util.data.getCurrentDeviceId(state);
        if (!deviceId) { return LOGe.notifications("NotificationHandler: NO DEVICE CONFIGURED"); }

        let installationId = state.devices[deviceId].installationId;

        if (!installationId || !state.installations[installationId]) {
          LOGw.notifications("NotificationHandler: No Installation found.");
          CLOUD.forDevice(deviceId).createInstallation({ deviceType: Platform.OS, deviceToken: tokenData.token })
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
              core.store.batchDispatch(actions);
            })
            .catch((err) => {
              LOGe.notifications("NotificationHandler: Error during creation of Installation", err);
            });
        }
        else {
          LOGd.notifications("NotificationHandler: Installation found, checking token.");
          if (state.installations[installationId].deviceToken !== tokenData.token) {
            LOGi.notifications("NotificationHandler: Installation found, UPDATING token.");
            core.store.dispatch({
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
        // fallback
        this.notificationPermissionGranted = true;
        LOG.notifications("NotificationHandler: Received notification", notification);
        if (Platform.OS === 'android') {
          NotificationParser.handle(notification)
        }
        else {
          NotificationParser.handle(notification.data)
          notification.finish(PushNotificationIOS.FetchResult.NoData)
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


export const NotificationHandler = new NotificationHandlerClass();
