



class OnScreenNotificationsClass {

  sphereUpdateAvailable: boolean;

  constructor() {
    this.sphereUpdateAvailable = true;
  }

  hasNotifications() {
    return this.sphereUpdateAvailable;
  }


}

export const OnScreenNotifications = new OnScreenNotificationsClass()