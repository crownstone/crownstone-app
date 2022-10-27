import {LOGe} from "../logging/Log";
import {NotificationHandler} from "../backgroundProcesses/NotificationHandler";
import {InviteCenter} from "../backgroundProcesses/InviteCenter";

class CloudPollerClass {

  poll(forSync: boolean = false) : Promise<void> {
    if (!NotificationHandler.notificationPermissionGranted || forSync) {
      return new Promise<void>((resolve, reject) => { resolve(); })
        .then(() => { return InviteCenter.checkForInvites();   })
        .catch((err) => {
          LOGe.cloud("CloudPoller: Failed to poll.", err?.message);
        })
    }
    else {
      return Promise.resolve();
    }
  }
}

export const CloudPoller = new CloudPollerClass();
