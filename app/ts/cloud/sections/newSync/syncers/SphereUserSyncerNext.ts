import { DataUtil } from "../../../../util/DataUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { SyncInterface } from "./SyncInterface";
import { Get } from "../../../../util/GetUtil";
import { CLOUD } from "../../../cloudAPI";
import { FileUtil } from "../../../../util/FileUtil";
import { LOGe } from "../../../../logging/Log";


export class SphereUserSyncerNext extends SyncInterface<SphereUserData, cloud_UserData, {}> {

  getLocalId() {
    return this.globalCloudIdMap.users[this.cloudSphereId + this.cloudId] || MapProvider.cloud2localMap.users[this.cloudSphereId + this.cloudId]
  }


  static mapCloudToLocal(cloudSphereUser: cloud_UserData, localSphereUserId?: string) : SphereUserDataLocalSettable {
    return {
      firstName:         cloudSphereUser.firstName,
      lastName:          cloudSphereUser.lastName,
      email:             cloudSphereUser.email,
      invitationPending: cloudSphereUser.invitePending,
      pictureId:         cloudSphereUser.profilePicId,
      accessLevel:       cloudSphereUser.accessLevel,
      updatedAt:         new Date(cloudSphereUser.updatedAt).valueOf()
    }
  }

  _mapCloudToLocal(cloudSphereUser: cloud_UserData) {
    let localSphereUserId = this.globalCloudIdMap.users[cloudSphereUser.id] ?? MapProvider.cloud2localMap.users[cloudSphereUser.id] ?? cloudSphereUser.id;

    return SphereUserSyncerNext.mapCloudToLocal(cloudSphereUser, localSphereUserId);
  }

  removeFromLocal() {
    this.actions.push({type:"REMOVE_SPHERE_USER", sphereId: this.localSphereId, sphereUserId: this.localId });
  }

  createLocal(cloudData: cloud_UserData) {
    let newId = this._generateLocalId();
    this.globalCloudIdMap.users[this.cloudSphereId + this.cloudId] = newId;
    this.actions.push({type:"ADD_SPHERE_USER", sphereId: this.localSphereId, sphereUserId: newId, data: this._mapCloudToLocal(cloudData) })

    if (cloudData.profilePicId) {
      this._downloadSphereUserImage(cloudData);
    }
  }

  updateLocal(cloudData: cloud_UserData) {
    this.actions.push({type:"UPDATE_SPHERE_USER", sphereId: this.localSphereId, sphereUserId: this.localId, data: this._mapCloudToLocal(cloudData) })

    // check if we have to do things with the image
    let sphereUser = Get.sphereUser(this.localSphereId, this.localId);

    if (sphereUser.pictureId !== cloudData.profilePicId) {
      if (!cloudData.profilePicId) {
        this.transferPromises.push(FileUtil.safeDeleteFile(sphereUser.picture));
      }
      else {
        this._downloadSphereUserImage(cloudData);
      }
    }
  }

  // sphere users will not be uploaded to the cloud via sync. There are specific endpoints for this.
  setReplyWithData(reply: SyncRequestSphereData, cloudData: cloud_UserData) {
    return null
  }

  _downloadSphereUserImage(cloudData: cloud_UserData) {
    if (!cloudData.profilePicId) { return; }

    let toPath = FileUtil.getPath(this.localId + '.jpg');
    this.transferPromises.push(
      CLOUD.getUserPicture(this.cloudSphereId, cloudData.email, cloudData.id)
        .then((picturePath) => {
          this.actions.push({type:'UPDATE_SPHERE_USER', sphereId: this.localSphereId, sphereUserId: this.localId, data:
              { picture: picturePath, pictureId: cloudData.profilePicId }
          });
        })
        .catch((err) => { LOGe.cloud("SphereUserSyncer: Could not download sphereUser picture to ", toPath, ' err:', err); })
    );
  }
}

