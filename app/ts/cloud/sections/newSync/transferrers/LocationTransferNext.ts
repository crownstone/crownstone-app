import { xUtil } from "../../../../util/StandAloneUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { CLOUD } from "../../../cloudAPI";
import { core } from "../../../../Core";


export const LocationTransferNext : TransferSphereTool<LocationData, LocationDataConfig, cloud_Location, cloud_Location_settable> = {

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  mapLocalToCloud(localData: LocationData) : cloud_Location_settable {
    let result : cloud_Location_settable = {
      name:      localData.config.name,
      uid:       localData.config.uid,
      icon:      localData.config.icon,
      updatedAt: new Date(localData.config.updatedAt).toISOString(),
    };

    if (localData.config.pictureSource === "STOCK") {
      result.stockPicture = localData.config.picture;
    }

    return result;
  },

  mapCloudToLocal(cloudLocation: cloud_Location) : Partial<LocationDataConfig> {
    let result : Partial<LocationDataConfig> =  {
      name:          cloudLocation.name,
      icon:          cloudLocation.icon,
      uid:           cloudLocation.uid,
      cloudId:       cloudLocation.id,
      pictureSource: cloudLocation.imageId ? "CUSTOM" : "STOCK", // PICTURE_GALLERY_TYPES
      updatedAt:     new Date(cloudLocation.updatedAt).valueOf()
    }

    if (cloudLocation.stockPicture) {
      result.picture = cloudLocation.stockPicture;
    }

    return result;
  },


  getCreateLocalAction(localSphereId: string, data: Partial<LocationDataConfig>) : {id: string, action: DatabaseAction } {
    let newId = xUtil.generateLocalId();
    let action : DatabaseAction = {type:"ADD_LOCATION", sphereId: localSphereId, locationId: newId, data: data };
    return {id: newId, action};
  },


  getUpdateLocalCloudIdAction(localSphereId: string, localItemId: string, cloudId: string) : DatabaseAction {
    return {type:"UPDATE_LOCATION_CLOUD_ID", sphereId: localSphereId, locationId: localItemId, data: {cloudId}};
  },


  getUpdateLocalAction(localSphereId: string, localItemId: string, data: Partial<LocationDataConfig>) : DatabaseAction {
    return {type:"UPDATE_LOCATION_CONFIG", sphereId: localSphereId, locationId: localItemId, data: data }
  },


  getRemoveFromLocalAction(localSphereId: string, localItemId: string) : DatabaseAction {
    return {type:"REMOVE_LOCATION", sphereId: localSphereId, locationId: localItemId };
  },


  async createOnCloud(localSphereId: string, data: LocationData) : Promise<cloud_Location> {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    let cloudItem = await CLOUD.forSphere(cloudSphereId).createLocation(LocationTransferNext.mapLocalToCloud(data));
    core.store.dispatch({
      type: 'UPDATE_LOCATION_CLOUD_ID', sphereId: localSphereId, locationId: data.id,
      data: { cloudId: cloudItem.id, uid: cloudItem.uid }
    });
    return cloudItem;
  },


  async updateOnCloud(localSphereId: string, data: LocationData) : Promise<void> {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    await CLOUD.forSphere(cloudSphereId).updateLocation(data.id, LocationTransferNext.mapLocalToCloud(data));
  },


  async removeFromCloud(localSphereId: string, localId: string) : Promise<void> {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    await CLOUD.forSphere(cloudSphereId).deleteLocation(localId);
  },


  createLocal(localSphereId: string, data: Partial<any>) {
    let newItemData = LocationTransferNext.getCreateLocalAction(localSphereId, data);
    core.store.dispatch(newItemData.action);
    return newItemData.id;
  }
}

