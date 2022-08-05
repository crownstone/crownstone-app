import { xUtil } from "../../../../util/StandAloneUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { CLOUD } from "../../../cloudAPI";
import { core } from "../../../../Core";
import {Get} from "../../../../util/GetUtil";
import {DataUtil} from "../../../../util/DataUtil";



export const FingerprintTransferNext : TransferLocationTool<FingerprintData, FingerprintDataSettable, cloud_Fingerprint, cloud_Fingerprint_settable> = {


  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  mapLocalToCloud(localData: FingerprintData) : cloud_Fingerprint_settable {
    let location = DataUtil.getLocationFromFingerprintId(localData.id);
    let cloudLocationId = MapProvider.local2cloudMap.stones[location.id];
    let result : cloud_Fingerprint_settable = {
      type: localData.type,
      createdOnDeviceType: localData.type,
      createdByUser: localData.type,
      locationId: cloudLocationId,
      data: localData.data,
      updatedAt: new Date(localData.updatedAt).toISOString(),
      createdAt: new Date(localData.createdAt).toISOString(),
    };

    return result;
  },


  mapCloudToLocal(cloudFingerprint: cloud_Fingerprint) : Partial<FingerprintData> {
    let result : Partial<FingerprintData> = {
      // type:               cloudFingerprint.type as fingerprintType,
      // data:               cloudFingerprint.data,
      // activeDays:         cloudFingerprint.activeDays,
      // idOnCrownstone:     cloudFingerprint.idOnCrownstone,
      // syncedToCrownstone: cloudFingerprint.syncedToCrownstone,
      // profileIndex:       cloudFingerprint.profileIndex,
      // deleted:            cloudFingerprint.deleted,
      // cloudId:            cloudFingerprint.id,
      // updatedAt:          new Date(cloudFingerprint.updatedAt).valueOf()
    };

    return result;
  },


  getCreateLocalAction(localSphereId: string, localLocationId: string, data: Partial<FingerprintData>) : {id: string, action: DatabaseAction } {
    let newId = xUtil.generateLocalId();
    let action : DatabaseAction = {type:"ADD_FINGERPRINT_V2", sphereId: localSphereId, locationId: localLocationId, fingerprintId: newId, data: data };
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


  // async createOnCloud(localSphereId: string, localLocationId: string, data: FingerprintData) : Promise<cloud_Fingerprint> {
  //   throw new Error("UNUSED");
  // },
  //
  // async updateOnCloud(localSphereId: string, data: FingerprintData) : Promise<void> {
  //   throw new Error("UNUSED");
  // },

  async removeFromCloud(localSphereId: string, localId: string) : Promise<void> {
    await CLOUD.forSphere(localSphereId).deleteFingerprintV2(localId);
  },

  createLocal(localSphereId: string, localLocationId: string, data: Partial<FingerprintData>) {
    let newItemData = FingerprintTransferNext.getCreateLocalAction(localSphereId, localLocationId, data);
    core.store.dispatch(newItemData.action);
    return newItemData.id;
  }
}


