import { DataUtil } from "../../../../util/DataUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { Get } from "../../../../util/GetUtil";
import { SyncSphereInterface } from "./base/SyncSphereInterface";
import { SyncStoneInterface } from "./base/SyncStoneInterface";
import { AbilityPropertyTransferNext } from "../transferrers/AbilityPropertyTransferNext";
import { SyncAbilityInterface } from "./base/SyncAbilityInterface";



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
    this.actions.push(this.transferrer.getUpdateLocalCloudIdAction(this.localSphereId, this.localStoneId, this.localId, this.localAbilityId, null));
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
    let ability = Get.abilityProperty(this.localSphereId, this.localStoneId, this.localAbilityId, this.localId);
    if (!ability) { return null; }
    if (reply.abilitys === undefined) {
      reply.abilitys = {};
    }
    if (reply.abilitys[this.cloudId] === undefined) {
      reply.abilitys[this.cloudId] = {};
    }
    reply.abilitys[this.cloudId].data = AbilityPropertyTransferNext.mapLocalToCloud(ability)
  }
}


