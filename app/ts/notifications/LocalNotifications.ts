import { Languages } from "../Languages";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalNotifications", key)(a,b,c,d,e);
}

import {AppState, Platform, Vibration} from 'react-native'
import {LOG, LOGi} from "../logging/Log";
import {Util} from "../util/Util";
const PushNotification = require('react-native-push-notification');
import {canUseIndoorLocalizationInSphere} from "../util/DataUtil";
import {MessageCenter} from "../backgroundProcesses/MessageCenter";
import {MapProvider} from "../backgroundProcesses/MapProvider";


const MESSAGE_SELF_SENT_TIMEOUT = 30 * 1000; // 30 seconds

export const LocalNotifications = {
  _handleNewMessage(messageData, state, alreadyNotified = false) {
    if (!messageData.sphereId) {
      return;
    }

    let localSphereId = MapProvider.cloud2localMap.spheres[messageData.sphereId];
    let localLocationId = MapProvider.cloud2localMap.locations[messageData.triggerLocationId];
    if (!localSphereId) { return }

    LOG.info("LocalNotifications: received new message!", messageData);
    // do we have this sphere?
    let sphere = state.spheres[localSphereId];
    if (state && sphere) {
      // check if in the sphere
      if (sphere.state.present === true) {
        if (localLocationId) {
          // check if you're in this location or if you can't be in a location due to disabled localization
          // return if we do NOT have to deliver the message RIGHT NOW
          let canDoLocalization = canUseIndoorLocalizationInSphere(state, messageData.localSphereId);
          if (canDoLocalization && Util.data.getUserLocationIdInSphere(state, messageData.localSphereId, state.user.userId) !== localLocationId) {
            // we will deliver this message on moving to the other room.
            return false;
          }
        }

        let userId = state.user.userId;
        // search local messages in this sphere to see if this user has recently composed a message with this content.
        if (messageData.ownerId === userId) {
          let sphereMessageIds = Object.keys(sphere.messages);
          let now = Date.now();
          for (let i = 0; i < sphereMessageIds.length; i++) {
            let message = sphere.messages[sphereMessageIds[i]];

            if (message.config.senderId === userId && message.config.content === messageData.content) {
              LOGi.messages("Matched message!");
              if (now - message.config.updatedAt < MESSAGE_SELF_SENT_TIMEOUT || now - message.config.sentAt < MESSAGE_SELF_SENT_TIMEOUT) {
                LOGi.messages("LocalNotifications: Marking the message as delivered and read because it has been sent < 30 seconds ago:", now - message.config.sentAt, now - message.config.updatedAt);
                MessageCenter.deliveredMessage(localSphereId, sphereMessageIds[i]);
                MessageCenter.readMessage(localSphereId, sphereMessageIds[i]);
                return;
              }
              else {
                break;
              }
            }
          }
        }


        // add a flag that there is a new message in this sphere.
        if (sphere.state.newMessageFound === false) {
          MessageCenter.newMessageStateInSphere(localSphereId, true);
        }

        if (AppState.currentState !== 'active') {
          LOG.info("LocalNotifications: on the back, notify.");
          let data = { source: 'localNotification', type:'newMessage', messageId: messageData.id, sphereId: messageData.sphereId }; // this HAS to be the cloud sphereId since it is pushed to the notification
          // deliver message through local notification.
          if (Platform.OS === 'android') {
            PushNotification.localNotification({
              channelId: 'messages-notification-channel',
              tag: 'newMessage',

              data: data,

              title: lang("New_Message_Found"),
              message: messageData.content, // (required)
              // ticker (optional) text which can be used for text to speech
              // color: "blue", // (optional) Color of the text. Default: system default
              autoCancel: true, // Make this notification automatically dismissed when the user touches it.
              playSound: true, // (optional) default: true
              //repeatType: 'day', // (Android only) Repeating interval. Could be one of `week`, `day`, `hour`, `minute, `time`. If specified as time, it should be accompanied by one more parameter 'repeatTime` which should the number of milliseconds between each interval
              //actions: '["OK"]',  // (Android only) See the doc for notification actions to know more
              ongoing: false,
            });
          }
          else {
            PushNotification.localNotification({
              category: 'newMessage',

              data: data,
              userInfo: data,

              title: lang("New_Message_Found_n"), // (optional, for iOS this is only used in apple watch, the title will be the app name on other iOS devices)
              message: messageData.content, // (required)
              playSound: true, // (optional) default: true
            });
          }
          PushNotification.setApplicationIconBadgeNumber(1);
        }
        else {
          if (!alreadyNotified) {
            LOG.info("LocalNotifications: on the front, just vibe.");
            // notify the user by vibration that the crownstone will be switched.
            Vibration.vibrate(200, false);
          }
        }

        return true;
      }
    }

    return false;
  },


  sendLocalPopup: function(text, sound = false) {
    if (AppState.currentState !== 'active') {
      let data = {source: 'crownstonePopup', type: 'info'};
      if (Platform.OS === 'android') {
        PushNotification.localNotification({
          channelId:"messages-notification-channel",
          tag: 'crownstonePopup',
          data: data,
          message: text, // (required)
          autoCancel: true, // Make this notification automatically dismissed when the user touches it.
          playSound: sound, // (optional) default: true
          group: "t2t", // Doesn't work yet?
          ongoing: false,
        });
      }
      else {
        PushNotification.localNotification({
          category: 'crownstonePopup',
          data: data,
          userInfo: data,
          message: text,
          playSound: sound, // (optional) default: true
        });
      }
    }
    else {
      Vibration.vibrate(200, false);
    }
  },



};
