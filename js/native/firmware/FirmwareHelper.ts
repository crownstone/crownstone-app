import { Alert } from 'react-native';

import { BlePromiseManager }     from '../../logic/BlePromiseManager'
import { BluenetPromiseWrapper}  from '../libInterface/BluenetPromise';
import { NativeBus }             from '../libInterface/NativeBus';
import { LOG }                   from '../../logging/Log'
import { Util }                  from '../../util/Util'
import { SetupStateHandler } from "../setup/SetupStateHandler";
import { eventBus } from "../../util/EventBus";
import { ALWAYS_DFU_UPDATE } from "../../ExternalConfig";


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
  dfuSuccessful : boolean = false;
  resetRequired : boolean = false;

  eventSubscriptions : any = [];

  stoneIsInDFU : boolean = false;

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

  putInDFU(isInDfu : boolean = false) {
    if (isInDfu) {
      return new Promise((resolve, reject) => { resolve(); });
    }


    let setupPromise = () => {
      return this._putInDFU(false)
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
          this.stoneIsInDFU = true;
          return BluenetPromiseWrapper.disconnectCommand();
        })
        .then(() => { return delay(3000); })
        .then(() => { resolve(); })
        .catch((err) => {
          LOG.error("FirmwareHelper: Error during putInDFU.", err);
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
            // Since we are in DFU, getFirmwareVersion actually gets the bootloader version.
            return BluenetPromiseWrapper.getFirmwareVersion();
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
            reject(err);
          })
      })
    };

    // we load the DFU into the promise manager with priority so we are not interrupted
    return BlePromiseManager.registerPriority(setupPromise, {from: 'Setup: determining bootloader version: ' + this.handle});
  }

  performPhase(phaseNumber, stoneIsInSetupMode = false) {
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
        return this._updateBootloader(stoneIsInSetupMode);
      case firmwareUpdate:
        return this._updateFirmware(stoneIsInSetupMode);
      case resetAfterUpdate:
        return this._reset(stoneIsInSetupMode);
      case setupAfterUpdate:
        return this._setup(stoneIsInSetupMode);
      default:
        break;
    }
  }

  finish() {
    this.eventSubscriptions.forEach((unsubscribe) => { unsubscribe(); });
  }

  restartInAppMode() {
    return BluenetPromiseWrapper.bootloaderToNormalMode( this.handle );
  }

  _updateBootloader(stoneIsInSetupMode: boolean) {
    let action = () => {
      if (this.stoneIsInDFU === false) {
        return this._putInDFU(stoneIsInSetupMode)
          .then(() => {
            LOG.info("FirmwareHelper: performing bootloader update.");
            return BluenetPromiseWrapper.performDFU(this.handle, this.bootloaderURI)
          })
          .then(() => { this.stoneIsInDFU = false; })
          .then(() => { return delay(1500); })
          .catch((err) => { BluenetPromiseWrapper.phoneDisconnect(); throw err; })
      }
      else {
        LOG.info("FirmwareHelper: performing bootloader update.");
        return BluenetPromiseWrapper.performDFU(this.handle, this.bootloaderURI)
          .then(() => { this.stoneIsInDFU = false; })
          .then(() => { return delay(1500); })
          .catch((err) => { BluenetPromiseWrapper.phoneDisconnect(); throw err; })
      }
    };
    // we load the DFU into the promise manager with priority so we are not interrupted
    LOG.info("FirmwareHelper: Scheduling bootloader update in promise manager for handle:", this.handle);
    return BlePromiseManager.registerPriority(action, {from: 'DFU: updating Bootloader ' + this.handle}, 300000); // 5 min timeout
  }

  _updateFirmware(stoneIsInSetupMode: boolean) {
    let action = () => {
      if (this.stoneIsInDFU === false) {
        return this._putInDFU(stoneIsInSetupMode)
          .then(() => {
            return BluenetPromiseWrapper.performDFU(this.handle, this.firmwareURI)
          })
          .then(() => { this.stoneIsInDFU = false; })
          .then(() => { return delay(1500); })
          .catch((err) => { BluenetPromiseWrapper.phoneDisconnect(); throw err; })
      }
      else {
        return BluenetPromiseWrapper.performDFU(this.handle, this.firmwareURI)
          .then(() => { this.stoneIsInDFU = false; })
          .then(() => { return delay(1500); })
          .catch((err) => { BluenetPromiseWrapper.phoneDisconnect(); throw err; })
      }
    };
    // we load the DFU into the promise manager with priority so we are not interrupted
    return BlePromiseManager.registerPriority(action, {from: 'DFU: updating firmware ' + this.handle}, 300000); // 5 min timeout
  }

  _reset(stoneIsInSetupMode : boolean) {
    let action = () => {
      return BluenetPromiseWrapper.connect(this.handle)
        .then(() => {
          eventBus.emit("updateDfuProgress", 0.25);
          LOG.info("FirmwareHelper: DFU progress: Reconnected.");
          if (stoneIsInSetupMode) {
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
          this.dfuSuccessful = true;
          eventBus.emit("updateDfuProgress", 0.50);
        })
        .then(() => { return delay(1000, () => { eventBus.emit("updateDfuProgress", 0.6); }); })
        .then(() => { return delay(1000, () => { eventBus.emit("updateDfuProgress", 0.7); }); })
        .then(() => { return delay(1000, () => { eventBus.emit("updateDfuProgress", 0.8); }); })
        .then(() => { return delay(1000, () => { eventBus.emit("updateDfuProgress", 0.9); }); })
        .then(() => { return delay(1000, () => { eventBus.emit("updateDfuProgress", 1.0); }); })
        .then(() => {
          LOG.info("FirmwareHelper: DFU progress: Reset complete.");
        })
    };
    // we load the DFU into the promise manager with priority so we are not interrupted
    return BlePromiseManager.registerPriority(action, {from: 'DFU: performing reset ' + this.handle}, 60000); // 1 min timeout
  }

  _setup(stoneIsInSetupMode : boolean) {
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

const delay = function(ms, performAfterDelay = null) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (performAfterDelay !== null && typeof performAfterDelay === 'function') {
        performAfterDelay()
      }
      resolve();
    }, ms);
  })
};