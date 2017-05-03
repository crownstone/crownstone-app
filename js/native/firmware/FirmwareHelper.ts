import { Alert } from 'react-native';

import { BlePromiseManager }     from '../../logic/BlePromiseManager'
import { BluenetPromiseWrapper}  from '../libInterface/BluenetPromise';
import { NativeBus }             from '../libInterface/NativeBus';
import { LOG }                   from '../../logging/Log'
import { eventBus }              from '../../util/EventBus'
import { Util }                  from '../../util/Util'
import {SetupStateHandler} from "../setup/SetupStateHandler";
import {Bluenet} from "../libInterface/Bluenet";


interface dfuData {
  handle: string,
  sphereId: string,
  firmwareURI: string,
  bootloaderURI: string,
  stoneFirmwareVersion: string,
  stoneBootloaderVersion: string
  newFirmwareDetails: any,
  newBootloaderDetails: any
}


const bootloaderUpdate = "PERFORM_UPDATE_BOOTLOADER";
const firmwareUpdate = "PERFORM_UPDATE_FIRMWARE";
const setupAfterUpdate = "PERFORM_FACTORY_RESET";


export class FirmwareHelper {
  handle : any;

  // things to be filled out during setup process
  fullReset : boolean = false;
  sphereId : string;
  firmwareURI : string;
  bootloaderURI : string;
  stoneFirmwareVersion : string;
  stoneBootloaderVersion : string;
  newFirmwareDetails : any;
  newBootloaderDetails : any;

  eventSubscription : any = null;

  stoneIsInDFU : boolean = false;

  phases : string[];

  constructor(dfuData : dfuData) {
    this.handle = dfuData.handle;
    this.sphereId = dfuData.sphereId;
    this.firmwareURI = dfuData.firmwareURI;
    this.bootloaderURI = dfuData.bootloaderURI;
    this.stoneFirmwareVersion = dfuData.stoneFirmwareVersion;
    this.stoneBootloaderVersion = dfuData.stoneBootloaderVersion;
    this.newFirmwareDetails = dfuData.newFirmwareDetails;
    this.newBootloaderDetails = dfuData.newBootloaderDetails;
  }

  getAmountOfPhases() {
    this.phases = [];
    LOG.info("FirmwareHelper: Getting Phases...");
    if (Util.versions.isHigher(this.newBootloaderDetails.version, this.stoneBootloaderVersion) || true) {
      // UPDATE BOOTLOADER
      LOG.info("FirmwareHelper: Phase: Require Bootloader.");
      this.phases.push(bootloaderUpdate);
    }

    if (Util.versions.isHigher(this.newFirmwareDetails.version, this.stoneFirmwareVersion) || true) {
      // UPDATE firmware
      LOG.info("FirmwareHelper: Phase: Require Firmware.");
      this.phases.push(firmwareUpdate);
    }

    if (true || Util.versions.isLower(this.stoneBootloaderVersion, this.newBootloaderDetails.minimumCompatibleVersion) ||
        Util.versions.isLower(this.stoneFirmwareVersion,   this.newFirmwareDetails.minimumCompatibleVersion)) {
      // PERFORM SETUP AFTERWARDS
      LOG.info("FirmwareHelper: Phase: Require Setup Afterwards.");
      this.phases.push(setupAfterUpdate);
    }

    return this.phases.length;
  }

  putInDFU() {
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
        .then(() => {
          setTimeout(() => { resolve(); }, 3000 )
        })
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
          .then(() => {
            setTimeout(() => { resolve(this.stoneBootloaderVersion); }, 1000 );
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

  performPhase(phaseNumber, progressCallback, stoneIsInSetupMode = false) {
    if (this.phases.length < phaseNumber - 1) {
      return new Promise((resolve, reject) => {
        reject("This phase does not exist in the queue" + JSON.stringify(this.phases));
      })
    }

    this.eventSubscription = NativeBus.on(NativeBus.topics.dfuProgress, (data) => {
      LOG.verbose("FirmwareHelper: DFU event:", data);
      progressCallback(data.progress*0.01);
    });

    switch (this.phases[phaseNumber]) {
      case bootloaderUpdate:
        return this._updateBootloader(stoneIsInSetupMode);
      case firmwareUpdate:
        return this._updateFirmware(stoneIsInSetupMode);
      case setupAfterUpdate:
        return this._resetAndSetup(stoneIsInSetupMode);
      default:
        break;
    }
  }

  finish() {

  }

  _updateBootloader(stoneIsInSetupMode: boolean) {
    let action = () => {
      if (this.stoneIsInDFU === false) {
        return this._putInDFU(stoneIsInSetupMode)
          .then(() => {
            return BluenetPromiseWrapper.performDFU(this.handle, this.bootloaderURI).then(() => { this.stoneIsInDFU = false; });
          })
      }
      else {
        return BluenetPromiseWrapper.performDFU(this.handle, this.bootloaderURI).then(() => { this.stoneIsInDFU = false; });
      }
    };
    // we load the DFU into the promise manager with priority so we are not interrupted
    return BlePromiseManager.registerPriority(action, {from: 'DFU: updating Bootloader ' + this.handle}, 300000); // 5 min timeout
  }

  _updateFirmware(stoneIsInSetupMode: boolean) {
    let action = () => {
      if (this.stoneIsInDFU === false) {
        return this._putInDFU(stoneIsInSetupMode)
          .then(() => {
            return BluenetPromiseWrapper.performDFU(this.handle, this.firmwareURI).then(() => { this.stoneIsInDFU = false; });
          })
      }
      else {
        return BluenetPromiseWrapper.performDFU(this.handle, this.firmwareURI).then(() => { this.stoneIsInDFU = false; });
      }
    };
    // we load the DFU into the promise manager with priority so we are not interrupted
    return BlePromiseManager.registerPriority(action, {from: 'DFU: updating firmware ' + this.handle}, 300000); // 5 min timeout
  }



  _resetAndSetup(stoneIsInSetupMode : boolean) {
    let action = () => {
      return BluenetPromiseWrapper.connect(this.handle)
        .then(() => {
          LOG.info("FirmwareHelper: DFU progress: Reconnected.");
          if (stoneIsInSetupMode) {
            return BluenetPromiseWrapper.setupFactoryReset();
          }
          else {
            return BluenetPromiseWrapper.commandFactoryReset();
          }
        })
        .then(() => {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              resolve()
            }, 2000);
          })
        })
        .then(() => {
          LOG.info("FirmwareHelper: DFU progress: FactoryReset successful.");
          return SetupStateHandler.setupStone(this.handle, this.sphereId);
        })
        .then(() => {
          LOG.info("FirmwareHelper: DFU progress: Setup complete.");
        })
    };
    // we load the DFU into the promise manager with priority so we are not interrupted
    return BlePromiseManager.registerPriority(action, {from: 'DFU: performing setup ' + this.handle}, 120000); // 2 min timeout
  }
}