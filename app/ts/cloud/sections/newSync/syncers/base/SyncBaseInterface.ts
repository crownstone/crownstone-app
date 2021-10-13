import { LOGe } from "../../../../../logging/Log";
import { xUtil } from "../../../../../util/StandAloneUtil";
import { MapProvider } from "../../../../../backgroundProcesses/MapProvider";


export class SyncBaseInterface<LocalDataFormat, CloudDataFormat extends {id: string}, CloudSettableFormat> {

  cloudId:          string;
  localId:          string;
  actions:          any[];
  transferPromises: Promise<any>[];
  globalCloudIdMap: globalIdMap;

  constructor(options: SyncInterfaceBaseOptions) {
    this.cloudId          = options.cloudId;
    this.actions          = options.actions;
    this.transferPromises = options.transferPromises;

    // this is a map of cloudIds and the corresponding localIds that have been created or exist for them.
    this.globalCloudIdMap = options.globalCloudIdMap;
  }


  getLocalId(cloudItem: CloudDataFormat) : string {
    throw new Error("MUST_BE_IMPLEMENTED_BY_CHILD_CLASS");
  }

  updateCloudId(cloudId: string, cloudItem: CloudDataFormat) {
    throw new Error("MUST_BE_IMPLEMENTED_BY_CHILD_CLASS");
  }

  removeFromLocal() {
    throw new Error("MUST_BE_IMPLEMENTED_BY_CHILD_CLASS");
  }

  createLocal(cloudData: CloudDataFormat) {
    throw new Error("MUST_BE_IMPLEMENTED_BY_CHILD_CLASS");
  }

  updateLocal(cloudData: CloudDataFormat) {
    throw new Error("MUST_BE_IMPLEMENTED_BY_CHILD_CLASS");
  }

  setReplyWithData(reply: SyncRequestSphereData | SyncRequest, cloudData: CloudDataFormat) {
    throw new Error("MUST_BE_IMPLEMENTED_BY_CHILD_CLASS");
  }

  process(response: SyncResponseItemCore<CloudDataFormat>, reply: SyncRequestSphereData | SyncRequest) {
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
      case "ALREADY_IN_CLOUD":
        // Store the cloudId: this is the id in the data field.
        this.updateCloudId(response.data.id, response.data);
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
        this.setReplyWithData(reply, response.data)
        break;
      default:
      // do nothing.
    }
  }
}