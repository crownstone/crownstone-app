import { xUtil } from "../../../../util/StandAloneUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { CLOUD } from "../../../cloudAPI";
import { core } from "../../../../Core";
import {Get} from "../../../../util/GetUtil";
import {DataUtil} from "../../../../util/DataUtil";
import { FingerprintUtil } from "../../../../util/FingerprintUtil";



export const FingerprintTransferNext : TransferLocationTool<FingerprintData, FingerprintDataSettable, cloud_Fingerprint, cloud_Fingerprint_settable> = {


  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  mapLocalToCloud(localData: FingerprintData) : cloud_Fingerprint_settable {
    let location = DataUtil.getLocationFromFingerprintId(localData.id);
    let cloudLocationId = MapProvider.local2cloudMap.locations[location.id];
    let result : cloud_Fingerprint_settable = {
      type:                  localData.type,
      createdOnDeviceType:   localData.createdOnDeviceType,
      createdByUser:         localData.createdByUser,
      crownstonesAtCreation: Object.keys(localData.crownstonesAtCreation),
      locationId:            cloudLocationId || location.id,
      exclusive:             localData.exclusive,
      data:                  localData.data,
      updatedAt:             new Date(localData.updatedAt).toISOString(),
      createdAt:             new Date(localData.createdAt).toISOString(),
    };

    return result;
  },


  mapCloudToLocal(cloudFingerprint: cloud_Fingerprint) : Partial<FingerprintData> {
    let result : Partial<FingerprintData> = {
      cloudId:               cloudFingerprint.id,
      type:                  cloudFingerprint.type,
      createdOnDeviceType:   cloudFingerprint.createdOnDeviceType, // ${device type string}]
      exclusive:             cloudFingerprint.exclusive ?? false, // ${device type string}]
      createdByUser:         cloudFingerprint.createdByUser,       // ${user id}
      crownstonesAtCreation: xUtil.arrayToMap(cloudFingerprint.crownstonesAtCreation), // maj_min as id representing the Crownstone.
      data:                  cloudFingerprint.data,
      updatedAt:             new Date(cloudFingerprint.updatedAt).valueOf(),
      createdAt:             new Date(cloudFingerprint.createdAt).valueOf(),
    };

    return result;
  },


  getCreateLocalAction(localSphereId: string, localLocationId: string, data: Partial<FingerprintData>) : {id: string, action: DatabaseAction } {
    let newId = xUtil.generateLocalId();
    let action : DatabaseAction = {type:"ADD_FINGERPRINT_V2", sphereId: localSphereId, locationId: localLocationId, fingerprintId: newId, data: data };

    // If this fingerprint came from the cloud AND it is an in-hand set, remove any migrated datasets for this location.
    if (data.cloudId && data.type === 'IN_HAND') {
      FingerprintUtil.checkToRemoveBadFingerprints(localSphereId, localLocationId);
    }

    return {id: newId, action};
  },


  getUpdateLocalCloudIdAction(localSphereId: string, localLocationId: string, localItemId: string, cloudId: string) : DatabaseAction {
    return {type:"UPDATE_FINGERPRINT_V2_CLOUD_ID", sphereId: localSphereId, locationId: localLocationId, fingerprintId: localItemId, data: {cloudId}};
  },


  getUpdateLocalAction(localSphereId: string, localLocationId: string, localItemId: string, data: Partial<FingerprintData>) : DatabaseAction {
    return {type:"UPDATE_FINGERPRINT_V2", sphereId: localSphereId, locationId: localLocationId, fingerprintId: localItemId, data: data }
  },


  getRemoveFromLocalAction(localSphereId: string, localLocationId: string, localItemId: string) : DatabaseAction {
    return {type:"REMOVE_FINGERPRINT_V2", sphereId: localSphereId, locationId: localLocationId, fingerprintId: localItemId };
  },


  async createOnCloud(localSphereId: string, localLocationId: string, data: FingerprintData) : Promise<cloud_Fingerprint> {
    let cloudItem = await CLOUD.forSphere(localSphereId).createFingerprintV2(FingerprintTransferNext.mapLocalToCloud(data));
    core.store.dispatch(FingerprintTransferNext.getUpdateLocalCloudIdAction(localSphereId, localLocationId, data.id, cloudItem.id));
    return cloudItem;
  },

  async updateOnCloud(localSphereId: string, data: FingerprintData) : Promise<void> {
    await CLOUD.forSphere(localSphereId).updateFingerprintV2(data.cloudId, FingerprintTransferNext.mapLocalToCloud(data));
  },

  async removeFromCloud(localSphereId: string, localId: string) : Promise<void> {
    await CLOUD.forSphere(localSphereId).deleteFingerprintV2(localId);
  },

  createLocal(localSphereId: string, localLocationId: string, data: Partial<FingerprintData>) {
    let newItemData = FingerprintTransferNext.getCreateLocalAction(localSphereId, localLocationId, data);
    core.store.dispatch(newItemData.action);
    return newItemData.id;
  }
}




