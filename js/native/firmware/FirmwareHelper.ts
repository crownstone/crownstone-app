import { Alert } from 'react-native';

import { BlePromiseManager }     from '../../logic/BlePromiseManager'
import { BluenetPromiseWrapper}  from '../libInterface/BluenetPromise';
import { NativeBus }             from '../libInterface/NativeBus';
import { LOG }                   from '../../logging/Log'
import { eventBus }              from '../../util/EventBus'
import { Util }                  from '../../util/Util'
import {SetupStateHandler} from "../setup/SetupStateHandler";


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
    if (Util.versions.isHigher(this.newBootloaderDetails.version, this.stoneBootloaderVersion)) {
      // UPDATE BOOTLOADER
      this.phases.push(bootloaderUpdate);
    }

    if (Util.versions.isHigher(this.newFirmwareDetails.version, this.stoneFirmwareVersion)) {
      // UPDATE firmware
      this.phases.push(firmwareUpdate);
    }

    if (Util.versions.isLower(this.stoneBootloaderVersion, this.newBootloaderDetails.minimumCompatibleVersion) ||
        Util.versions.isLower(this.stoneFirmwareVersion,   this.newFirmwareDetails.minimumCompatibleVersion)) {
      // PERFORM SETUP AFTERWARDS
      this.phases.push(setupAfterUpdate);
    }

    return this.phases.length;
  }

  putInDFU() {
    let setupPromise = () => {
      return new Promise((resolve, reject) => {
        eventBus.emit("dfuInProgress", {handle: this.handle, progress: 1});
        BluenetPromiseWrapper.connect(this.handle)
          .then(() => {
            LOG.info("FirmwareHelper: DFU progress: Connected.");
            eventBus.emit("dfuInProgress", {handle: this.handle, progress: 2});
            return BluenetPromiseWrapper.putInDFU();
          })
          .then(() => {
            LOG.info("FirmwareHelper: DFU progress: Placed in DFU mode.");
            this.stoneIsInDFU = true;
            return BluenetPromiseWrapper.disconnectCommand();
          })
          .then(() => {
            return new Promise((resolve, reject) => { setTimeout(() => { resolve(); }, 1000 ); })
          })
          .catch((err) => {
            LOG.error("FirmwareHelper: Error during putInDFU.", err);
            reject(err);
          })
      })
    };

    // we load the DFU into the promise manager with priority so we are not interrupted
    return BlePromiseManager.registerPriority(setupPromise, {from: 'DFU: setting in dfu mode: ' + this.handle});
  }

  getBootloaderVersion() {
    let setupPromise = () => {
      return new Promise((resolve, reject) => {
        eventBus.emit("dfuInProgress", {handle: this.handle, progress: 1});
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
            return new Promise((resolve, reject) => { setTimeout(() => { resolve(this.stoneBootloaderVersion); }, 1000 ); })
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

  performPhase(phaseNumber) {
    if (this.phases.length < phaseNumber - 1) {
      return new Promise((resolve, reject) => {
        reject("This phase does not exist in the queue" + JSON.stringify(this.phases));
      })
    }

    switch (this.phases[phaseNumber]) {
      case bootloaderUpdate:
        return this.updateBootloader();
      case firmwareUpdate:
        return this.updateFirmware();
      case setupAfterUpdate:
        return this.reset();
      default:
        break;
    }
  }

  updateBootloader() {
    let action = () => {
      return BluenetPromiseWrapper.performDFU(this.handle, this.bootloaderURI).then(() => { this.stoneIsInDFU = false; });
    };
    // we load the DFU into the promise manager with priority so we are not interrupted
    return BlePromiseManager.registerPriority(action, {from: 'DFU: updating Bootloader ' + this.handle}, 300000); // 5 min timeout
  }

  updateFirmware() {
    let action = () => {
      return BluenetPromiseWrapper.performDFU(this.handle, this.firmwareURI).then(() => { this.stoneIsInDFU = false; });
    };
    // we load the DFU into the promise manager with priority so we are not interrupted
    return BlePromiseManager.registerPriority(action, {from: 'DFU: updating firmware ' + this.handle}, 300000); // 5 min timeout
  }



  reset() {
    let action = () => {
      return BluenetPromiseWrapper.connect(this.handle)
        .then(() => {
          LOG.info("FirmwareHelper: DFU progress: Reconnected.");
          return BluenetPromiseWrapper.setupFactoryReset();
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