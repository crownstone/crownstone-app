import { xUtil } from "../../../../util/StandAloneUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { CLOUD } from "../../../cloudAPI";
import { core } from "../../../../Core";
import { GenerateSphereTransferFunctions } from "./base/TransferBase";


export const ToonTransferNext : TransferSphereTool<ToonData, ToonData, cloud_Toon, cloud_Toon_settable> = {

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  mapLocalToCloud(localData: ToonData) : cloud_Toon_settable {
    let result : cloud_Toon_settable = {
      toonAgreementId:   localData.toonAgreementId,
      toonAddress:       localData.toonAddress,
      updatedAt:         new Date(localData.updatedAt).toISOString(),
    };
    return result;
  },


   mapCloudToLocal(cloudToon: cloud_Toon) : Partial<ToonData> {
    let result : Partial<ToonData> = {
      toonAgreementId:         cloudToon.toonAgreementId,
      toonAddress:             cloudToon.toonAddress,
      cloudId:                 cloudToon.id,
      schedule:                cloudToon.schedule,
      updatedScheduleTime:     cloudToon.updatedScheduleTime,
      cloudChangedProgram:     cloudToon.changedToProgram,
      cloudChangedProgramTime: cloudToon.changedProgramTime,
      updatedAt:               new Date(cloudToon.updatedAt).valueOf()
    };

    return result;
  },


  getCreateLocalAction(localSphereId: string, data: Partial<ToonData>) : {id: string, action: DatabaseAction } {
    let newId = xUtil.generateLocalId();
    let action : DatabaseAction = {type:"ADD_TOON", sphereId: localSphereId, toonId: newId, data: data };
    return {id: newId, action};
  },


  getUpdateLocalCloudIdAction(localSphereId: string, localItemId: string, cloudId: string) : DatabaseAction {
    return {type:"UPDATE_TOON_CLOUD_ID", sphereId: localSphereId, toonId: localItemId, data: {cloudId}};
  },


  getUpdateLocalAction(localSphereId: string, localItemId: string, data: Partial<ToonData>) : DatabaseAction {
    return {type:"UPDATE_TOON", sphereId: localSphereId, toonId: localItemId, data: data }
  },


  getRemoveFromLocalAction(localSphereId: string, localItemId: string) : DatabaseAction {
    return {type:"REMOVE_TOON", sphereId: localSphereId, toonId: localItemId };
  },


  async createOnCloud(localSphereId: string, data: ToonData) : Promise<cloud_Toon> {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    let cloudItem = await CLOUD.forSphere(cloudSphereId).createToon(ToonTransferNext.mapLocalToCloud(data));
    core.store.dispatch(ToonTransferNext.getUpdateLocalCloudIdAction(localSphereId, data.id, cloudItem.id));
    return cloudItem;
  },


  async updateOnCloud(localSphereId: string, data: ToonData) : Promise<void> {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    await CLOUD.forSphere(cloudSphereId).updateToon(data.id, ToonTransferNext.mapLocalToCloud(data));
  },


  async removeFromCloud(localSphereId: string, localId: string) : Promise<void> {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    await CLOUD.forSphere(cloudSphereId).deleteToon(localId);
  },

  ...GenerateSphereTransferFunctions(this)
}

