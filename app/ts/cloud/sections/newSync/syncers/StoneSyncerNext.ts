import { DataUtil } from "../../../../util/DataUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { Get } from "../../../../util/GetUtil";
import { SyncSphereInterface } from "./base/SyncSphereInterface";
import { xUtil } from "../../../../util/StandAloneUtil";
import { StoneTransferNext } from "../transferrers/StoneTransferNext";
import { SyncNext } from "../SyncNext";
import { SyncUtil } from "../../../../util/SyncUtil";


export class StoneSyncerNext extends SyncSphereInterface<StoneData, StoneDataConfig, cloud_Stone, cloud_Stone_settable> {

  constructor(options: SyncInterfaceOptions) {
    super(StoneTransferNext, options);
  }

  getLocalId() {
    return this.globalCloudIdMap.stones[this.cloudId] || MapProvider.cloud2localMap.stones[this.cloudId];
  }

  _mapCloudToLocal(cloudStone: cloud_Stone) {
    let localLocationId = this.globalCloudIdMap.locations[cloudStone.locationId] ?? MapProvider.cloud2localMap.locations[cloudStone.locationId] ?? cloudStone.locationId;
    return StoneTransferNext.mapCloudToLocal(cloudStone, localLocationId);
  }

  createLocal(cloudData: cloud_Stone) {
    let newData = StoneTransferNext.getCreateLocalAction(this.localSphereId, this._mapCloudToLocal(cloudData))
    this.actions.push(newData.action)
    this.globalCloudIdMap.stones[this.cloudId] = newData.id;
  }

  setReplyWithData(reply: SyncRequestSphereData) {
    let stone = Get.stone(this.localSphereId, this.localId);
    if (!stone) { return null; }
    SyncUtil.constructReply(reply,['stones', this.cloudId],
      StoneTransferNext.mapLocalToCloud(stone)
    );
  }

  static prepare(sphere: SphereData) : {[itemId:string]: RequestItemCoreType} {
    return SyncNext.gatherRequestData(sphere,{
      key:'stones', type:'stone', children: [
        {key:'rules',     type:'behaviour', cloudKey: 'behaviours'},
        {key:'abilities', type:'ability', children: [
            {key:'properties', type:'abilityProperty'},
          ]},
      ]
    });
  }
}

