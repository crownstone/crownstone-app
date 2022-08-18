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
import { Get } from "../util/GetUtil";


const MESSAGE_SELF_SENT_TIMEOUT = 30 * 1000; // 30 seconds

export const LocalNotifications = {
  showMessageNotification(sphereId: sphereId, message: MessageData) {
    LOG.info("LocalNotifications: will show message", message);
    let sphere = Get.sphere(sphereId);
    if (!sphere) { return; }
    if (sphere.state.present !== true) { return; }

    LOG.info("LocalNotifications: on the background, notify.");
    let data = { source: 'localNotification', type:'newMessage', messageId: message.id, sphereId: sphereId };
    // deliver message through local notification.
    if (Platform.OS === 'android') {
      PushNotification.localNotification({
        channelId: 'messages-notification-channel',
        tag: 'newMessage',

        data: data,

        title: lang("New_Message_Found"),
        message: message.content, // (required)
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
        message: message.content, // (required)
        playSound: true, // (optional) default: true
      });
    }
  },


  // sendLocalPopup: function(text, sound = false) {
  //   if (AppState.currentState !== 'active') {
  //     let data = {source: 'crownstonePopup', type: 'info'};
  //     if (Platform.OS === 'android') {
  //       PushNotification.localNotification({
  //         channelId:"messages-notification-channel",
  //         tag: 'crownstonePopup',
  //         data: data,
  //         message: text, // (required)
  //         autoCancel: true, // Make this notification automatically dismissed when the user touches it.
  //         playSound: sound, // (optional) default: true
  //         group: "t2t", // Doesn't work yet?
  //         ongoing: false,
  //       });
  //     }
  //     else {
  //       PushNotification.localNotification({
  //         category: 'crownstonePopup',
  //         data: data,
  //         userInfo: data,
  //         message: text,
  //         playSound: sound, // (optional) default: true
  //       });
  //     }
  //   }
  //   else {
  //     Vibration.vibrate(200, false);
  //   }
  // },



};
