import { DataUtil } from "../../../../util/DataUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { SyncInterface } from "./SyncInterface";
import { Get } from "../../../../util/GetUtil";



export class StoneSyncerNext extends SyncInterface<StoneData, cloud_Stone, cloud_Stone_settable> {

  getLocalId() {
    return this.globalCloudIdMap.stones[this.cloudId] || MapProvider.cloud2localMap.stones[this.cloudId];
  }

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  static mapLocalToCloud(localData: StoneData) : cloud_Stone_settable | null {
    let result : cloud_Stone_settable = {
      name:              localData.config.name,
      address:           localData.config.macAddress,
      description:       localData.config.description,
      type:              localData.config.type,
      major:             localData.config.iBeaconMajor,
      minor:             localData.config.iBeaconMinor,
      uid:               localData.config.uid,
      icon:              localData.config.icon,
      firmwareVersion:   localData.config.firmwareVersion,
      bootloaderVersion: localData.config.bootloaderVersion,
      hardwareVersion:   localData.config.hardwareVersion,
      hidden:            localData.config.hidden,
      locked:            localData.config.locked,
      locationId:        MapProvider.local2cloudMap.locations[localData.config.locationId] || localData.config.locationId || null,
      updatedAt:         new Date(localData.config.updatedAt).toISOString(),
    };
    return result;
  }


  static mapCloudToLocal(cloudStone: cloud_Stone, localLocationId?: string) : Partial<StoneDataConfig> {
    localLocationId = localLocationId ?? MapProvider.cloud2localMap.locations[cloudStone.locationId] ?? cloudStone.locationId;

    let result : Partial<StoneDataConfig> = {
      name:              cloudStone.name,
      description:       cloudStone.description,
      icon:              cloudStone.icon,
      uid:               cloudStone.uid,
      type:              cloudStone.type,
      iBeaconMajor:      cloudStone.major,
      iBeaconMinor:      cloudStone.minor,
      cloudId:           cloudStone.id,
      firmwareVersion:   cloudStone.firmwareVersion,
      bootloaderVersion: cloudStone.bootloaderVersion,
      hardwareVersion:   cloudStone.hardwareVersion,
      locationId:        localLocationId ?? null,
      macAddress:        cloudStone.address,
      locked:            cloudStone.locked,
      updatedAt:         new Date(cloudStone.updatedAt).valueOf()
    };

    return result;
  }

  _mapCloudToLocal(cloudStone: cloud_Stone) {
    let localLocationId = this.globalCloudIdMap.locations[cloudStone.locationId] ?? MapProvider.cloud2localMap.locations[cloudStone.locationId] ?? cloudStone.locationId;

    return StoneSyncerNext.mapCloudToLocal(cloudStone, localLocationId);
  }

  updateCloudId(cloudId) {
    this.actions.push({type:"UPDATE_STONE_CLOUD_ID", sphereId: this.localSphereId, stoneId: this.localId, data: {cloudId}});
  }

  removeFromLocal() {
    this.actions.push({type:"REMOVE_STONE", sphereId: this.localSphereId, stoneId: this.localId });
  }

  createLocal(cloudData: cloud_Stone) {
    let newId = this._generateLocalId();
    this.globalCloudIdMap.stones[this.cloudId] = newId;
    this.actions.push({type:"ADD_STONE", sphereId: this.localSphereId, stoneId: newId, data: this._mapCloudToLocal(cloudData) })
  }

  updateLocal(cloudData: cloud_Stone) {
    this.actions.push({type:"UPDATE_STONE_CONFIG", sphereId: this.localSphereId, stoneId: this.localId, data: this._mapCloudToLocal(cloudData) })
  }

  setReplyWithData(reply: SyncRequestSphereData) {
    let stone = Get.stone(this.localSphereId, this.localId);
    if (!stone) { return null; }
    if (reply.stones === undefined) {
      reply.stones = {};
    }
    if (reply.stones[this.cloudId] === undefined) {
      reply.stones[this.cloudId] = {};
    }
    reply.stones[this.cloudId].data = StoneSyncerNext.mapLocalToCloud(stone)
  }
}

