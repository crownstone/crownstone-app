import { DataUtil } from "../../../../util/DataUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { Get } from "../../../../util/GetUtil";
import { CLOUD } from "../../../cloudAPI";
import { FileUtil } from "../../../../util/FileUtil";
import { LOGe } from "../../../../logging/Log";
import { SyncSphereInterface } from "./base/SyncSphereInterface";
import { xUtil } from "../../../../util/StandAloneUtil";
import { SphereUserTransferNext } from "../transferrers/SphereUserTransferNext";
import { LocationTransferNext } from "../transferrers/LocationTransferNext";
import { SyncNext } from "../SyncNext";


export class SphereUserSyncerNext extends SyncSphereInterface<SphereUserData, SphereUserData, cloud_UserData, {}> {

  constructor(options: SyncInterfaceOptions) {
    super(SphereUserTransferNext, options)
  }


  getLocalId() {
    return this.globalCloudIdMap.users[this.localSphereId + this.cloudId] || MapProvider.cloud2localMap.users[this.localSphereId + this.cloudId]
  }


  createLocal(cloudData: cloud_UserData) {
    let newData = SphereUserTransferNext.getCreateLocalAction(this.localSphereId, SphereUserTransferNext.mapCloudToLocal(cloudData), cloudData.id)
    this.actions.push(newData.action)
    this.globalCloudIdMap.users[this.cloudId] = newData.id;

    if (cloudData.profilePicId) {
      this._downloadSphereUserImage(cloudData);
    }
  }

  updateLocal(cloudData: cloud_UserData) {
    this.actions.push(
      SphereUserTransferNext.getUpdateLocalAction(this.localSphereId, this.localId, SphereUserTransferNext.mapCloudToLocal(cloudData))
    );

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
    return;
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

  static prepare(sphere: SphereData) : {[itemId:string]: RequestItemCoreType} {
    return SyncNext.gatherRequestData(sphere,{key:'users', type:'sphereUser', cloudIdGetter: (item) => { return item.id; }});
  }
}

