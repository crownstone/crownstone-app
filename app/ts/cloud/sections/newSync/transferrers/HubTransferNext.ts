import { xUtil } from "../../../../util/StandAloneUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { CLOUD } from "../../../cloudAPI";
import { core } from "../../../../Core";


export const HubTransferNext : TransferSphereTool<HubData, HubDataConfig, cloud_Hub, cloud_Hub_settable> = {

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  mapLocalToCloud(localData: HubData) : cloud_Hub_settable {
    let result : cloud_Hub_settable = {
      name:          localData.config.name,
      linkedStoneId: MapProvider.local2cloudMap.stones[localData.config.linkedStoneId] || localData.config.linkedStoneId || null,
      locationId:    MapProvider.local2cloudMap.locations[localData.config.locationId] || localData.config.locationId    || null,
      updatedAt:     new Date(localData.config.updatedAt).toISOString(),
    };
    return result;
  },
  
  
  mapCloudToLocal(cloudHub: cloud_Hub, localStoneId?: string, localLocationId?: string) : Partial<HubDataConfig> {
    let result : any = {};
    localStoneId    = localStoneId    ?? MapProvider.cloud2localMap.stones[cloudHub.linkedStoneId] ?? cloudHub.linkedStoneId;
    localLocationId = localLocationId ?? MapProvider.cloud2localMap.locations[cloudHub.locationId] ?? cloudHub.locationId;
  
    if (localStoneId) {
      result.linkedStoneId = localStoneId;
    }
  
    if (localLocationId) {
      result.locationId = localLocationId;
    }
  
    result.name            = cloudHub.name;
    result.ipAddress       = cloudHub.localIPAddress;
    result.httpPort        = cloudHub.httpPort  || 80;
    result.httpsPort       = cloudHub.httpsPort || 443;
    result.cloudId         = cloudHub.id;
    result.lastSeenOnCloud = new Date(cloudHub.lastSeen).valueOf();
    result.updatedAt       = new Date(cloudHub.updatedAt).valueOf();
  
    return result;
  },


  getCreateLocalAction(localSphereId: string, data: Partial<HubDataConfig>) : {id: string, action: DatabaseAction } {
    let newId = xUtil.generateLocalId();
    let action : DatabaseAction = {type:"ADD_HUB", sphereId: localSphereId, hubId: newId, data: data };
    return {id: newId, action};
  },


  getUpdateLocalCloudIdAction(localSphereId: string, localItemId: string, cloudId: string) : DatabaseAction {
    return {type:"UPDATE_HUB_CLOUD_ID", sphereId: localSphereId, hubId: localItemId, data: {cloudId}};
  },


  getUpdateLocalAction(localSphereId: string, localItemId: string, data: Partial<HubDataConfig>) : DatabaseAction {
    return {type:"UPDATE_HUB_CONFIG", sphereId: localSphereId, hubId: localItemId, data: data }
  },


  getRemoveFromLocalAction(localSphereId: string, localItemId: string) : DatabaseAction {
    return {type:"REMOVE_HUB", sphereId: localSphereId, hubId: localItemId };
  },


  async createOnCloud(localSphereId: string, data: HubData) : Promise<cloud_Hub> {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    let cloudItem = await CLOUD.forSphere(cloudSphereId).createHub(HubTransferNext.mapLocalToCloud(data));
    core.store.dispatch(HubTransferNext.getUpdateLocalCloudIdAction(localSphereId, data.id, cloudItem.id));
    return cloudItem;
  },


  async updateOnCloud(localSphereId: string, data: HubData) : Promise<void> {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    await CLOUD.forSphere(cloudSphereId).updateLocation(data.id, HubTransferNext.mapLocalToCloud(data));
  },


  async removeFromCloud(localSphereId: string, localId: string) : Promise<void> {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    await CLOUD.forSphere(cloudSphereId).deleteLocation(localId);
  },

  createLocal(localSphereId: string, data: Partial<any>) {
    let newItemData = HubTransferNext.getCreateLocalAction(localSphereId, data);
    core.store.dispatch(newItemData.action);
    return newItemData.id;
  }
}

