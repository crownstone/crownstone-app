import { core } from "../core";


class OnScreenNotificationsClass {
  notifications : { [key:string] :onScreenNotificationPayload } = {};


  getNotifications(sphereId) {
    let ids = Object.keys(this.notifications);
    let result = {};
    // ids.forEach((id) => {
    //   if (!this.notifications[id].sphereId || this.notifications[id].sphereId === sphereId) {
    //     result[id] = this.notifications[id];
    //   }
    // })
    return result;
  }

  hasNotifications(sphereId) {
    return Object.keys(this.getNotifications(sphereId)).length > 0;
  }

  count(sphereId) {
    return Object.keys(this.getNotifications(sphereId)).length;
  }

  setNotification(notificationData: onScreenNotificationPayload) {
    if (this.notifications[notificationData.id] === undefined ) {
      this.notifications[notificationData.id] = notificationData;
      core.eventBus.emit('onScreenNotificationsUpdated');
    }
  }

  removeNotification(notificationId) {
    if ( this.notifications[notificationId] !== undefined ) {
      delete this.notifications[notificationId];
      core.eventBus.emit('onScreenNotificationsUpdated');
    }
  }

  removeAllNotificationsFrom(sourceId) {
    let ids = Object.keys(this.notifications);
    let changes = false;
    ids.forEach((id) => {
      if (this.notifications[id].source === sourceId) {
        changes = true;
        delete this.notifications[id];
      }
    });

    if (changes) {
      core.eventBus.emit('onScreenNotificationsUpdated');
    }
  }




}

export const OnScreenNotifications = new OnScreenNotificationsClass();