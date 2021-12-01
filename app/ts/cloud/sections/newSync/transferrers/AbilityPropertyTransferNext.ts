export const AbilityPropertyTransferNext : TransferAbilityTool<AbilityPropertyData, AbilityPropertyData, cloud_AbilityProperty, any> = {

  mapLocalToCloud(localData: AbilityPropertyData) : cloud_AbilityProperty_settable {
    let result : cloud_AbilityProperty_settable = {
      type:               localData.type as AbilityPropertyType,
      value:              localData.valueTarget,
      syncedToCrownstone: localData.valueTarget == localData.value,
      updatedAt:          new Date(localData.updatedAt).toISOString(),
    };
    return result;
  },


  mapCloudToLocal(cloudAbilityProperty: cloud_AbilityProperty) : Partial<AbilityPropertyData> {
    let result : Partial<AbilityPropertyData> = {
      type:               cloudAbilityProperty.type,
      cloudId:            cloudAbilityProperty.id,
      syncedToCrownstone: cloudAbilityProperty.syncedToCrownstone,
      value:              cloudAbilityProperty.syncedToCrownstone ? cloudAbilityProperty.value : null,
      valueTarget:        cloudAbilityProperty.value,
      updatedAt:          new Date(cloudAbilityProperty.updatedAt).valueOf()
    };
    return result;
  },


  getCreateLocalAction(localSphereId: string, localStoneId: string, localAbilityId:string, data: Partial<AbilityPropertyData>) : {id: string, action: DatabaseAction } {
    throw new Error("UNUSED");
  },


  createLocal(localSphereId: string, localStoneId: string, localAbilityId:string, data: Partial<AbilityPropertyData>) : string {
    throw new Error("UNUSED");
  },


  getUpdateLocalAction(localSphereId: string, localStoneId: string, localAbilityId:string, localItemId: string, data: Partial<AbilityPropertyData>) : DatabaseAction {
    return {
      type: data.syncedToCrownstone ? "UPDATE_ABILITY_PROPERTY_AS_SYNCED_FROM_CLOUD" : "UPDATE_ABILITY_PROPERTY",
      sphereId: localSphereId,
      stoneId: localStoneId,
      abilityId: localAbilityId,
      propertyId: localItemId,
      data: data
    };
  },


  getRemoveFromLocalAction(localSphereId: string, localStoneId: string, localAbilityId:string, localItemId: string) : DatabaseAction {
    throw new Error("UNUSED");
  },


  getUpdateLocalCloudIdAction(localSphereId: string, localStoneId: string, localAbilityId:string, localItemId: string, cloudId: string) : DatabaseAction {
    return {type:"UPDATE_ABILITY_PROPERTY_CLOUD_ID",
      sphereId:   localSphereId,
      stoneId:    localStoneId,
      abilityId:  localAbilityId,
      propertyId: localItemId,
      data: {cloudId}
    };
  },


  createOnCloud(localSphereId: string, localStoneId: string, localAbilityId:string, data: AbilityPropertyData) : Promise<cloud_AbilityProperty> {
    throw new Error("UNUSED");
  },


  updateOnCloud(localStoneId: string, localAbilityId:string, data: AbilityPropertyData) : Promise<void> {
    throw new Error("UNUSED");
  },


  removeFromCloud(localStoneId: string, localAbilityId: string, localId:string) : Promise<void> {
    throw new Error("UNUSED");
  },
}

