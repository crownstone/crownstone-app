import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { Get } from "../../../../util/GetUtil";
import { AbilityPropertyTransferNext } from "../transferrers/AbilityPropertyTransferNext";
import { SyncAbilityInterface } from "./base/SyncAbilityInterface";
import { SyncUtil } from "../../../../util/SyncUtil";



export class AbilityPropertySyncerNext extends SyncAbilityInterface<AbilityPropertyData, AbilityPropertyData, cloud_AbilityProperty, any> {

  constructor(options: SyncInterfaceOptions, cloudStoneId: string, cloudAbilityId: string) {
    super(AbilityPropertyTransferNext, options, cloudStoneId, cloudAbilityId)
  }

  getLocalId(cloudAbilityProperty: cloud_AbilityProperty) {
    return cloudAbilityProperty?.type ?? MapProvider.cloud2localMap.abilityProperties[this.cloudId];
  }

  updateCloudId(cloudId, data: cloud_AbilityProperty) {
    this.actions.push(AbilityPropertyTransferNext.getUpdateLocalCloudIdAction(
      this.localSphereId,
      this.localStoneId,
      this.localAbilityId,
      this.localId,
      cloudId
    ));
  }

  removeFromLocal() {
    // we do not remove abilityProperties. They can be disabled, not removed.
    // if they are removed from the cloud completely, remove the cloud id
    this.actions.push(this.transferrer.getUpdateLocalCloudIdAction(this.localSphereId, this.localStoneId, this.localAbilityId, this.localId, null));
  }

  createLocal(cloudData: cloud_AbilityProperty) {
    // we do not create abilityProperties. Each stone has their abilities, we only update them if needed.
  }

  updateLocal(cloudData: cloud_AbilityProperty) {
    this.actions.push(AbilityPropertyTransferNext.getUpdateLocalAction(
      this.localSphereId,
      this.localStoneId,
      this.localAbilityId,
      this.localId,
      AbilityPropertyTransferNext.mapCloudToLocal(cloudData)
    ));
  }

  setReplyWithData(reply: SyncRequestSphereData) {
    let abilityProperty = Get.abilityProperty(this.localSphereId, this.localStoneId, this.localAbilityId, this.localId);
    if (!abilityProperty) { return null; }

    SyncUtil.constructReply(
      reply,
      ['stones', this.cloudStoneId, 'abilities', this.cloudAbilityId, 'properties', this.cloudId],
      AbilityPropertyTransferNext.mapLocalToCloud(abilityProperty)
    );
  }
}

