import { DataUtil } from "../../../../util/DataUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { SyncInterface } from "./SyncInterface";
import { Get } from "../../../../util/GetUtil";



export class BehaviourSyncerNext extends SyncInterface<behaviourWrapper, cloud_Behaviour, cloud_Behaviour_settable> {

  cloudStoneId : string;
  localStoneId : string;

  constructor(options: SyncInterfaceOptions, cloudStoneId: string) {
    super(options)
    this.cloudStoneId = cloudStoneId;
    this.localStoneId = this.globalCloudIdMap.stones[this.cloudStoneId] || MapProvider.cloud2localMap.stones[this.cloudStoneId];
  }


  getLocalId() {
    return this.globalCloudIdMap.behaviours[this.cloudId] || MapProvider.cloud2localMap.behaviours[this.cloudId];
  }

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  static mapLocalToCloud(localData: behaviourWrapper) : cloud_Behaviour_settable | null {
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
    return result;
  }


  static mapCloudToLocal(cloudBehaviour: cloud_Behaviour) : Partial<behaviourWrapper> {
    let result : Partial<behaviourWrapper> = {
      type:               cloudBehaviour.type as behaviourType,
      data:               cloudBehaviour.data,
      activeDays:         cloudBehaviour.activeDays,
      // from here on it is data required for syncing and UI state.
      idOnCrownstone:     cloudBehaviour.idOnCrownstone,
      syncedToCrownstone: cloudBehaviour.syncedToCrownstone,
      profileIndex:       cloudBehaviour.profileIndex,
      deleted:            cloudBehaviour.deleted,
      cloudId:            cloudBehaviour.id,
      updatedAt:          new Date(cloudBehaviour.updatedAt).valueOf()
    };
    return result;
  }


  updateCloudId(cloudId) {
    this.actions.push({type:"UPDATE_RULE_CLOUD_ID", sphereId: this.localSphereId, stoneId: this.localStoneId, ruleId: this.localId, data: {cloudId}});
  }

  removeFromLocal() {
    this.actions.push({type:"REMOVE_STONE_RULE", sphereId: this.localSphereId, stoneId: this.localStoneId, ruleId: this.localId });
  }

  createLocal(cloudData: cloud_Behaviour) {
    let newId = this._generateLocalId();
    this.globalCloudIdMap.behaviours[this.cloudId] = newId;
    this.actions.push({
      type:"ADD_STONE_RULE",
      sphereId: this.localSphereId,
      stoneId: this.localStoneId,
      ruleId: newId,
      data: BehaviourSyncerNext.mapCloudToLocal(cloudData)
    });
  }

  updateLocal(cloudData: cloud_Behaviour) {
    this.actions.push({
      type:"UPDATE_STONE_RULE",
      sphereId: this.localSphereId,
      stoneId: this.localStoneId,
      ruleId: this.localId,
      data: BehaviourSyncerNext.mapCloudToLocal(cloudData)
    });
  }

  setReplyWithData(reply: SyncRequestSphereData) {
    let behaviour = Get.behaviour(this.localSphereId, this.localStoneId, this.localId);
    if (!behaviour) { return null; }
    if (reply.behaviours === undefined) {
      reply.behaviours = {};
    }
    if (reply.behaviours[this.cloudId] === undefined) {
      reply.behaviours[this.cloudId] = {};
    }
    reply.behaviours[this.cloudId].data = BehaviourSyncerNext.mapLocalToCloud(behaviour)
  }
}

