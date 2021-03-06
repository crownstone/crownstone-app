import { SyncInterface } from "./SyncInterface";
import { xUtil } from "../../../../util/StandAloneUtil";
import { DataUtil } from "../../../../util/DataUtil";
import { Get } from "../../../../util/GetUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";


export class SphereSyncer extends SyncInterface<SphereData, cloud_Sphere, cloud_Sphere_settable> {

  getLocalId() {
    return this.globalCloudIdMap.spheres[this.cloudId] || MapProvider.cloud2localMap.spheres[this.cloudId] || this.cloudId;
  }

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  static mapLocalToCloud(localSphereId: string, localId: string, localData: SphereData) : cloud_Sphere_settable | null {
    return {
      name: localData.config.name,
      uid:  localData.config.uid,
      uuid: localData.config.iBeaconUUID,
      aiName: localData.config.aiName,
      meshAccessAddress: localData.config.meshAccessAddress,
      updatedAt: new Date(localData.config.updatedAt).toISOString(),
    }
  }

  _mapLocalToCloud(localItem?: SphereData) : cloud_Sphere_settable | null {
    if (localItem) {
      let localItem = Get.sphere(this.localSphereId);
      if (!localItem) {
        return null;
      }
    }
    return SphereSyncer.mapLocalToCloud(this.localSphereId, this.localId, localItem);
  }

  mapCloudToLocal(cloudItem: cloud_Sphere) {
    return {
      name:              cloudItem.name,
      iBeaconUUID:       cloudItem.uuid, // ibeacon uuid
      uid:               cloudItem.uid,
      cloudId:           cloudItem.id,
      meshAccessAddress: cloudItem.meshAccessAddress,
      aiName:            cloudItem.aiName,
      latitude:          cloudItem.gpsLocation?.lat || undefined,
      longitude:         cloudItem.gpsLocation?.lng || undefined,
      updatedAt:         new Date(cloudItem.updatedAt).valueOf(),
    }
  }

  updateCloudId(cloudId) {
    this.actions.push({type:"UPDATE_SPHERE_CLOUD_ID", sphereId: this.localId, data: {cloudId}});
  }

  removeFromLocal() {
    this.actions.push({type:"REMOVE_SPHERE", sphereId: this.localId });
  }

  createLocal(cloudData: cloud_Sphere) {
    let newSphereId = this.generateLocalId();
    this.globalCloudIdMap.spheres[this.cloudId] = newSphereId;
    this.actions.push({type:"ADD_SPHERE", sphereId: newSphereId, data: this.mapCloudToLocal(cloudData) })
  }

  updateLocal(cloudData: cloud_Sphere) {
    this.actions.push({type:"UPDATE_SPHERE_CONFIG", sphereId: this.localId, data: this.mapCloudToLocal(cloudData) })
  }

  setReplyWithData(reply: SyncRequestSphereData) {
    let sphere = Get.sphere(this.localSphereId);
    if (!sphere) { return null; }
    if (reply[this.cloudId] === undefined) {
      reply[this.cloudId] = {};
    }
    reply[this.cloudId].data = this._mapLocalToCloud();
  }
}

