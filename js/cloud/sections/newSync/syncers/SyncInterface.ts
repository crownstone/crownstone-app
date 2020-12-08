import { LOGe } from "../../../../logging/Log";
import { xUtil } from "../../../../util/StandAloneUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";



export class SyncInterface<LocalDataFormat, CloudDataFormat extends {id: string}, CloudSettableFormat> {

  cloudSphereId: string;
  cloudId: string;
  localSphereId: string;
  localId: string;
  actions: any[];
  globalCloudIdMap : globalIdMap;
  // globalLocalIdMap : globalIdMap;

  constructor(options: SyncInterfaceOptions) {
    this.cloudSphereId    = options.cloudSphereId;
    this.cloudId          = options.cloudId;
    this.globalCloudIdMap = options.globalCloudIdMap, // this is a map of cloudIds and the corresponding localIds that have been created or exist for them.
    this.actions          = options.actions;

    this.localSphereId = MapProvider.cloud2localMap.spheres[this.cloudSphereId];
    this.localId       = this.getLocalId()
  }

  generateLocalId() : string {
    let localID = xUtil.getUUID();
    return localID;
  }

  getLocalId() : string {
    throw "MUST_BE_IMPLEMENTED";
  }

  static mapLocalToCloud(localSphereId: string, localId: string, localData) {
    throw "MUST_BE_IMPLEMENTED"
  }

  _mapLocalToCloud(localItem?: LocalDataFormat) : CloudSettableFormat | null {
    throw "MUST_BE_IMPLEMENTED"
  }

  mapCloudToLocal(cloudItem: CloudDataFormat) {
    throw "MUST_BE_IMPLEMENTED"
  }

  updateCloudId(cloudId) {
    throw "MUST_BE_IMPLEMENTED"
  }

  removeFromLocal() {
    throw "MUST_BE_IMPLEMENTED"
  }

  createLocal(cloudData: CloudDataFormat) {
    throw "MUST_BE_IMPLEMENTED"
  }

  updateLocal(cloudData: CloudDataFormat) {
    throw "MUST_BE_IMPLEMENTED"
  }

  setReplyWithData(reply: SyncRequestSphereData) {
    throw "MUST_BE_IMPLEMENTED"
  }

  process(response: SyncResponseItemCore<CloudDataFormat>, reply: SyncRequestSphereData) {
    if (!response) { return; }

    switch (response.status) {
      case "ACCESS_DENIED":
      // Do nothing. A guest or member tried to set something they do not have access to.
      // Fall through:
      case "IN_SYNC":
      // Do nothing, cloud has the same data.
      // Fall through:
      case "UPDATED_IN_CLOUD":
        // Do nothing. The cloud has updated it's model to match yours.
        break;
      case "CREATED_IN_CLOUD":
        // Store the cloudId: this is the id in the data field.
        this.updateCloudId(response.data.id)
        break;
      case "ERROR":
        LOGe.info("Error in sync", response.error);
        break;
      case "NOT_AVAILABLE":
        // Delete sphere from the store since it does not exist on the cloud.
        this.removeFromLocal();
        break;
      case "VIEW":
      // View is requested and plainly added.
      case "NEW_DATA_AVAILABLE":
        // Store provided sphere data in database, create if we don't have one yet..
        if (!this.localId) {
          this.createLocal(response.data)
        }
        else {
          this.updateLocal(response.data);
        }
        break;
      case "REQUEST_DATA":
        // Fill the reply phase with the sphere so we can update the cloud.
        this.setReplyWithData(reply)
        break;
      default:
      // do nothing.
    }
  }

}