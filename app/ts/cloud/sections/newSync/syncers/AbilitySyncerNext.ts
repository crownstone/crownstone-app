import { DataUtil } from "../../../../util/DataUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { SyncInterface } from "./SyncInterface";
import { Get } from "../../../../util/GetUtil";



export class AbilitySyncerNext extends SyncInterface<AbilityData, cloud_Ability, any> {

  cloudStoneId : string;
  localStoneId : string;

  constructor(options: SyncInterfaceOptions, cloudStoneId: string) {
    super(options)
    this.cloudStoneId = cloudStoneId;
    this.localStoneId = this.globalCloudIdMap.stones[this.cloudStoneId] || MapProvider.cloud2localMap.stones[this.cloudStoneId];
  }


  getLocalId(cloudAbility: cloud_Ability) {
    return cloudAbility?.type ?? MapProvider.cloud2localMap.abilities[this.cloudId];
  }

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  static mapLocalToCloud(localData: AbilityData) : cloud_Ability_settable | null {
    let result : cloud_Ability_settable = {
      type:               localData.type,
      enabled:            localData.enabledTarget,
      syncedToCrownstone: localData.enabledTarget == localData.enabled,
      updatedAt:          new Date(localData.updatedAt).toISOString(),
    };
    return result;
  }


  static mapCloudToLocal(cloudAbility: cloud_Ability) : Partial<AbilityData> {
    let result : Partial<AbilityData> = {
      type:               cloudAbility.type,
      cloudId:            cloudAbility.id,
      enabled:            cloudAbility.syncedToCrownstone ? cloudAbility.enabled : null,
      enabledTarget:      cloudAbility.enabled,
      updatedAt:          new Date(cloudAbility.updatedAt).valueOf()
    };
    return result;
  }


  updateCloudId(cloudId, data: cloud_Ability) {
    this.actions.push({type:"UPDATE_ABILITY_CLOUD_ID",
      sphereId: this.localSphereId,
      stoneId: this.localStoneId,
      abilityId: this.localId,
      data: {cloudId}
    });
  }

  removeFromLocal() {
    // we do not remove abilities. They can be disabled, not removed.
  }

  createLocal(cloudData: cloud_Ability) {
    // we do not create abilities. Each stone has their abilities, we only update them if needed.
  }

  updateLocal(cloudData: cloud_Ability) {
    this.actions.push({
      type:"UPDATE_ABILITY",
      sphereId: this.localSphereId,
      stoneId: this.localStoneId,
      abilityId: this.localId,
      data: AbilitySyncerNext.mapCloudToLocal(cloudData)
    });
  }

  setReplyWithData(reply: SyncRequestSphereData) {
    let ability = Get.ability(this.localSphereId, this.localStoneId, this.localId);
    if (!ability) { return null; }
    if (reply.abilitys === undefined) {
      reply.abilitys = {};
    }
    if (reply.abilitys[this.cloudId] === undefined) {
      reply.abilitys[this.cloudId] = {};
    }
    reply.abilitys[this.cloudId].data = AbilitySyncerNext.mapLocalToCloud(ability)
  }
}

