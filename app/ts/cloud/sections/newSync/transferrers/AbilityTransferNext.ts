import { xUtil } from "../../../../util/StandAloneUtil";
import {core} from "../../../../Core";


export const AbilityTransferNext : TransferStoneTool<AbilityData, AbilityData, cloud_Ability, cloud_Ability_settable> = {

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  mapLocalToCloud(localData: AbilityData) : cloud_Ability_settable {
    let result : cloud_Ability_settable = {
      type:               localData.type,
      enabled:            localData.enabledTarget,
      syncedToCrownstone: localData.enabledTarget == localData.enabled,
      updatedAt:          new Date(localData.updatedAt).toISOString(),
    };
    return result;
  },


  mapCloudToLocal(cloudAbility: cloud_Ability) : Partial<AbilityData> {
    let result : Partial<AbilityData> = {
      type:               cloudAbility.type,
      cloudId:            cloudAbility.id,
      enabled:            cloudAbility.syncedToCrownstone ? cloudAbility.enabled : null,
      enabledTarget:      cloudAbility.enabled,
      syncedToCrownstone: cloudAbility.syncedToCrownstone,
      updatedAt:          new Date(cloudAbility.updatedAt).valueOf()
    };
    return result;
  },



  getCreateLocalAction(localSphereId: string, localStoneId: string, data: Partial<AbilityData>) : {id: string, action: DatabaseAction } {
    let newId = xUtil.generateLocalId();
    let action : DatabaseAction = {type:"ADD_ABILITY", sphereId: localSphereId, stoneId: localStoneId, abilityId: newId, data: data };
    return {id: newId, action};
  },


  getUpdateLocalCloudIdAction(localSphereId: string, localStoneId: string, localItemId: string, cloudId: string) : DatabaseAction {
    return {type:"UPDATE_ABILITY_CLOUD_ID", sphereId: localSphereId, stoneId: localStoneId, abilityId: localItemId, data: {cloudId}};
  },


  getUpdateLocalAction(localSphereId: string, localStoneId: string, localItemId: string, data: Partial<AbilityData>) : DatabaseAction {
    return {
      type:      data.syncedToCrownstone ? "UPDATE_ABILITY_AS_SYNCED_FROM_CLOUD" : "UPDATE_ABILITY",
      sphereId:  localSphereId,
      stoneId:   localStoneId,
      abilityId: localItemId,
      data:      data
    }
  },


  getRemoveFromLocalAction(localSphereId: string, localStoneId: string, localItemId: string) : DatabaseAction {
    throw new Error("UNUSED");
  },


  async createOnCloud(localSphereId: string, localStoneId: string, data: AbilityData) : Promise<cloud_Ability> {
    throw new Error("UNUSED");
  },


  async updateOnCloud(localStoneId: string, data: AbilityData) : Promise<void> {
    throw new Error("UNUSED");
  },


  async removeFromCloud(localStoneId: string, localId: string) : Promise<void> {
    throw new Error("UNUSED");
  },

  createLocal(localSphereId: string, localStoneId: string, data: Partial<any>) {
    let newItemData = AbilityTransferNext.getCreateLocalAction(localSphereId, localStoneId, data);
    core.store.dispatch(newItemData.action);
    return newItemData.id;
  }
}

