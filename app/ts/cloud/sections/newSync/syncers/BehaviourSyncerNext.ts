import { DataUtil } from "../../../../util/DataUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { Get } from "../../../../util/GetUtil";
import { xUtil } from "../../../../util/StandAloneUtil";
import { BehaviourTransferNext } from "../transferrers/BehaviourTransferNext";
import { SyncStoneInterface } from "./base/SyncStoneInterface";
import { ToonTransferNext } from "../transferrers/ToonTransferNext";
import { SyncUtil } from "../../../../util/SyncUtil";



export class BehaviourSyncerNext extends SyncStoneInterface<behaviourWrapper, behaviourWrapper, cloud_Behaviour, cloud_Behaviour_settable> {

  cloudStoneId : string;
  localStoneId : string;

  constructor(options: SyncInterfaceOptions, cloudStoneId: string) {
    super(BehaviourTransferNext, options, cloudStoneId);
  }

  getLocalId() {
    return this.globalCloudIdMap.behaviours[this.cloudId] || MapProvider.cloud2localMap.behaviours[this.cloudId];
  }

  createLocal(cloudData: cloud_Behaviour) {
    let newData = BehaviourTransferNext.getCreateLocalAction(
      this.localSphereId,
      this.localStoneId,
      BehaviourTransferNext.mapCloudToLocal(cloudData)
    );
    this.actions.push(newData.action)
    this.globalCloudIdMap.behaviours[this.cloudId] = newData.id;
  }

  setReplyWithData(reply: SyncRequestSphereData) {
    let behaviour = Get.behaviour(this.localSphereId, this.localStoneId, this.localId);
    if (!behaviour) { return null; }

    SyncUtil.constructReply(
      reply,
      ['stones', this.cloudStoneId, 'behaviours', this.cloudId],
      BehaviourTransferNext.mapLocalToCloud(behaviour)
    );
  }
}

