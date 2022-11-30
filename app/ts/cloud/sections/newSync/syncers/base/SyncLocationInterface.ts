import { MapProvider } from "../../../../../backgroundProcesses/MapProvider";
import { SyncBaseInterface } from "./SyncBaseInterface";


export class SyncLocationInterface<LocalDataFormat, LocalDataSettableFormat, CloudDataFormat extends {id: string}, CloudSettableFormat>
  extends SyncBaseInterface<LocalDataFormat, CloudDataFormat, CloudSettableFormat> {

  cloudSphereId:    string;
  localSphereId:    string;

  cloudLocationId : string;
  localLocationId : string;

  transferrer : TransferStoneTool<LocalDataFormat, LocalDataSettableFormat, CloudDataFormat, CloudSettableFormat>;
  sphereIdMap : syncIdMap;

  constructor(
    transferrer: TransferStoneTool<LocalDataFormat, LocalDataSettableFormat, CloudDataFormat, CloudSettableFormat>,
    options:     SyncInterfaceOptions,
    cloudLocationId: string,
  ) {
    super(options);
    this.transferrer     = transferrer;
    this.sphereIdMap     = options.sphereIdMap;
    this.cloudLocationId = cloudLocationId;
    this.cloudSphereId   = options.cloudSphereId;
    this.localLocationId = this.globalCloudIdMap.locations[this.cloudLocationId] || MapProvider.cloud2localMap.locations[this.cloudLocationId] || this.cloudLocationId;
    this.localSphereId   = this.globalCloudIdMap.spheres[this.cloudSphereId]     || MapProvider.cloud2localMap.spheres[this.cloudSphereId];
  }

  updateLocal(cloudData: CloudDataFormat) {
    this.actions.push(this.transferrer.getUpdateLocalAction(this.localSphereId, this.localLocationId, this.localId, this.transferrer.mapCloudToLocal(cloudData)));
  }

  updateCloudId(cloudId, data) {
    this.actions.push(this.transferrer.getUpdateLocalCloudIdAction(this.localSphereId, this.localLocationId, this.localId, cloudId));
  }

  removeFromLocal() {
    this.actions.push(this.transferrer.getRemoveFromLocalAction(this.localSphereId, this.localLocationId, this.localId));
  }

  process(response: SyncResponseItemCore<CloudDataFormat>, reply: SyncRequestSphereData) {
    super.process(response, reply);
  }

}