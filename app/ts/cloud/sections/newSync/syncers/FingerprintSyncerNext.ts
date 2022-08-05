import {MapProvider} from "../../../../backgroundProcesses/MapProvider";
import {Get} from "../../../../util/GetUtil";
import {SyncNext} from "../SyncNext";
import {SyncUtil} from "../../../../util/SyncUtil";
import {FingerprintTransferNext} from "../transferrers/FingerprintTransferNext";
import {SyncLocationInterface} from "./base/SyncLocationInterface";


export class FingerprintSyncerNext extends SyncLocationInterface<FingerprintData, FingerprintDataSettable, cloud_Fingerprint, cloud_Fingerprint_settable> {

  constructor(options: SyncInterfaceOptions, cloudLocationId: string) {
    super(FingerprintTransferNext, options, cloudLocationId);
  }

  getLocalId() {
    return this.globalCloudIdMap.fingerprints[this.cloudId] || MapProvider.cloud2localMap.fingerprints[this.cloudId];
  }

  createLocal(cloudData: cloud_Fingerprint) {
    let newData = FingerprintTransferNext.getCreateLocalAction(this.localSphereId, this.localLocationId, FingerprintTransferNext.mapCloudToLocal(cloudData, this.cloudLocationId));
    this.actions.push(newData.action)
    this.globalCloudIdMap.fingerprints[this.cloudId] = newData.id;
    this.sphereIdMap.fingerprints[this.cloudId] = newData.id;
  }

  updateLocal(cloudData: cloud_Fingerprint) {
    this.actions.push(
      FingerprintTransferNext.getUpdateLocalAction(
        this.localSphereId,
        this.localLocationId,
        this.localId,
        FingerprintTransferNext.mapCloudToLocal(cloudData)
      )
    );
  }

  setReplyWithData(reply: SyncRequestSphereData, cloudData: cloud_Fingerprint) {
    let fingerprint = Get.fingerprint(this.localSphereId, this.localLocationId, this.localId);
    if (!fingerprint) { return null; }

    SyncUtil.constructReply(reply,['fingerprints', this.cloudId],
      FingerprintTransferNext.mapLocalToCloud(fingerprint)
    );
  }

  static prepare(sphere: SphereData) : {[itemId:string]: RequestItemCoreType} {
    return SyncNext.gatherRequestData(sphere,{key:'fingerprints', type:'fingerprint'});
  }
}

