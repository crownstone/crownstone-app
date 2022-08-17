import { MapProvider } from "../../../../../backgroundProcesses/MapProvider";
import { SyncBaseInterface } from "./SyncBaseInterface";


export class SyncMessageInterface<LocalDataFormat, LocalDataSettableFormat, CloudDataFormat extends {id: string}, CloudSettableFormat>
  extends SyncBaseInterface<LocalDataFormat, CloudDataFormat, CloudSettableFormat> {

  cloudSphereId:    string;
  localSphereId:    string;

  cloudMessageId : string;
  localMessageId : string;

  transferrer : TransferMessageTool<LocalDataFormat, LocalDataSettableFormat, CloudDataFormat, CloudSettableFormat>;

  constructor(
    transferrer: TransferMessageTool<LocalDataFormat, LocalDataSettableFormat, CloudDataFormat, CloudSettableFormat>,
    options:     SyncInterfaceOptions,
    cloudMessageId: string,
  ) {
    super(options);
    this.transferrer   = transferrer;
    this.cloudMessageId  = cloudMessageId;
    this.cloudSphereId = options.cloudSphereId;
    this.localMessageId  = this.globalCloudIdMap.messages[this.cloudMessageId] || MapProvider.cloud2localMap.messages[this.cloudMessageId];
    this.localSphereId = this.globalCloudIdMap.spheres[this.cloudSphereId] || MapProvider.cloud2localMap.spheres[this.cloudSphereId];
  }

  updateLocal(cloudData: CloudDataFormat) {
    this.actions.push(this.transferrer.getUpdateLocalAction(this.localSphereId, this.localMessageId, this.localId, this.transferrer.mapCloudToLocal(cloudData)));
  }

  updateCloudId(cloudId, data) {
    this.actions.push(this.transferrer.getUpdateLocalCloudIdAction(this.localSphereId, this.localMessageId, this.localId, cloudId));
  }

  removeFromLocal() {
    this.actions.push(this.transferrer.getRemoveFromLocalAction(this.localSphereId, this.localMessageId, this.localId));
  }

  process(response: SyncResponseItemCore<CloudDataFormat>, reply: SyncRequestSphereData) {
    super.process(response, reply);
  }

}