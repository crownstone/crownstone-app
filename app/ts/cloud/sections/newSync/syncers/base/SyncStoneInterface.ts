import { LOGe } from "../../../../../logging/Log";
import { xUtil } from "../../../../../util/StandAloneUtil";
import { MapProvider } from "../../../../../backgroundProcesses/MapProvider";
import { SyncBaseInterface } from "./SyncBaseInterface";
import { LocationTransferNext } from "../../transferrers/LocationTransferNext";
import { ToonTransferNext } from "../../transferrers/ToonTransferNext";



export class SyncStoneInterface<LocalDataFormat, LocalDataSettableFormat, CloudDataFormat extends {id: string}, CloudSettableFormat>
  extends SyncBaseInterface<LocalDataFormat, CloudDataFormat, CloudSettableFormat> {

  cloudSphereId:    string;
  localSphereId:    string;

  cloudStoneId : string;
  localStoneId : string;

  transferrer : TransferStoneTool<LocalDataFormat, LocalDataSettableFormat, CloudDataFormat, CloudSettableFormat>;

  constructor(
    transferrer: TransferStoneTool<LocalDataFormat, LocalDataSettableFormat, CloudDataFormat, CloudSettableFormat>,
    options:     SyncInterfaceOptions,
    cloudStoneId: string,
  ) {
    super(options);
    this.transferrer   = transferrer;
    this.cloudStoneId  = cloudStoneId;
    this.cloudSphereId = options.cloudSphereId;
    this.localStoneId  = this.globalCloudIdMap.stones[this.cloudStoneId]   || MapProvider.cloud2localMap.stones[this.cloudStoneId];
    this.localSphereId = this.globalCloudIdMap.spheres[this.cloudSphereId] || MapProvider.cloud2localMap.spheres[this.cloudSphereId];
  }

  updateLocal(cloudData: CloudDataFormat) {
    this.actions.push(this.transferrer.getUpdateLocalAction(this.localSphereId, this.localStoneId, this.localId, this.transferrer.mapCloudToLocal(cloudData)));
  }

  updateCloudId(cloudId, data) {
    this.actions.push(this.transferrer.getUpdateLocalCloudIdAction(this.localSphereId, this.localStoneId, this.localId, cloudId));
  }

  removeFromLocal() {
    this.actions.push(this.transferrer.getRemoveFromLocalAction(this.localSphereId, this.localStoneId, this.localId));
  }

  process(response: SyncResponseItemCore<CloudDataFormat>, reply: SyncRequestSphereData) {
    super.process(response, reply);
  }

}