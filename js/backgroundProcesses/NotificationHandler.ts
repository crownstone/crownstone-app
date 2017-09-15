import {BatchCommandHandler} from "../logic/BatchCommandHandler";
const PushNotification = require('react-native-push-notification');
import { Platform } from 'react-native';
import { LOG } from "../logging/Log";
import { eventBus } from '../util/EventBus'
import { Util } from "../util/Util";
import { CLOUD } from "../cloud/cloudAPI";
import { INTENTS } from "../native/libInterface/Constants";
import { StoneUtil } from "../util/StoneUtil";
import { canUseIndoorLocalizationInSphere } from "../util/DataUtil";

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
        LOG.info("NotificationHandler: Received notification",notification);
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
    if (messageData && messageData.command) {
      let state = this.store.getState();
      switch(messageData.command) {
        case 'setSwitchStateRemotely':
          this._handleSetSwitchStateRemotely(messageData, state); break;
        case 'newMessage':
          this._handleNewMessage(messageData, state); break;
      }
    }
  }


  _handleNewMessage(messageData, state) {
    if (!messageData.sphereId) {
      return;
    }

    LOG.info("NotificationParser: received new message!", messageData);
    // do we have this sphere?
    if (state && state.spheres[messageData.sphereId]) {
      // check if in the sphere
      if (state.spheres[messageData.sphereId].config.present === true || true) {
        if (messageData.triggerLocationId) {
          // check if you're in this location or if you can't be in a location due to disabled localization
          // return if we do NOT have to deliver the message RIGHT NOW
          let canDoLocalization = canUseIndoorLocalizationInSphere(state, messageData.sphereId);
          if (canDoLocalization && Util.data.getUserLocationIdInSphere(state, messageData.sphereId, state.user.userId) !== messageData.triggerLocationId) {
            // we will deliver this message on moving to the other room.
            return;
          }
        }

        // deliver message through local notification.
        PushNotification.localNotification({
          /* Android Only Properties */
          // id: '0', // (optional) Valid unique 32 bit integer specified as string. default: Autogenerated Unique ID
          // ticker: "My Notification Ticker", // (optional)
          // autoCancel: true, // (optional) default: true
          // largeIcon: "ic_launcher", // (optional) default: "ic_launcher"
          // smallIcon: "ic_notification", // (optional) default: "ic_notification" with fallback for "ic_launcher"
          // bigText: "Message Found!", // (optional) default: "message" prop
          // subText: messageData.content, // (optional) default: none
          // color: "red", // (optional) default: system default
          vibrate: true, // (optional) default: true
          vibration: 300, // vibration length in milliseconds, ignored if vibrate=false, default: 1000
          // tag: 'some_tag', // (optional) add tag to message
          // group: "group", // (optional) add group to message
          // ongoing: false, // (optional) set whether this is an "ongoing" notification

          /* iOS only properties */
          // alertAction: // (optional) default: view
          // category: // (optional) default: null
          // userInfo: // (optional) default: null (object containing additional notification data)

          /* iOS and Android properties */
          title: "New Message Found", // (optional, for iOS this is only used in apple watch, the title will be the app name on other iOS devices)
          message: messageData.content, // (required)
          playSound: true, // (optional) default: true
          // soundName: 'default', // (optional) Sound to play when the notification is shown. Value of 'default' plays the default sound. It can be set to a custom sound such as 'android.resource://com.xyz/raw/my_sound'. It will look for the 'my_sound' audio file in 'res/raw' directory and play it. default: 'default' (default sound is played)
          // number: '1', // (optional) Valid 32 bit integer specified as string. default: none (Cannot be zero)
          repeatType: 'minute', // (Android only) Repeating interval. Could be one of `week`, `day`, `hour`, `minute, `time`. If specified as time, it should be accompanied by one more parameter 'repeatTime` which should the number of milliseconds between each interval
          actions: '["OK"]',  // (Android only) See the doc for notification actions to know more
      });

      PushNotification.setApplicationIconBadgeNumber(1);
      }
    }
  }

  _handleSetSwitchStateRemotely(messageData, state) {
    if (!messageData.sphereId || !messageData.stoneId) {
      return;
    }

    if (state && state.spheres[messageData.sphereId] && state.spheres[messageData.sphereId].stones[messageData.stoneId]) {
      LOG.info("NotificationParser: switching based on notification", messageData);
      StoneUtil.switchBHC(
        messageData.sphereId,
        messageData.stoneId,
        state.spheres[messageData.sphereId].stones[messageData.stoneId],
        Math.min(1, Math.max(0, messageData.switchState || 0)),
        this.store,
        {},
        (err) => {},
        INTENTS.remotely,
        25,
        'from handle in NotificationParser'
      );
      BatchCommandHandler.executePriority();
    }
  }

}

export const NotificationHandler = new NotificationHandlerClass();
export const NotificationParser  = new NotificationParserClass();