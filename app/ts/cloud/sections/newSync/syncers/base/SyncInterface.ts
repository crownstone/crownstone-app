import { SyncBaseInterface } from "./SyncBaseInterface";
import { SphereTransferNext } from "../../transferrers/SphereTransferNext";


export class SyncInterface<LocalDataFormat, LocalDataSettableFormat, CloudDataFormat extends {id: string}, CloudSettableFormat>
  extends SyncBaseInterface<LocalDataFormat, CloudDataFormat, CloudSettableFormat> {

  transferrer : TransferTool<LocalDataFormat, LocalDataSettableFormat, CloudDataFormat, CloudSettableFormat>;

  constructor(
    transferrer: TransferTool<LocalDataFormat, LocalDataSettableFormat, CloudDataFormat, CloudSettableFormat>,
    options: SyncInterfaceBaseOptions
  ) {
    super(options);
    this.transferrer = transferrer;
  }


  updateCloudId(cloudId, data) {
    let action = this.transferrer.getUpdateLocalCloudIdAction(this.localId, cloudId);
    if (action && action.type !== "NOT_REQUIRED") {
      this.actions.push(action);
    }
  }

  removeFromLocal() {
    let action = this.transferrer.getRemoveFromLocalAction(this.localId)
    if (action && action.type !== "NOT_REQUIRED") {
      this.actions.push(action);
    }
  }

  updateLocal(cloudData: CloudDataFormat) {
    let action = this.transferrer.getUpdateLocalAction(this.localId, this.transferrer.mapCloudToLocal(cloudData))
    if (action && action.type !== "NOT_REQUIRED") {
      this.actions.push(action);
    }
  }


}