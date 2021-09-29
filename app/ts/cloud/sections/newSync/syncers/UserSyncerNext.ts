import { DataUtil } from "../../../../util/DataUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { Get } from "../../../../util/GetUtil";
import { CLOUD } from "../../../cloudAPI";
import { FileUtil } from "../../../../util/FileUtil";
import { LOGe } from "../../../../logging/Log";
import { core } from "../../../../Core";
import { SyncInterface } from "./base/SyncInterface";


export class UserSyncerNext extends SyncInterface<UserData, cloud_User, cloud_User_settable> {

  constructor(options: SyncInterfaceViewOptions) {
    super({cloudId: null, ...options})
  }

  getLocalId() {
    let state = core.store.getState()
    return state.user.userId;
  }

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  static mapLocalToCloud(localData: UserData) : cloud_User_settable  {
    let result : cloud_User_settable = {
      firstName:           localData.firstName,
      lastName:            localData.lastName,
      email:               localData.email,
      language:            localData.language,
      new:                 localData.isNew,
      uploadLocation:      localData.uploadLocation,
      uploadSwitchState:   localData.uploadSwitchState,
      uploadDeviceDetails: localData.uploadDeviceDetails,
      updatedAt:           new Date(localData.updatedAt).toISOString(),
    };
    return result;
  }


  static mapCloudToLocal(cloudUser: cloud_User): Partial<UserData>{
    return {
      firstName:           cloudUser.firstName,
      lastName:            cloudUser.lastName,
      email:               cloudUser.email,
      userId:              cloudUser.id,
      isNew:               cloudUser.new,
      language:            cloudUser.language,
      uploadLocation:      cloudUser.uploadLocation,
      uploadSwitchState:   cloudUser.uploadSwitchState,
      uploadDeviceDetails: cloudUser.uploadDeviceDetails,
      updatedAt:           new Date(cloudUser.updatedAt).valueOf(),
    }
  }


  updateCloudId(cloudId) {
    // not required. A user is not "made" in cloud via sync.
  }

  removeFromLocal() {
    // not required. A user is not "deleted" in cloud via sync.
  }

  createLocal(cloudData: cloud_User) {
    this.actions.push({type:"ADD_USER", data: UserSyncerNext.mapCloudToLocal(cloudData) })

    if (cloudData.profilePicId) {
      this._downloadProfileImage(cloudData);
    }
  }

  updateLocal(cloudData: cloud_User) {
    this.actions.push({type:"UPDATE_USER", data: UserSyncerNext.mapCloudToLocal(cloudData) })

    // check if we have to do things with the image
    let user = Get.user()
    if (user.pictureId !== cloudData.profilePicId) {
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
      reply.user = UserSyncerNext.mapLocalToCloud(user)
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

