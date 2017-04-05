import {LOG} from "../logging/Log";
const PushNotification = require('react-native-push-notification');
import { eventBus } from '../util/EventBus'

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
        LOG.info("NotificationHandler: Got notification token!", token);
        console.log("NotificationHandler: Got notification token!", token);
        this.store.dispatch({
          type:'SET_NOTIFICATION_TOKEN',
          data: {
            notificationToken: token
          }
        })
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
    PushNotification.requestPermissions();
  }
}

export const NotificationHandler = new PushNotificationHandlerClass();