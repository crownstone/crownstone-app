import { MapProvider } from "../../../../../backgroundProcesses/MapProvider";
import { SyncBaseInterface } from "./SyncBaseInterface";



export class SyncSphereInterface<LocalDataFormat, LocalDataSettableFormat, CloudDataFormat extends {id: string}, CloudSettableFormat>
  extends SyncBaseInterface<LocalDataFormat, CloudDataFormat, CloudSettableFormat> {

  cloudSphereId:    string;
  localSphereId:    string;

  transferrer : TransferSphereTool<LocalDataFormat, LocalDataSettableFormat, CloudDataFormat, CloudSettableFormat>;
  sphereIdMap: syncIdMap

  constructor(
    transferrer: TransferSphereTool<LocalDataFormat, LocalDataSettableFormat, CloudDataFormat, CloudSettableFormat>,
    options:     SyncInterfaceOptions
  ) {
    super(options);
    this.transferrer   = transferrer;
    this.cloudSphereId = options.cloudSphereId;
    this.sphereIdMap = options.sphereIdMap;
    this.localSphereId = this.globalCloudIdMap.spheres[this.cloudSphereId] || MapProvider.cloud2localMap.spheres[this.cloudSphereId];
  }

  updateLocal(cloudData: CloudDataFormat) {
    this.actions.push(this.transferrer.getUpdateLocalAction(this.localSphereId, this.localId, this.transferrer.mapCloudToLocal(cloudData)));
  }

  updateCloudId(cloudId, data) {
    this.actions.push(this.transferrer.getUpdateLocalCloudIdAction(this.localSphereId, this.localId, cloudId));
  }

  removeFromLocal() {
    this.actions.push(this.transferrer.getRemoveFromLocalAction(this.localSphereId, this.localId));
  }


  process(response: SyncResponseItemCore<CloudDataFormat>, reply: SyncRequestSphereData) {
    super.process(response, reply);
  }

  static prepare(sphereRequest) {
    throw "MUST_BE_IMPLEMENTED"
  }

}