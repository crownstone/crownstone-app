import {NotificationParser} from "../notifications/NotificationParser";
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import {Platform} from "react-native";
import {LOG, LOGd, LOGe, LOGi, LOGw} from "../logging/Log";
import {Util} from "../util/Util";
import {CLOUD} from "../cloud/cloudAPI";
import {core} from "../Core";
import PushNotification, {Importance} from 'react-native-push-notification';

class NotificationHandlerClass {
  requesting = false;

  notificationPermissionGranted = false;

  init() {
    this.configure();

    let state = core.store.getState();
    let device = Util.data.getDevice(state);
    // double check the token if we should have one.
    if (state.app.notificationToken === null || device === null) {
      this.notificationPermissionGranted = false;
      LOG.info("NotificationHandler: Request for notification permission submitted from loadStore");
      this.request();
    }
  }

  configure() {
    LOG.info("NotificationHandler: Configuring Push");
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
        LOG.info("NotificationHandler: Got notification token!", tokenData, tokenData.token);

        let state = core.store.getState();
        let deviceId = Util.data.getCurrentDeviceId(state);
        if (!deviceId) { return LOGe.notifications("NotificationHandler: NO DEVICE CONFIGURED"); }

        let installationId = state.devices[deviceId].installationId;

        if (!installationId || !state.installations[installationId]) {
          LOGw.info("NotificationHandler: No Installation found.");
          CLOUD.forDevice(deviceId).createInstallation({ deviceType: Platform.OS, deviceToken: tokenData.token })
            .then((installation) => {
              LOG.info("NotificationHandler: Creating new installation and connecting it to the device.");
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
              LOGe.info("NotificationHandler: Error during creation of Installation", err?.message);
            });
        }
        else {
          LOGd.info("NotificationHandler: Installation found, checking token.");
          if (state.installations[installationId].deviceToken !== tokenData.token) {
            LOGi.info("NotificationHandler: Installation found, UPDATING token.");
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
      onNotification: (notification) => {
        // fallback
        this.notificationPermissionGranted = true;
        LOG.info("NotificationHandler: Received notification", notification);
        NotificationParser.handle(notification.data)
        if (Platform.OS === 'ios') {
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

    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: "crownstone-notification-channel", // (required)
          channelName: "Crownstone notifications", // (required)
        },
        (created) => console.log(`NotificationHandler: Created channel returned '${created}'`) // (optional) callback returns whether the channel was created, false means it already existed.
      );
    }
  }

  request() {
    if (this.requesting === false) {
      LOGi.info("NotificationHandler: Requesting push permissions");
      this.requesting = true;
      PushNotification.requestPermissions();
    }
    else {
      LOGi.info("NotificationHandler: Push permissions request already pending.");
    }
  }
}


export const NotificationHandler = new NotificationHandlerClass();
