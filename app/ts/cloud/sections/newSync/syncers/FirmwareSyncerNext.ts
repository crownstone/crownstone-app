import { xUtil } from "../../../../util/StandAloneUtil";
import { core } from "../../../../Core";
import {SyncViewInterface} from "./base/SyncViewInterface";



export class FirmwareSyncerNext extends SyncViewInterface<FirmwareBootloaderList> {

  handleData(data: FirmwareBootloaderList) {
    let user = core.store.getState().user;
    if (user &&  data && xUtil.stringify(user.firmwareVersionsAvailable) !== xUtil.stringify(data)) {
      this.actions.push({type:'SET_NEW_FIRMWARE_VERSIONS', data: {firmwareVersionsAvailable: data}})
    }
  }
}

