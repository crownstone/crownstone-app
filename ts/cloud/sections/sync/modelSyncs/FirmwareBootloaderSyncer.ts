/**
 *
 * Sync the Fri from the cloud to the database.
 *
 */

import { CLOUD}        from "../../../cloudAPI";
import { SyncingBase } from "./SyncingBase";
import { xUtil } from "../../../../util/StandAloneUtil";

export class FirmwareBootloaderSyncer extends SyncingBase {
  userId : string;

  downloadFirmware() {
    return CLOUD.getLatestAvailableFirmware();
  }

  downloadBootloader() {
    return CLOUD.getLatestAvailableBootloader();
  }

  sync(store) {
    let state = store.getState();
    this.userId = state.user.userId;

    return this.downloadFirmware()
      .then((firmwareData) => {
        let userInState = store.getState().user;
        this.syncDownFirmware(userInState, firmwareData);
        return this.downloadBootloader()
      })
      .then((bootloaderData) => {
        let userInState = store.getState().user;
        this.syncDownBootloader(userInState, bootloaderData);
        return Promise.all(this.transferPromises);
      })
      .catch((err) => {})
      .then(() => { return this.actions });
  }

  syncDownFirmware(userInState, firmwaresInCloud) {
    if (
      userInState &&
      firmwaresInCloud &&
      xUtil.stringify(userInState.firmwareVersionsAvailable) !== xUtil.stringify(firmwaresInCloud)
    ) {
      this.actions.push({type:'SET_NEW_FIRMWARE_VERSIONS', data: {firmwareVersionsAvailable: firmwaresInCloud}})
    }
  }

  syncDownBootloader(userInState, bootloadersInCloud) {
    if (
      userInState &&
      bootloadersInCloud &&
      xUtil.stringify(userInState.bootloaderVersionsAvailable) !== xUtil.stringify(bootloadersInCloud)
    ) {
      this.actions.push({type:'SET_NEW_FIRMWARE_VERSIONS', data: {bootloaderVersionsAvailable: bootloadersInCloud}})
    }
  }
}
