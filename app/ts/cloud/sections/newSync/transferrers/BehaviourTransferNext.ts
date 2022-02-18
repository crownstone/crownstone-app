import { xUtil } from "../../../../util/StandAloneUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { CLOUD } from "../../../cloudAPI";
import { core } from "../../../../Core";


export const BehaviourTransferNext : TransferStoneTool<BehaviourData, BehaviourData, cloud_Behaviour, cloud_Behaviour_settable> = {


  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  mapLocalToCloud(localData: BehaviourData) : cloud_Behaviour_settable {
    let result : cloud_Behaviour_settable = {
      type:               localData.type,
      data:               localData.data,
      syncedToCrownstone: localData.syncedToCrownstone,
      idOnCrownstone:     localData.idOnCrownstone,
      profileIndex:       localData.profileIndex,
      deleted:            localData.deleted,
      activeDays:         localData.activeDays,
      updatedAt:          new Date(localData.updatedAt).toISOString(),
    };

    if (localData.idOnCrownstone == undefined || localData.idOnCrownstone === null) {
      delete result.idOnCrownstone;
    }
    return result;
  },


   mapCloudToLocal(cloudBehaviour: cloud_Behaviour) : Partial<BehaviourData> {
    let result : Partial<BehaviourData> = {
      type:               cloudBehaviour.type as behaviourType,
      data:               cloudBehaviour.data,
      activeDays:         cloudBehaviour.activeDays,
      idOnCrownstone:     cloudBehaviour.idOnCrownstone,
      syncedToCrownstone: cloudBehaviour.syncedToCrownstone,
      profileIndex:       cloudBehaviour.profileIndex,
      deleted:            cloudBehaviour.deleted,
      cloudId:            cloudBehaviour.id,
      updatedAt:          new Date(cloudBehaviour.updatedAt).valueOf()
    };

    return result;
  },


  getCreateLocalAction(localSphereId: string, localStoneId: string, data: Partial<BehaviourData>) : {id: string, action: DatabaseAction } {
    let newId = xUtil.generateLocalId();
    let action : DatabaseAction = {type:"ADD_STONE_BEHAVIOUR", sphereId: localSphereId, stoneId: localStoneId, behaviourId: newId, data: data };
    return {id: newId, action};
  },


  getUpdateLocalCloudIdAction(localSphereId: string, localStoneId: string, localItemId: string, cloudId: string) : DatabaseAction {
    return {type:"UPDATE_BEHAVIOUR_CLOUD_ID", sphereId: localSphereId, stoneId: localStoneId, behaviourId: localItemId, data: {cloudId}};
  },


  getUpdateLocalAction(localSphereId: string, localStoneId: string, localItemId: string, data: Partial<BehaviourData>) : DatabaseAction {
    return {type:"UPDATE_STONE_BEHAVIOUR", sphereId: localSphereId, stoneId: localStoneId, behaviourId: localItemId, data: data }
  },


  getRemoveFromLocalAction(localSphereId: string, localStoneId: string, localItemId: string) : DatabaseAction {
    return {type:"REMOVE_STONE_BEHAVIOUR", sphereId: localSphereId, stoneId: localStoneId, behaviourId: localItemId };
  },


  async createOnCloud(localSphereId: string, localStoneId: string, data: BehaviourData) : Promise<cloud_Behaviour> {
    let cloudStoneId = MapProvider.local2cloudMap.stones[localStoneId] || localStoneId; // the OR is in case a cloudId has been put into this method.
    let cloudItem = await CLOUD.forStone(cloudStoneId).createBehaviour(BehaviourTransferNext.mapLocalToCloud(data));
    core.store.dispatch(BehaviourTransferNext.getUpdateLocalCloudIdAction(localSphereId, localStoneId, data.id, cloudItem.id));
    return cloudItem;
  },


  async updateOnCloud(localStoneId: string, data: BehaviourData) : Promise<void> {
    let cloudStoneId = MapProvider.local2cloudMap.stones[localStoneId] || localStoneId; // the OR is in case a cloudId has been put into this method.
    await CLOUD.forStone(cloudStoneId).updateBehaviour(data.id, BehaviourTransferNext.mapLocalToCloud(data));
  },


  async removeFromCloud(localStoneId: string, localId: string) : Promise<void> {
    let cloudStoneId = MapProvider.local2cloudMap.stones[localStoneId] || localStoneId; // the OR is in case a cloudId has been put into this method.
    await CLOUD.forStone(cloudStoneId).deleteBehaviour(localId);
  },

  createLocal(localSphereId: string, localStoneId: string, data: Partial<any>) {
    let newItemData = BehaviourTransferNext.getCreateLocalAction(localSphereId, localStoneId, data);
    core.store.dispatch(newItemData.action);
    return newItemData.id;
  }
}

