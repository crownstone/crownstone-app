import {BatchCommandHandler} from "../logic/BatchCommandHandler";
const PushNotification = require('react-native-push-notification');
import { Platform } from 'react-native';
import { LOG } from "../logging/Log";
import { eventBus } from '../util/EventBus'
import { Util } from "../util/Util";
import { CLOUD } from "../cloud/cloudAPI";
import { INTENTS } from "../native/libInterface/Constants";
import {StoneUtil} from "../util/StoneUtil";

class NotificationHandlerClass {
  store: any = {};
  requesting = false;

  constructor() {}

  _loadStore(store) {
    this.store = store;
    this.configure();

    let state = this.store.getState();
    let device = Util.data.getDevice(state);
    // double check the token if we should have one.
    if (state.app.notificationToken !== null || device) {
      LOG.info("NotificationHandler: Request for notification permission submitted from _loadStore");
      this.request();
    }
  }

  _verifyState() {
    let state = this.store.getState();
    let device = Util.data.getDevice(state);
    // double check the token if we should have one.
    if (state.app.notificationToken !== null || device) {
      LOG.info("NotificationHandler: Request for notification permission submitted from _loadStore");
      this.request();
    }
  }

  configure() {
    LOG.info("NotificationHandler: Configuring Push");
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
        LOG.info("NotificationHandler: Got notification token!", tokenData, tokenData.token);

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
              LOG.error("NotificationHandler: Error during creation of Installation", err);
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
        LOG.info("NotificationHandler: Received notification",notification)
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
        LOG.info("NotificationHandler: onRemoteFetch",x)
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
      LOG.info("NotificationHandler: Requesting push permissions");
      this.requesting = true;
      PushNotification.requestPermissions();
    }
    else {
      LOG.info("NotificationHandler: Push permissions request already pending.");
    }
  }
}


class NotificationParserClass {
  store: any = {};

  constructor() {}

  _loadStore(store) {
    this.store = store;
  }

  handle(messageData) {
    if (messageData && messageData.command && messageData.sphereId && messageData.stoneId) {
      let state = this.store.getState();
      if (state && state.spheres[messageData.sphereId] && state.spheres[messageData.sphereId].stones[messageData.stoneId]) {
        switch(messageData.command) {
          case 'setSwitchStateRemotely':
            LOG.info("NotificationParser: switching based on notification", messageData);
            StoneUtil.switchBHC(
              messageData.sphereId,
              messageData.stoneId,
              state.spheres[messageData.sphereId].stones[messageData.stoneId],
              Math.min(1,Math.max(0,messageData.switchState || 0)),
              this.store,
              {},
              (err) => {},
              INTENTS.remotely,
              25,
              'from handle in NotificationParser'
            );
            BatchCommandHandler.executePriority();
            break;
        }
      }

    }
  }

}

export const NotificationHandler = new NotificationHandlerClass();
export const NotificationParser  = new NotificationParserClass();