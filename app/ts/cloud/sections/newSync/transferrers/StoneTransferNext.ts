import { xUtil } from "../../../../util/StandAloneUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { CLOUD } from "../../../cloudAPI";
import { core } from "../../../../Core";
import { GenerateSphereTransferFunctions } from "./base/TransferBase";


export const StoneTransferNext : TransferSphereTool<StoneData, StoneDataConfig, cloud_Stone, cloud_Stone_settable> = {

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  mapLocalToCloud(localData: StoneData) : cloud_Stone_settable {
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
  },


   mapCloudToLocal(cloudStone: cloud_Stone, localLocationId?: string) : Partial<StoneDataConfig> {
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
  },


  getCreateLocalAction(localSphereId: string, data: Partial<StoneDataConfig>) : {id: string, action: DatabaseAction } {
    let newId = xUtil.generateLocalId();
    let action = {type:"ADD_STONE", sphereId: localSphereId, stoneId: newId, data: data };
    return {id: newId, action};
  },


  getUpdateLocalCloudIdAction(localSphereId: string, localItemId: string, cloudId: string) : DatabaseAction {
    return {type:"UPDATE_STONE_CLOUD_ID", sphereId: localSphereId, stoneId: localItemId, data: {cloudId}};
  },


  getUpdateLocalAction(localSphereId: string, localItemId: string, data: Partial<StoneDataConfig>) : DatabaseAction {
    return {type:"UPDATE_STONE_CONFIG", sphereId: localSphereId, stoneId: localItemId, data: data }
  },


  getRemoveFromLocalAction(localSphereId: string, localItemId: string) : DatabaseAction {
    return {type:"REMOVE_STONE", sphereId: localSphereId, stoneId: localItemId };
  },


  async createOnCloud(localSphereId: string, data: StoneData) : Promise<cloud_Stone> {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    let cloudItem = await CLOUD.forSphere(cloudSphereId).createStone(StoneTransferNext.mapLocalToCloud(data));
    core.store.dispatch(StoneTransferNext.getUpdateLocalCloudIdAction(localSphereId, data.id, cloudItem.id));
    return cloudItem;
  },


  async updateOnCloud(localSphereId: string, data: StoneData) : Promise<void> {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    await CLOUD.forSphere(cloudSphereId).updateStone(data.id, StoneTransferNext.mapLocalToCloud(data));
  },


  async removeFromCloud(localSphereId: string, localId: string) : Promise<void> {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    await CLOUD.forSphere(cloudSphereId).deleteStone(localId);
  },

  ...GenerateSphereTransferFunctions(this)
}

