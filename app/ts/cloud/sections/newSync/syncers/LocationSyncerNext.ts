import { DataUtil } from "../../../../util/DataUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { SyncInterface } from "./SyncInterface";
import { Get } from "../../../../util/GetUtil";
import { CLOUD } from "../../../cloudAPI";
import { FileUtil } from "../../../../util/FileUtil";
import { LOGe } from "../../../../logging/Log";


export class LocationSyncerNext extends SyncInterface<LocationData, cloud_Location, cloud_Location_settable> {

  getLocalId() {
    return this.globalCloudIdMap.locations[this.cloudId] || MapProvider.cloud2localMap.locations[this.cloudId];
  }

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  static mapLocalToCloud(localData: LocationData) : cloud_Location_settable | null {
    let result : cloud_Location_settable = {
      name:      localData.config.name,
      uid:       localData.config.uid,
      icon:      localData.config.icon,
      updatedAt: new Date(localData.config.updatedAt).toISOString(),
    };
    return result;
  }


  static mapCloudToLocal(cloudLocation: cloud_Location, localLocationId?: string) {
    return {
      name:         cloudLocation.name,
      icon:         cloudLocation.icon,
      uid:          cloudLocation.uid,
      cloudId:      cloudLocation.id,
      updatedAt:    new Date(cloudLocation.updatedAt).valueOf()
    }
  }

  _mapCloudToLocal(cloudLocation: cloud_Location) {
    let localLocationId = this.globalCloudIdMap.locations[cloudLocation.id] ?? MapProvider.cloud2localMap.locations[cloudLocation.id] ?? cloudLocation.id;

    return LocationSyncerNext.mapCloudToLocal(cloudLocation, localLocationId);
  }

  updateCloudId(cloudId) {
    this.actions.push({type:"UPDATE_LOCATION_CLOUD_ID", sphereId: this.localSphereId, locationId: this.localId, data: {cloudId}});
  }

  removeFromLocal() {
    this.actions.push({type:"REMOVE_LOCATION", sphereId: this.localSphereId, locationId: this.localId });
  }

  createLocal(cloudData: cloud_Location) {
    let newId = this._generateLocalId();
    this.globalCloudIdMap.locations[this.cloudId] = newId;
    this.actions.push({type:"ADD_LOCATION", sphereId: this.localSphereId, locationId: newId, data: this._mapCloudToLocal(cloudData) })

    if (cloudData.imageId) {
      this._downloadLocationImage(cloudData);
    }
  }

  updateLocal(cloudData: cloud_Location) {
    this.actions.push({type:"UPDATE_LOCATION_CONFIG", sphereId: this.localSphereId, locationId: this.localId, data: this._mapCloudToLocal(cloudData) })

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
    if (reply.locations === undefined) {
      reply.locations = {};
    }
    if (reply.locations[this.cloudId] === undefined) {
      reply.locations[this.cloudId] = {};
    }
    reply.locations[this.cloudId].data = LocationSyncerNext.mapLocalToCloud(location);

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

    let toPath = FileUtil.getPath(this.localId + '.jpg');
    this.transferPromises.push(
      CLOUD.forLocation(cloudData.id).downloadLocationPicture(toPath)
      .then((picturePath) => {
        this.actions.push({type:'LOCATION_UPDATE_PICTURE', sphereId: this.localSphereId, locationId: this.localId, data:
            { picture: picturePath, pictureId: cloudData.imageId, pictureTaken: Date.now() }
        });
      })
      .catch((err) => { LOGe.cloud("LocationSyncer: Could not download location picture to ", toPath, ' err:', err); })
    );
  }
}

