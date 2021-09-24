import { LOGe } from "../../../../logging/Log";
import { xUtil } from "../../../../util/StandAloneUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";



export class SyncInterface<LocalDataFormat, CloudDataFormat extends {id: string}, CloudSettableFormat> {

  cloudSphereId:    string;
  cloudId:          string;
  localSphereId:    string;
  localId:          string;
  actions:          any[];
  transferPromises: Promise<any>[];
  globalCloudIdMap: globalIdMap;

  constructor(options: SyncInterfaceOptions) {
    this.cloudSphereId    = options.cloudSphereId;
    this.cloudId          = options.cloudId;
    this.actions          = options.actions;
    this.transferPromises = options.transferPromises;

    // this is a map of cloudIds and the corresponding localIds that have been created or exist for them.
    this.globalCloudIdMap = options.globalCloudIdMap,

    this.localSphereId = this.globalCloudIdMap.spheres[this.cloudSphereId] || MapProvider.cloud2localMap.spheres[this.cloudSphereId];
  }


  _generateLocalId() : string {
    let localID = xUtil.getUUID();
    return localID;
  }

  getLocalId(cloudItem: CloudDataFormat) : string {
    throw new Error("MUST_BE_IMPLEMENTED");
  }

  static mapLocalToCloud(localData) {
    throw new Error("MUST_BE_IMPLEMENTED");
  }

  _mapLocalToCloud(localItem?: LocalDataFormat) : CloudSettableFormat | null {
    throw new Error("MUST_BE_IMPLEMENTED");
  }

  mapCloudToLocal(cloudItem: CloudDataFormat) {
    throw new Error("MUST_BE_IMPLEMENTED");
  }

  updateCloudId(cloudId: string, cloudItem: CloudDataFormat) {
    throw new Error("MUST_BE_IMPLEMENTED");
  }

  removeFromLocal() {
    throw new Error("MUST_BE_IMPLEMENTED");
  }

  createLocal(cloudData: CloudDataFormat) {
    throw new Error("MUST_BE_IMPLEMENTED");
  }

  updateLocal(cloudData: CloudDataFormat) {
    throw new Error("MUST_BE_IMPLEMENTED");
  }

  setReplyWithData(reply: SyncRequestSphereData, cloudData: CloudDataFormat) {
    throw new Error("MUST_BE_IMPLEMENTED");
  }

  process(response: SyncResponseItemCore<CloudDataFormat>, reply: SyncRequestSphereData) {
    if (!response) { return; }

    this.localId = this.getLocalId(response.data);

    switch (response.status) {
      case "ACCESS_DENIED":
        // Do nothing. A guest or member tried to set something they do not have access to.
        break;
      case "IN_SYNC":
        // Do nothing, cloud has the same data.
        break;
      case "UPDATED_IN_CLOUD":
        // Do nothing. The cloud has updated it's model to match yours.
        break;
      case "CREATED_IN_CLOUD":
        // Store the cloudId: this is the id in the data field.
        this.updateCloudId(response.data.id, response.data);
        break;
      case "ERROR":
        LOGe.info("Error in sync", response.error);
        break;
      case "NOT_AVAILABLE":
        // Delete sphere from the store since it does not exist on the cloud.
        // TODO: restore the removal:
        // this.removeFromLocal();
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
        this.setReplyWithData(reply, response.data)
        break;
      default:
      // do nothing.
    }
  }

}