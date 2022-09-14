import {BluenetPromiseWrapper} from '../libInterface/BluenetPromise';
import {LOG, LOGd, LOGe, LOGi} from '../../logging/Log'
import {SetupStateHandler} from "../setup/SetupStateHandler";
import {core} from "../../Core";
import {delay} from "../../util/Util";
import {CommandAPI} from "../../logic/constellation/Commander";
import {Scheduler} from "../../logic/Scheduler";
import {Get} from "../../util/GetUtil";

export class DfuHelper {
  handle : any;
  sphereId : string;
  stoneId : string;

  abortedDFU = false;

  // Ensure the provided cloudhelper has already gotten information and downloaded the bootloader/fw.
  constructor(sphereId, stoneId, stone?) {
    stone = stone ? stone : Get.stone(sphereId, stoneId);
    this.handle = stone.config.handle;
    this.sphereId = sphereId;
    this.stoneId = stoneId;
  }

  async putInDFU(commander: CommandAPI, crownstoneMode: crownstoneModes) : Promise<void> {
    if (crownstoneMode.dfuMode) {
      LOGi.dfu("DfuHelper: putInDFU: already in DFU mode!", crownstoneMode);
    }
    else {
      return this._putInDFU(commander, crownstoneMode.setupMode);
    }
  }

  async _putInDFU(commander: CommandAPI, stoneIsInSetupMode : boolean) : Promise<void> {
    try {
      if (stoneIsInSetupMode) {
        await commander.setupPutInDFU();
      }
      else {
        await commander.putInDFU();
      }
      LOG.dfu("DfuHelper: DFU progress: Placed in DFU mode.");
      await commander.disconnect();

      await Scheduler.delay(3000)
    }
    catch (err : any) {
      LOGe.dfu("DfuHelper: Error during putInDFU.", err?.message);
      commander.disconnect();
      throw err;
    }
  }

  // restartInAppMode() {
  //   let action = () => {
  //     LOG.info("DfuHelper: performing bootloaderToNormalMode.");
  //     return BluenetPromiseWrapper.bootloaderToNormalMode( this.handle ).then(() => { return delay(1000); });
  //   };
  //   return BlePromiseManager.registerPriority(action, {from: 'DFU: bootloaderToNormalMode' + this.handle});
  // }

  updateBootloader(crownstoneMode: crownstoneModes, bootloaderPath, progressCallback) {
    return this.performUpdate(crownstoneMode, bootloaderPath, progressCallback, 'Bootloader');
  }

  updateFirmware(crownstoneMode: crownstoneModes, firmwarePath, progressCallback) {
    return this.performUpdate(crownstoneMode, firmwarePath, progressCallback, 'Firmware');
  }

  performUpdate(crownstoneMode, path, progressCallback, label= "Data") {
    let updateProcess = () => {
      let unsubscribe = core.nativeBus.on(core.nativeBus.topics.dfuProgress, (data) => {
        LOGd.dfu("DfuHelper: DFU event:", data);
        progressCallback(data.progress*0.01);
      });

      LOG.dfu("DfuHelper: performing " + label + " update.");
      return BluenetPromiseWrapper.performDFU(this.handle, path)
        .then(() => { return delay(1500); })
        .then(() => { unsubscribe(); })
        .catch((err) => {
          unsubscribe();
          BluenetPromiseWrapper.phoneDisconnect(this.handle);
          throw err;
        })
    };

    if (crownstoneMode.dfuMode === false) {
      return this._putInDFU(crownstoneMode, crownstoneMode.setupMode)
        .then(() => { return updateProcess(); })
    }
    else {
      return updateProcess();
    }

    // we load the DFU into the promise manager with priority so we are not interrupted
    LOG.dfu("DfuHelper: Scheduling " +label+ " update in promise manager for handle:", this.handle);
  }


  setup(commander: CommandAPI, crownstoneMode: crownstoneModes, progressCallback) : Promise<void> {
    if (crownstoneMode.dfuMode === true) {
      return new Promise((resolve, reject) => {
        LOGe.dfu("DfuHelper: Cannot perform setup in DFU mode!");
        reject(new Error("Cannot perform setup in DFU mode!"));
      });
    }
    else {
      if (!crownstoneMode.setupMode) {
        return Promise.resolve();
      }

      let unsubscribe = core.nativeBus.on(core.nativeBus.topics.setupProgress, (progress) => {
        LOGd.dfu("DfuHelper: Setup event:", progress);
        progressCallback(progress/13);
      });

      // the setupStateHandler already uses the PromiseManager so we cant do it here. It would lead to dfu waiting on setup waiting on dfu.
      return SetupStateHandler.setupExistingStone(this.handle, this.sphereId, this.stoneId, true, commander)
        .catch((err) => {
          if (this.abortedDFU) { throw err; }
          // try again
          LOG.dfu("DfuHelper: DFU progress: Retry setup.");
          progressCallback(0);
          return SetupStateHandler.setupExistingStone(this.handle, this.sphereId, this.stoneId, true, commander)
        })
        .then(() => {
          unsubscribe();
          LOG.dfu("DfuHelper: DFU progress: Setup complete.");
        })
        .catch((err) => {
          unsubscribe();
          throw err;
        })
    }
  }
}
