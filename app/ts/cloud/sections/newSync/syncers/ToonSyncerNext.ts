import { DataUtil } from "../../../../util/DataUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { Get } from "../../../../util/GetUtil";
import { SyncSphereInterface } from "./base/SyncSphereInterface";
import { xUtil } from "../../../../util/StandAloneUtil";
import { ToonTransferNext } from "../transferrers/ToonTransferNext";
import { StoneTransferNext } from "../transferrers/StoneTransferNext";
import { SyncNext } from "../SyncNext";



export class ToonSyncerNext extends SyncSphereInterface<ToonData, ToonData, cloud_Toon, cloud_Toon_settable> {

  constructor(options: SyncInterfaceOptions) {
    super(ToonTransferNext, options);
  }

  getLocalId() {
    return this.globalCloudIdMap.toons[this.cloudId] || MapProvider.cloud2localMap.toons[this.cloudId];
  }

  createLocal(cloudData: cloud_Toon) {
    let newData = ToonTransferNext.getCreateLocalAction(this.localSphereId, ToonTransferNext.mapCloudToLocal(cloudData))
    this.actions.push(newData.action)
    this.globalCloudIdMap.toons[this.cloudId] = newData.id;
  }

  setReplyWithData(reply: SyncRequestSphereData) {
    let toon = Get.toon(this.localSphereId, this.localId);
    if (!toon) { return null; }
    if (reply.toons === undefined) {
      reply.toons = {};
    }
    if (reply.toons[this.cloudId] === undefined) {
      reply.toons[this.cloudId] = {};
    }
    reply.toons[this.cloudId].data = ToonTransferNext.mapLocalToCloud(toon)
  }

  static prepare(sphere: SphereData) : {[itemId:string]: RequestItemCoreType} {
    return SyncNext.gatherRequestData(sphere,{key:'toons', type:'toon'});
  }
}

