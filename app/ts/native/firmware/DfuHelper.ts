import { BluenetPromiseWrapper}  from '../libInterface/BluenetPromise';
import {LOG, LOGd, LOGe, LOGi} from '../../logging/Log'
import { SetupStateHandler } from "../setup/SetupStateHandler";
import { core } from "../../Core";
import { StoneUtil } from "../../util/StoneUtil";
import { delay } from "../../util/Util";
import { CommandAPI } from "../../logic/constellation/Commander";
import { Scheduler } from "../../logic/Scheduler";

export class DfuHelper {
  handle : any;
  sphereId : string;
  stoneId : string;

  abortedDFU = false;

  // Ensure the provided cloudhelper has already gotten information and downloaded the bootloader/fw.
  constructor(sphereId, stoneId, stone?) {
    stone = stone ? stone : StoneUtil.getStoneObject(sphereId, stoneId);
    this.handle = stone.config.handle;
    this.sphereId = sphereId;
    this.stoneId = stoneId;
  }

  async putInDFU(commander: CommandAPI, crownstoneMode: crownstoneModes) : Promise<void> {
    if (crownstoneMode.dfuMode) {
      LOGi.info("DfuHelper: putInDFU: already in DFU mode!", crownstoneMode);
    }
    else {
      return this._putInDFU(commander, crownstoneMode.setupMode);
    }
  }

  async _putInDFU(commander: CommandAPI, stoneIsInSetupMode : boolean) : Promise<void> {
    try {
      if (stoneIsInSetupMode) {
        await commander.setupPutInDFU();
      } else {
        await commander.putInDFU();
      }
      LOG.info("DfuHelper: DFU progress: Placed in DFU mode.");
      await commander.end();

      await Scheduler.delay(3000)
    }
    catch (err) {
      LOGe.info("DfuHelper: Error during putInDFU.", err);
      commander.end();
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
        LOGd.info("DfuHelper: DFU event:", data);
        progressCallback(data.progress*0.01);
      });

      LOG.info("DfuHelper: performing " + label + " update.");
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
    LOG.info("DfuHelper: Scheduling " +label+ " update in promise manager for handle:", this.handle);
  }


  setup(crownstoneMode: crownstoneModes, progressCallback) : Promise<void> {
    if (crownstoneMode.dfuMode === true) {
      return new Promise((resolve, reject) => {
        LOGe.info("DfuHelper: Cannot perform setup in DFU mode!");
        reject("Cannot perform setup in DFU mode!");
      });
    }
    else {
      if (!crownstoneMode.setupMode) {
        return Promise.resolve();
      }

      let unsubscribe = core.nativeBus.on(core.nativeBus.topics.setupProgress, (progress) => {
        LOGd.info("DfuHelper: Setup event:", progress);
        progressCallback(progress/13);
      });

      // the setupStateHandler already uses the PromiseManager so we cant do it here. It would lead to dfu waiting on setup waiting on dfu.
      return SetupStateHandler.setupExistingStone(this.handle, this.sphereId, this.stoneId, true)
        .catch((err) => {
          if (this.abortedDFU) { throw err; }
          // try again
          progressCallback(0);
          return SetupStateHandler.setupExistingStone(this.handle, this.sphereId, this.stoneId, true)
        })
        .then(() => {
          unsubscribe();
          LOG.info("DfuHelper: DFU progress: Setup complete.");
        })
        .catch((err) => {
          unsubscribe();
          throw err;
        })
    }
  }
}
