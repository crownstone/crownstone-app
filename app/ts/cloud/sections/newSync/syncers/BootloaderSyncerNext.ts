import { xUtil } from "../../../../util/StandAloneUtil";
import { core } from "../../../../Core";
import { SyncViewInterface } from "./base/SyncViewInterface";



export class BootloaderSyncerNext extends SyncViewInterface<FirmwareBootloaderList> {

  handleData(data: FirmwareBootloaderList) {
    let user = core.store.getState().user;
    if (user &&  data && xUtil.stringify(user.bootloaderVersionsAvailable) !== xUtil.stringify(data)) {
      this.actions.push({type:'SET_NEW_BOOTLOADER_VERSIONS', data: {bootloaderVersionsAvailable: data}})
    }
  }
}

