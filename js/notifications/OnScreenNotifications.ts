



class OnScreenNotificationsClass {

  sphereUpdateAvailable: boolean;

  constructor() {
    this.sphereUpdateAvailable = false;
  }

  hasNotifications() {
    return this.sphereUpdateAvailable;
  }


}

export const OnScreenNotifications = new OnScreenNotificationsClass()