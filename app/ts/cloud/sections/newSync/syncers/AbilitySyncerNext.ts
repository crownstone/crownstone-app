import { DataUtil } from "../../../../util/DataUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { Get } from "../../../../util/GetUtil";
import { AbilityTransferNext } from "../transferrers/AbilityTransferNext";
import { SyncStoneInterface } from "./base/SyncStoneInterface";



export class AbilitySyncerNext extends SyncStoneInterface<AbilityData, AbilityData, cloud_Ability, any> {

  constructor(options: SyncInterfaceOptions, cloudStoneId: string) {
    super(AbilityTransferNext, options, cloudStoneId)
  }


  getLocalId(cloudAbility: cloud_Ability) {
    let id = cloudAbility?.type ?? MapProvider.cloud2localMap.abilities[this.cloudId];

    // since we don't add abilities here, we use this call to update the globalCloudIdMap. This is used by the abilityProperties.
    this.globalCloudIdMap.abilities[this.cloudId] = id;
    return id;
  }


  removeFromLocal() {
    // we do not remove abilities. They can be disabled, not removed.
    // if they are removed from the cloud completely, remove the cloud id
    this.actions.push(this.transferrer.getUpdateLocalCloudIdAction(this.localSphereId, this.localStoneId, this.localId, null));
  }


  createLocal(cloudData: cloud_Ability) {
    // we do not create abilities. Each stone has their abilities, we only update them if needed.
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
    reply.abilitys[this.cloudId].data = AbilityTransferNext.mapLocalToCloud(ability)
  }
}

