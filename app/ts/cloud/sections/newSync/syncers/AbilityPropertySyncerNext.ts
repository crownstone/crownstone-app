import { DataUtil } from "../../../../util/DataUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { Get } from "../../../../util/GetUtil";
import { SyncSphereInterface } from "./base/SyncSphereInterface";



export class AbilityPropertySyncerNext extends SyncSphereInterface<AbilityPropertyData, cloud_AbilityProperty, any> {

  cloudStoneId : string;
  localStoneId : string;
  cloudAbilityId : string;
  localAbilityId : string;

  constructor(options: SyncInterfaceOptions, cloudStoneId: string, cloudAbilityId: string) {
    super(options)
    this.cloudStoneId   = cloudStoneId;
    this.cloudAbilityId = cloudAbilityId;
    this.localStoneId   = this.globalCloudIdMap.stones[this.cloudStoneId]      || MapProvider.cloud2localMap.stones[this.cloudStoneId];
    this.localAbilityId = this.globalCloudIdMap.abilities[this.cloudAbilityId] || MapProvider.cloud2localMap.abilities[this.cloudAbilityId];
  }


  getLocalId(cloudAbilityProperty: cloud_AbilityProperty) {
    return cloudAbilityProperty?.type ?? MapProvider.cloud2localMap.abilityProperties[this.cloudId];
  }

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  static mapLocalToCloud(localData: AbilityPropertyData) : cloud_AbilityProperty_settable | null {
    let result : cloud_AbilityProperty_settable = {
      type:               localData.type as AbilityPropertyType,
      value:              localData.value,
      syncedToCrownstone: localData.valueTarget == localData.value,
      updatedAt:          new Date(localData.updatedAt).toISOString(),
    };
    return result;
  }


  static mapCloudToLocal(cloudAbilityProperty: cloud_AbilityProperty) : Partial<AbilityPropertyData> {
    let result : Partial<AbilityPropertyData> = {
      type:               cloudAbilityProperty.type,
      cloudId:            cloudAbilityProperty.id,
      value:              cloudAbilityProperty.syncedToCrownstone ? cloudAbilityProperty.value : null,
      valueTarget:        cloudAbilityProperty.value,
      updatedAt:          new Date(cloudAbilityProperty.updatedAt).valueOf()
    };
    return result;
  }


  updateCloudId(cloudId, data: cloud_AbilityProperty) {
    this.actions.push({type:"UPDATE_ABILITY_PROPERTY_CLOUD_ID",
      sphereId:   this.localSphereId,
      stoneId:    this.localStoneId,
      abilityId:  this.localAbilityId,
      propertyId: this.localId,
      data: {cloudId}
    });
  }

  removeFromLocal() {
    // we do not remove abilityProperties. They can be disabled, not removed.
    this.actions.push({type: "REMOVE_ABILITY_PROPERTY_CLOUD_ID",
      sphereId: this.localSphereId,
      stoneId: this.localStoneId,
      abilityId: this.localAbilityId,
      propertyId: this.localId
    });
  }

  createLocal(cloudData: cloud_AbilityProperty) {
    // we do not create abilityProperties. Each stone has their abilities, we only update them if needed.
  }

  updateLocal(cloudData: cloud_AbilityProperty) {
    this.actions.push({
      type: cloudData.syncedToCrownstone ? "UPDATE_ABILITY_PROPERTY_AS_SYNCED_FROM_CLOUD" : "UPDATE_ABILITY_PROPERTY",
      sphereId: this.localSphereId,
      stoneId: this.localStoneId,
      abilityId: this.localAbilityId,
      propertyId: this.localId,
      data: AbilityPropertySyncerNext.mapCloudToLocal(cloudData)
    });
  }

  setReplyWithData(reply: SyncRequestSphereData) {
    let ability = Get.abilityProperty(this.localSphereId, this.localStoneId, this.localAbilityId, this.localId);
    if (!ability) { return null; }
    if (reply.abilitys === undefined) {
      reply.abilitys = {};
    }
    if (reply.abilitys[this.cloudId] === undefined) {
      reply.abilitys[this.cloudId] = {};
    }
    reply.abilitys[this.cloudId].data = AbilityPropertySyncerNext.mapLocalToCloud(ability)
  }
}

