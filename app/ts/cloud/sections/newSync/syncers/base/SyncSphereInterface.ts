import { LOGe } from "../../../../../logging/Log";
import { xUtil } from "../../../../../util/StandAloneUtil";
import { MapProvider } from "../../../../../backgroundProcesses/MapProvider";
import { SyncBaseInterface } from "./SyncBaseInterface";



export class SyncSphereInterface<LocalDataFormat, CloudDataFormat extends {id: string}, CloudSettableFormat>
  extends SyncBaseInterface<LocalDataFormat, CloudDataFormat, CloudSettableFormat> {

  cloudSphereId:    string;
  localSphereId:    string;

  constructor(options: SyncInterfaceOptions) {
    super(options);
    this.cloudSphereId    = options.cloudSphereId;
    this.localSphereId = this.globalCloudIdMap.spheres[this.cloudSphereId] || MapProvider.cloud2localMap.spheres[this.cloudSphereId];
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