import {LOG, LOGe, LOGi} from "../logging/Log";
import {LocalNotifications} from "../notifications/LocalNotifications";
import {core} from "../Core";
import {Get} from "../util/GetUtil";
import {
  MessageDeletedId,
  MessageDeletedTransferNext
} from "../cloud/sections/newSync/transferrers/MessageDeletedTransferNext";
import { MessageReadID, MessageReadTransferNext } from "../cloud/sections/newSync/transferrers/MessageReadTransferNext";
import { DataUtil } from "../util/DataUtil";
import { LocalizationCore } from "../localization/LocalizationCore";
import { Alert, AppState } from "react-native";

const PushNotification = require('react-native-push-notification');

class MessageCenterClass {
  _initialized: boolean = false;

  constructor() { }

  init() {
    LOG.info('LOADED STORE MessageCenter', this._initialized);
    if (this._initialized === false) {

      core.nativeBus.on(core.nativeBus.topics.enterSphere, (sphereId) => { this._checkForMessages("enter", sphereId); });
      core.nativeBus.on(core.nativeBus.topics.exitSphere,  (sphereId) => { this._checkForMessages("exit", sphereId); });
      core.eventBus.on('enterRoom',   (data)     => { this._checkForMessages("enter", data.sphereId, data.locationId); }); // data = {sphereId: sphereId, locationId: locationId}
      core.eventBus.on('exitRoom',    (data)     => { this._checkForMessages("exit", data.sphereId, data.locationId); });  // data = {sphereId: sphereId, locationId: locationId}
      core.eventBus.on("databaseChange", (data) => {
        let change = data.change;
        if (change.changeMessage) {
          // check if we need to deliver a new message or if we need to change the badge.
          let totalUnreadMessages = 0;
          for (let sphereId in data.sphereIds) {
            let currentLocation = LocalizationCore.getCurrentLocation(sphereId);

            if (currentLocation !== undefined) {
              // check if there is a message that is not notified
              let sphere = Get.sphere(sphereId);
              if (!sphere) { continue; }

              if (sphere.state.present) {
                this._checkForMessages("enter", sphereId, currentLocation);
              }
            }

            totalUnreadMessages += this.getUnreadMessages(sphereId);
          }

          this.setAppBadge(totalUnreadMessages);
        }
      });

    }
    this._initialized = true;
  }

  markMessageAsRead(sphereId: sphereId | MessageData, messageId: messageId) {
    // mark the message as read in the database
    let message: MessageData;
    if (typeof sphereId !== "string") {
      message = sphereId as MessageData;
    }
    else {
      message = Get.message(sphereId, messageId);
    }
    let containedSphereId = DataUtil.getSphereIdContainingMessage(message);
    MessageReadTransferNext.createLocal(containedSphereId, message.id, {value:true});
  }

  markMessageAsDeleted(sphereId: sphereId | MessageData, messageId: messageId) {
    // if we are the owner, delete the message from the cloud.
    // if not, mark the message as deleted from the device (and the cloud)
    let message: MessageData;
    if (typeof sphereId !== "string") {
      message = sphereId as MessageData;
    }
    else {
      message = Get.message(sphereId, messageId);
    }
    let containedSphereId = DataUtil.getSphereIdContainingMessage(message);
    if (message.senderId === Get.userId()) {
      // delete from cloud in cloudEnhancer
      core.store.dispatch({type:"REMOVE_MESSAGE", sphereId: containedSphereId, messageId: messageId});
    }
    else {
      // delete from device in cloudEnhancer
      MessageDeletedTransferNext.createLocal(containedSphereId, message.id, {value:true});
    }

  }

  _checkForMessages(eventType: MessageTriggerEvent, sphereId: sphereId, locationId: locationId = null) {
    // check for all unnotified messages in the sphere is they will be triggered by this event
    let sphere = Get.sphere(sphereId);
    if (!sphere) { return; }
    for (let messageId in sphere.messages) {
      let message : MessageData = sphere.messages[messageId];
      if (message.notified) { continue; }

      switch (eventType) {
        case "enter":
          if ((locationId && message.triggerLocationId === locationId || !locationId) && message.triggerEvent === "enter") {
            this.showMessage(sphereId, message);
          }
          break;
        case "exit":
          if ((locationId && message.triggerLocationId === locationId || !locationId) && message.triggerEvent === "exit") {
            this.showMessage(sphereId, message);
          }
          break;
      }
    }
  }



  showMessage(sphereId, message: MessageData) {
    let appState = AppState.currentState;
    // if (appState === "active") {
    //   this.showForegroundMessage()
    // }
    // else {
      LocalNotifications.showMessageNotification(sphereId, message);
      core.store.dispatch({type:"APPEND_MESSAGE", sphereId: sphereId, messageId: message.id, data:{notified:true}});
    // }
  }


  getUnreadMessages(sphereId: sphereId) : number {
    let sphere = Get.sphere(sphereId);
    if (!sphere) { return 0; }

    let unreadMessageCount = 0;
    for (let messageId in sphere.messages) {
      let message = sphere.messages[messageId];
      if (message.deleted?.[MessageDeletedId]?.value === true) { continue; }

      if (message.read?.[MessageReadID]?.value !== true) {
        unreadMessageCount++;
      }
    }

    return unreadMessageCount;
  }



  setAppBadge(amount: number) {
    if (AppState.currentState === "active") {
      PushNotification.setApplicationIconBadgeNumber(0);
    }
    else {
      PushNotification.setApplicationIconBadgeNumber(amount);
    }
  }

}

export const MessageCenter = new MessageCenterClass();
