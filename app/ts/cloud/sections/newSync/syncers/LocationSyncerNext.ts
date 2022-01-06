import {MapProvider} from "../../../../backgroundProcesses/MapProvider";
import {Get} from "../../../../util/GetUtil";
import {CLOUD} from "../../../cloudAPI";
import {FileUtil} from "../../../../util/FileUtil";
import {LOGe} from "../../../../logging/Log";
import {SyncSphereInterface} from "./base/SyncSphereInterface";
import {LocationTransferNext} from "../transferrers/LocationTransferNext";
import {SyncNext} from "../SyncNext";
import {SyncUtil} from "../../../../util/SyncUtil";


export class LocationSyncerNext extends SyncSphereInterface<LocationData, LocationDataConfig, cloud_Location, cloud_Location_settable> {

  constructor(options: SyncInterfaceOptions) {
    super(LocationTransferNext, options)
  }

  getLocalId() {
    return this.globalCloudIdMap.locations[this.cloudId] || MapProvider.cloud2localMap.locations[this.cloudId];
  }

  createLocal(cloudData: cloud_Location) {
    let newData = LocationTransferNext.getCreateLocalAction(this.localSphereId, LocationTransferNext.mapCloudToLocal(cloudData))
    this.actions.push(newData.action)
    this.globalCloudIdMap.locations[this.cloudId] = newData.id;
    this.sphereIdMap.locations[this.cloudId] = newData.id;

    if (cloudData.imageId) {
      this._downloadLocationImage(cloudData);
    }
  }

  updateLocal(cloudData: cloud_Location) {
    this.actions.push(
      LocationTransferNext.getUpdateLocalAction(this.localSphereId, this.localId, LocationTransferNext.mapCloudToLocal(cloudData))
    );

    // check if we have to do things with the image
    let location = Get.location(this.localSphereId, this.localId);
    if (location.config.pictureId !== cloudData.imageId) {
      if (!cloudData.imageId) {
        this.transferPromises.push(FileUtil.safeDeleteFile(location.config.picture));
      }
      else {
        this._downloadLocationImage(cloudData);
      }
    }
  }

  setReplyWithData(reply: SyncRequestSphereData, cloudData: cloud_Location) {
    let location = Get.location(this.localSphereId, this.localId);
    if (!location) { return null; }

    SyncUtil.constructReply(reply,['locations', this.cloudId],
      LocationTransferNext.mapLocalToCloud(location)
    );

    if (location.config.pictureId !== cloudData.imageId) {
      if (!location.config.pictureId) {
        this.transferPromises.push(CLOUD.forLocation(this.localId).deleteLocationPicture().catch((err) => {}))
      }
      else {
        // uploading the image is done by the event syncer, not this syncer
      }
    }
  }

  _downloadLocationImage(cloudData: cloud_Location) {
    if (!cloudData.imageId) { return; }

    let localId = this.getLocalId();
    let toPath = FileUtil.getPath(localId + '.jpg');
    this.transferPromises.push(
      CLOUD.forLocation(cloudData.id).downloadLocationPicture(toPath)
        .then((picturePath) => {
          this.actions.push({type:'LOCATION_UPDATE_PICTURE', sphereId: this.localSphereId, locationId: localId, data:
              { picture: picturePath, pictureId: cloudData.imageId, pictureTaken: Date.now() }
          });
        })
        .catch((err) => { LOGe.cloud("LocationSyncer: Could not download location picture to ", toPath, ' err:', err?.message); })
    );
  }


  static prepare(sphere: SphereData) : {[itemId:string]: RequestItemCoreType} {
    return SyncNext.gatherRequestData(sphere,{key:'locations', type:'location'});
  }
}

