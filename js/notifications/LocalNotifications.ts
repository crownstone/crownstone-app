import {AppState, Vibration} from 'react-native'
import {LOG} from "../logging/Log";
import {Util} from "../util/Util";
const PushNotification = require('react-native-push-notification');
import {canUseIndoorLocalizationInSphere} from "../util/DataUtil";
import {eventBus} from "../util/EventBus";
import Toast from 'react-native-same-toast';

export const LocalNotifications = {
  _handleNewMessage(messageData, state) {
    if (!messageData.sphereId) {
      return;
    }

    LOG.info("LocalNotifications: received new message!", messageData);
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
            return false;
          }
        }

        if (AppState.currentState !== 'active') {
          LOG.info("LocalNotifications: on the back, notify.");
          let data = { source: 'localNotification', type:'newMessage', messageId: messageData.id, sphereId: messageData.sphereId };
          // deliver message through local notification.
          PushNotification.localNotification({
            category: 'newMessage',
            tag: 'newMessage',

            data: data,
            userInfo: data,

            title: "New Message Found", // (optional, for iOS this is only used in apple watch, the title will be the app name on other iOS devices)
            message: messageData.content, // (required)
            playSound: true, // (optional) default: true
            repeatType: 'minute', // (Android only) Repeating interval. Could be one of `week`, `day`, `hour`, `minute, `time`. If specified as time, it should be accompanied by one more parameter 'repeatTime` which should the number of milliseconds between each interval
            actions: '["OK"]',  // (Android only) See the doc for notification actions to know more
          });

          PushNotification.setApplicationIconBadgeNumber(1);
        }
        else {
          Toast.showWithGravity('  Message found!  ', Toast.SHORT, Toast.CENTER);
          LOG.info("LocalNotifications: on the front, just vibe.");
          // notify the user by vibration that the crownstone will be switched.
          Vibration.vibrate(200, false);
          eventBus.emit("newMessage");
        }

        return true;
      }
    }

    return false;
  }
};
