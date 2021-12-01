import { Get } from "../../../../util/GetUtil";
import { CLOUD } from "../../../cloudAPI";
import { FileUtil } from "../../../../util/FileUtil";
import { LOGe } from "../../../../logging/Log";
import { core } from "../../../../Core";
import { SyncInterface } from "./base/SyncInterface";
import { UserTransferNext } from "../transferrers/UserTransferNext";


export class UserSyncerNext extends SyncInterface<UserData, UserData, cloud_User, cloud_User_settable> {

  constructor(options: SyncInterfaceViewOptions) {
    super(UserTransferNext, {cloudId: null, ...options})
  }

  getLocalId() {
    let state = core.store.getState()
    return state.user.userId;
  }

  updateCloudId(cloudId) {
    // not required. A user is not "made" in cloud via sync.
  }

  removeFromLocal() {
    // not required. A user is not "deleted" in cloud via sync.
  }

  createLocal(cloudData: cloud_User) {
    // not required. A main user (different from a sphere user) is not created via sync.
  }

  updateLocal(cloudData: cloud_User) {
    this.actions.push(UserTransferNext.getUpdateLocalAction(null, UserTransferNext.mapCloudToLocal(cloudData)));

    // check if we have to do things with the image
    let user = Get.user();
    if (user.pictureId !== cloudData.profilePicId || cloudData.profilePicId && !user.picture) {
      if (!cloudData.profilePicId) {
        this.transferPromises.push(FileUtil.safeDeleteFile(user.picture));
      }
      else {
        this._downloadProfileImage(cloudData);
      }
    }
  }

  setReplyWithData(reply: SyncRequest, cloudData: cloud_User) {
    let user = Get.user()
    if (!user) { return null; }
    if (reply.user === undefined) {
      reply.user = UserTransferNext.mapLocalToCloud(user)
    }
    if (user.pictureId !== cloudData.profilePicId) {
      if (!user.pictureId) {
        this.transferPromises.push(CLOUD.removeProfileImage().catch((err) => {}))
      }
      else {
        // uploading the image is done by the event syncer, not this syncer
      }
    }
  }

  _downloadProfileImage(cloudData: cloud_User) {
    if (!cloudData.profilePicId) { return; }
    let toPath = FileUtil.getPath(this.localId + '.jpg');
    this.transferPromises.push(
      CLOUD.downloadProfileImage(toPath)
        .then((picturePath) => {
          this.actions.push({type:'USER_APPEND', data:{ picture: picturePath, pictureId: cloudData.profilePicId }});
        })
        .catch((err) => { LOGe.cloud("UserSyncer: Could not download profile picture to ", toPath, ' err:', err);})
    );
  }
}

