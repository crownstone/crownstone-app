import { Get } from "../../../../util/GetUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { SyncInterface } from "./base/SyncInterface";
import { SphereTransferNext } from "../transferrers/SphereTransferNext";
import { SyncUtil } from "../../../../util/SyncUtil";


export class SphereSyncerNext extends SyncInterface<SphereData, SphereDataConfig, cloud_Sphere, cloud_Sphere_settable> {

  constructor(options: SyncInterfaceBaseOptions) {
    super(SphereTransferNext, options);
  }


  getLocalId() {
    return this.globalCloudIdMap.spheres[this.cloudId] || MapProvider.cloud2localMap.spheres[this.cloudId];
  }


  createLocal(cloudData: cloud_Sphere) {
    let newData = SphereTransferNext.getCreateLocalAction(SphereTransferNext.mapCloudToLocal(cloudData))
    this.actions.push(newData.action)
    this.globalCloudIdMap.spheres[this.cloudId] = newData.id;
  }


  setReplyWithData(reply: SyncRequestSphereData) {
    let sphere = Get.sphere(this.localId);
    if (!sphere) { return null; }
    SyncUtil.constructReply(reply,[this.cloudId],
      SphereTransferNext.mapLocalToCloud(sphere)
    );
  }
}

