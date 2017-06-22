import { Alert } from 'react-native';

import { BlePromiseManager }     from '../../logic/BlePromiseManager'
import { BluenetPromiseWrapper}  from '../libInterface/BluenetPromise';
import { NativeBus }             from '../libInterface/NativeBus';
import { LOG }                   from '../../logging/Log'
import { Util }                  from '../../util/Util'
import { SetupStateHandler } from "../setup/SetupStateHandler";
import { eventBus } from "../../util/EventBus";
import { ALWAYS_DFU_UPDATE } from "../../ExternalConfig";
import {Scheduler} from "../../logic/Scheduler";


interface dfuData {
  handle: string,
  sphereId: string,
  stoneId: string,
  firmwareURI: string,
  bootloaderURI: string,
  stoneFirmwareVersion: string,
  stoneBootloaderVersion: string
  newFirmwareDetails: any,
  newBootloaderDetails: any
}


const bootloaderUpdate = "PERFORM_UPDATE_BOOTLOADER";
const firmwareUpdate   = "PERFORM_UPDATE_FIRMWARE";
const resetAfterUpdate = "PERFORM_FACTORY_RESET";
const setupAfterUpdate = "PERFORM_SETUP";


interface crownstoneModes {
  setupMode: boolean,
  dfuMode: boolean,
}

export class FirmwareHelper {
  handle : any;

  // things to be filled out during setup process
  sphereId : string;
  stoneId : string;
  firmwareURI : string;
  bootloaderURI : string;
  stoneFirmwareVersion : string;
  stoneBootloaderVersion : string;
  newFirmwareDetails : any;
  newBootloaderDetails : any;
  resetRequired : boolean = false;
  eventSubscriptions : any = [];

  phases : string[];

  constructor(dfuData : dfuData) {
    this.handle = dfuData.handle;
    this.sphereId = dfuData.sphereId;
    this.stoneId = dfuData.stoneId;
    this.firmwareURI = dfuData.firmwareURI;
    this.bootloaderURI = dfuData.bootloaderURI;
    this.stoneFirmwareVersion = dfuData.stoneFirmwareVersion;
    this.stoneBootloaderVersion = dfuData.stoneBootloaderVersion;
    this.newFirmwareDetails = dfuData.newFirmwareDetails;
    this.newBootloaderDetails = dfuData.newBootloaderDetails;
  }

  getAmountOfPhases(dfuResetRequired) {
    this.phases = [];
    LOG.info("FirmwareHelper: Getting Phases...");
    if (Util.versions.isHigher(this.newBootloaderDetails.version, this.stoneBootloaderVersion) || ALWAYS_DFU_UPDATE) {
      // UPDATE BOOTLOADER
      LOG.info("FirmwareHelper: Phase: Require Bootloader.");
      this.phases.push(bootloaderUpdate);
    }

    if (Util.versions.isHigher(this.newFirmwareDetails.version, this.stoneFirmwareVersion) || ALWAYS_DFU_UPDATE) {
      // UPDATE firmware
      LOG.info("FirmwareHelper: Phase: Require Firmware.");
      this.phases.push(firmwareUpdate);
    }

    if (
        dfuResetRequired ||
        Util.versions.isLower(this.stoneBootloaderVersion, this.newBootloaderDetails.minimumCompatibleVersion) ||
        Util.versions.isLower(this.stoneFirmwareVersion,   this.newFirmwareDetails.minimumCompatibleVersion) ||
        ALWAYS_DFU_UPDATE
       ) {
      // PERFORM SETUP AFTERWARDS
      LOG.info("FirmwareHelper: Phase: Require Setup Afterwards.");
      this.resetRequired = true;
      this.phases.push(resetAfterUpdate);
      this.phases.push(setupAfterUpdate);
    }

    return this.phases.length;
  }


  /**
   * This is used to force a setup run after the crownstone has been restored from DFU mode.
   */
  loadSetupPhase() {
    this.phases.push(setupAfterUpdate);
  }

  putInDFU(crownstoneMode: crownstoneModes) {
    if (crownstoneMode.dfuMode === true) {
      return new Promise((resolve, reject) => { resolve(); });
    }

    let setupPromise = () => {
      return this._putInDFU(crownstoneMode.setupMode)
    };

    // we load the DFU into the promise manager with priority so we are not interrupted
    return BlePromiseManager.registerPriority(setupPromise, {from: 'DFU: setting in dfu mode: ' + this.handle});
  }

  _putInDFU(stoneIsInSetupMode : boolean) {
    return new Promise((resolve, reject) => {
      BluenetPromiseWrapper.connect(this.handle)
        .then(() => {
          LOG.info("FirmwareHelper: DFU progress: Connected.");
          if (stoneIsInSetupMode) {
            return BluenetPromiseWrapper.setupPutInDFU();
          }
          else {
            return BluenetPromiseWrapper.putInDFU();
          }
        })
        .then(() => {
          LOG.info("FirmwareHelper: DFU progress: Placed in DFU mode.");
          if (stoneIsInSetupMode) {
            return BluenetPromiseWrapper.phoneDisconnect();
          }
          else {
            return BluenetPromiseWrapper.disconnectCommand();
          }
        })
        .then(() => { return delay(3000); })
        .then(() => { resolve(); })
        .catch((err) => {
          LOG.error("FirmwareHelper: Error during putInDFU.", err);
          BluenetPromiseWrapper.phoneDisconnect().catch();
          reject(err);
        })
    })
  }

  getBootloaderVersion() {
    let setupPromise = () => {
      return new Promise((resolve, reject) => {
        BluenetPromiseWrapper.connect(this.handle)
          .then(() => {
            LOG.info("FirmwareHelper: DFU progress: Reconnected.");
            return BluenetPromiseWrapper.getBootloaderVersion();
          })
          .then((bootloaderVersion) => {
            LOG.info("FirmwareHelper: DFU progress: Obtained bootloader version:", bootloaderVersion);
            this.stoneBootloaderVersion = bootloaderVersion;
            return BluenetPromiseWrapper.phoneDisconnect()
          })
          .then(() => { return delay(1000); })
          .then(() => {
            resolve(this.stoneBootloaderVersion);
          })
          .catch((err) => {
            LOG.error("FirmwareHelper: Error during getBootloaderVersion.", err);
            BluenetPromiseWrapper.phoneDisconnect().catch();
            reject(err);
          })
      })
    };

    // we load the DFU into the promise manager with priority so we are not interrupted
    return BlePromiseManager.registerPriority(setupPromise, {from: 'Setup: determining bootloader version: ' + this.handle});
  }

  performPhase(phaseNumber, crownstoneMode: crownstoneModes) {
    if (this.phases.length < phaseNumber - 1) {
      return new Promise((resolve, reject) => {
        reject("This phase does not exist in the queue" + JSON.stringify(this.phases));
      })
    }

    this.eventSubscriptions.push(NativeBus.on(NativeBus.topics.dfuProgress, (data) => {
      LOG.verbose("FirmwareHelper: DFU event:", data);
      eventBus.emit("updateDfuProgress", (data.progress*0.01));
    }));
    this.eventSubscriptions.push(NativeBus.on(NativeBus.topics.setupProgress, (progress) => {
      LOG.verbose("FirmwareHelper: Setup event:", progress);
      eventBus.emit("updateDfuProgress", (progress/13));
    }));

    switch (this.phases[phaseNumber]) {
      case bootloaderUpdate:
        return this._updateBootloader(crownstoneMode);
      case firmwareUpdate:
        return this._updateFirmware(crownstoneMode);
      case resetAfterUpdate:
        return this._reset(crownstoneMode);
      case setupAfterUpdate:
        return this._setup(crownstoneMode);
      default:
        break;
    }
  }

  dfuSegmentFinishedAtPhase(phaseNumber) {
    if (phaseNumber < this.phases.length && (this.phases[phaseNumber] === resetAfterUpdate || this.phases[phaseNumber] === setupAfterUpdate)) {
      return true;
    }
    return false;
  }

  finish() {
    this.eventSubscriptions.forEach((unsubscribe) => { unsubscribe(); });
  }

  restartInAppMode() {
    return BluenetPromiseWrapper.bootloaderToNormalMode( this.handle ).then(() => { return delay(1000); });
  }

  _updateBootloader(crownstoneMode: crownstoneModes) {
    let action = () => {
      let updateProcess = () => {
        LOG.info("FirmwareHelper: performing bootloader update.");
        return BluenetPromiseWrapper.performDFU(this.handle, this.bootloaderURI)
          .then(() => { return delay(1500); })
          .catch((err) => { BluenetPromiseWrapper.phoneDisconnect(); throw err; })
      };

      if (crownstoneMode.dfuMode === false) {
        return this._putInDFU(crownstoneMode.setupMode)
          .then(() => { return updateProcess(); })
      }
      else {
        return updateProcess();
      }
    };
    // we load the DFU into the promise manager with priority so we are not interrupted
    LOG.info("FirmwareHelper: Scheduling bootloader update in promise manager for handle:", this.handle);
    return BlePromiseManager.registerPriority(action, {from: 'DFU: updating Bootloader ' + this.handle}, 300000); // 5 min timeout
  }

  _updateFirmware(crownstoneMode: crownstoneModes) {
    let action = () => {
      let updateProcess = () => {
        return BluenetPromiseWrapper.performDFU(this.handle, this.firmwareURI)
          .then(() => { return delay(1500); })
          .catch((err) => { BluenetPromiseWrapper.phoneDisconnect(); throw err; })
      };

      if (crownstoneMode.dfuMode === false) {
        return this._putInDFU(crownstoneMode.setupMode)
          .then(() => { return updateProcess(); })
      }
      else {
        return updateProcess()
      }
    };
    // we load the DFU into the promise manager with priority so we are not interrupted
    return BlePromiseManager.registerPriority(action, {from: 'DFU: updating firmware ' + this.handle}, 300000); // 5 min timeout
  }

  _reset(crownstoneMode: crownstoneModes) {
    let action = () => {

      if (crownstoneMode.dfuMode === true) {
        return new Promise((resolve, reject) => {
          LOG.error("FirmwareHelper: Cannot perform factory reset in DFU mode!");
          reject("Cannot perform factory reset in DFU mode!");
        });
      }
      else {
        return BluenetPromiseWrapper.connect(this.handle)
          .then(() => {
            eventBus.emit("updateDfuProgress", 0.25);
            LOG.info("FirmwareHelper: DFU progress: Reconnected.");
            if (crownstoneMode.setupMode === true) {
              return BluenetPromiseWrapper.setupFactoryReset();
            }
            else {
              return BluenetPromiseWrapper.commandFactoryReset()
                .then(() => {
                  return BluenetPromiseWrapper.disconnectCommand();
                })
                .catch((err) => {
                  BluenetPromiseWrapper.phoneDisconnect(); throw err;
                })
            }
          })
          .then(() => {
            eventBus.emit("updateDfuProgress", 0.50);
          })
          .then(() => { return delay(1000, () => { eventBus.emit("updateDfuProgress", 0.6); }); })
          .then(() => { return delay(1000, () => { eventBus.emit("updateDfuProgress", 0.7); }); })
          .then(() => { return delay(1000, () => { eventBus.emit("updateDfuProgress", 0.8); }); })
          .then(() => { return delay(1000, () => { eventBus.emit("updateDfuProgress", 0.9); }); })
          .then(() => { return delay(1000, () => { eventBus.emit("updateDfuProgress", 1.0); }); })
          .then(() => {
            LOG.info("FirmwareHelper: DFU progress: Reset complete.");
          });
      }


    };
    // we load the DFU into the promise manager with priority so we are not interrupted
    return BlePromiseManager.registerPriority(action, {from: 'DFU: performing reset ' + this.handle}, 60000); // 1 min timeout
  }

  _setup(crownstoneMode: crownstoneModes) {
    if (crownstoneMode.dfuMode === true) {
      return new Promise((resolve, reject) => {
        LOG.error("FirmwareHelper: Cannot perform setup in DFU mode!");
        reject("Cannot perform setup in DFU mode!");
      });
    }
    else {
      if (!crownstoneMode.setupMode) {
        return new Promise((resolve, reject) => { resolve(); });
      }
      // the setupStateHandler already uses the PromiseManager so we cant do it here. It would lead to dfu waiting on setup waiting on dfu.
      return SetupStateHandler.setupExistingStone(this.handle, this.sphereId, this.stoneId, true)
        .catch(() => {
          // try again
          eventBus.emit("updateDfuProgress", 0.0);
          return SetupStateHandler.setupExistingStone(this.handle, this.sphereId, this.stoneId, true)
        })
        .then(() => {
          LOG.info("FirmwareHelper: DFU progress: Setup complete.");
        })
    }
  }
}

const delay = function(ms, performAfterDelay = null) {
  return new Promise((resolve, reject) => {
    // we use the scheduleCallback instead of setTimeout to make sure the process won't stop because the user disabled his screen.
    Scheduler.scheduleCallback(() => {
      if (performAfterDelay !== null && typeof performAfterDelay === 'function') {
        performAfterDelay()
      }
      resolve();
    }, ms, 'dfuDelay');
  })
};