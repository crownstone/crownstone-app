import { CLOUD } from "../cloud/cloudAPI";
import { MessageCenter } from "../backgroundProcesses/MessageCenter";
import { LOGe } from "../logging/Log";
import { NotificationHandler } from "../backgroundProcesses/NotificationHandler";
import { InviteCenter } from "../backgroundProcesses/InviteCenter";

class CloudPollerClass {

  poll(forSync: boolean = false) : Promise<void> {
    if (!NotificationHandler.notificationPermissionGranted || forSync) {
      return new Promise<void>((resolve, reject) => { resolve(); })
        .then(() => { return forSync ? null : CLOUD.syncUsers(); })
        .then(() => { return                  InviteCenter.checkForInvites(); })
        .then(() => { return                  MessageCenter.checkForMessages(); })
        .catch((err) => {
          LOGe.cloud("CloudPoller: Failed to poll.", err);
        })
    }
    else {
      return Promise.resolve();
    }
  }

}

export const CloudPoller = new CloudPollerClass();