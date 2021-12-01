import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { Get } from "../../../../util/GetUtil";
import { SyncSphereInterface } from "./base/SyncSphereInterface";
import { ToonTransferNext } from "../transferrers/ToonTransferNext";
import { SyncNext } from "../SyncNext";
import { SyncUtil } from "../../../../util/SyncUtil";



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
    SyncUtil.constructReply(reply,['toons', this.cloudId],
      ToonTransferNext.mapLocalToCloud(toon)
    );
  }

  static prepare(sphere: SphereData) : {[itemId:string]: RequestItemCoreType} {
    return SyncNext.gatherRequestData(sphere,{key:'toons', type:'toon'});
  }
}

