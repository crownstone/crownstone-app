import { Alert } from 'react-native';

import { BlePromiseManager }     from '../../logic/BlePromiseManager'
import { BluenetPromiseWrapper}  from '../libInterface/BluenetPromise';
import { NativeBus }             from '../libInterface/NativeBus';
import { LOG }                   from '../../logging/Log'
import { eventBus }              from '../../util/EventBus'
import { Util }                  from '../../util/Util'
import {SetupStateHandler} from "../setup/SetupStateHandler";

export class FirmwareHelper {
  handle : any;

  // things to be filled out during setup process
  firmwareVersion : string;
  bootloaderVersion : string;
  fullReset : boolean = false;
  sphereId : string;
  firmwareURI : string;
  bootloaderURI : string;

  constructor(handle, sphereId, firmwareURI, bootloaderURI) {
    this.handle = handle;
    this.sphereId = sphereId;
    this.firmwareURI = firmwareURI;
    this.bootloaderURI = bootloaderURI;
  }

  putInDFU() {
    let setupPromise = () => {
      let stoneBootloaderVersion = null;

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
            return BluenetPromiseWrapper.disconnect()
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
    return BlePromiseManager.registerPriority(setupPromise, {from: 'Setup: determining bootloader version: ' + this.handle});
  }

  getBootloaderVersion() {
    let setupPromise = () => {
      let stoneBootloaderVersion = null;

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
            stoneBootloaderVersion = bootloaderVersion;
            return BluenetPromiseWrapper.phoneDisconnect()
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

  update() {
    let setupPromise = () => {
      let stoneBootloaderVersion = null;

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
            return BluenetPromiseWrapper.disconnect()
          })
          .then(() => {
            LOG.info("FirmwareHelper: DFU progress: Disconnected.");
            return BluenetPromiseWrapper.connect(this.handle);
          })
          .then(() => {
            LOG.info("FirmwareHelper: DFU progress: Reconnected.");
            // Since we are in DFU, getFirmwareVersion actually gets the bootloader version.
            return BluenetPromiseWrapper.getFirmwareVersion();
          })
          .then((bootloaderVersion) => {
            LOG.info("FirmwareHelper: DFU progress: Obtained bootloader version:", bootloaderVersion);
            stoneBootloaderVersion = bootloaderVersion;
            return BluenetPromiseWrapper.disconnect()
          })
          .then(() => {
            LOG.info("FirmwareHelper: DFU progress: Disconnected.");
            if (stoneBootloaderVersion != this.bootloaderVersion) {
              LOG.info("FirmwareHelper: DFU progress: Starting updating bootloader.");
              return this.updateBootloader(this.bootloaderURI)
                .catch((err) => {
                  LOG.warn("FirmwareHelper: Failed to upload bootloader... Retrying...", err);
                  return this.updateBootloader(this.bootloaderURI)
                })
            }
          })
          .then(() => {
            LOG.info("FirmwareHelper: DFU progress: Bootloader updated successfully and placed in DFU.");
            return BluenetPromiseWrapper.performDFU(this.handle, this.firmwareURI)
              .catch((err) => {
                LOG.warn("FirmwareHelper: Failed to upload firmware... Retrying...", err);
                return BluenetPromiseWrapper.performDFU(this.handle, this.firmwareURI)
              })
          })
          .then(() => {
            LOG.info("FirmwareHelper: DFU progress: Firmware updated successfully.");
            if (this.fullReset === true) {
              LOG.info("FirmwareHelper: DFU progress: Full Reset Required.");
              return this.reset()
            }
          })
          .then(() => {
            LOG.info("FirmwareHelper: DFU progress: Finished.");
            resolve();
          })
          .catch((err) => {
            LOG.error("FirmwareHelper: Error during DFU.", err);
            reject(err);
          })
      })
    };

    // we load the DFU into the promise manager with priority so we are not interrupted
    return BlePromiseManager.registerPriority(setupPromise, {from: 'Setup: claiming stone: ' + this.handle});
  }

  updateBootloader(bootloaderURI) {
    return BluenetPromiseWrapper.performDFU(this.handle, bootloaderURI)
      .then(() => {
        LOG.info("FirmwareHelper: DFU progress: Bootloader updated successfully.");
        return BluenetPromiseWrapper.connect(this.handle);
      })
      .then(() => {
        LOG.info("FirmwareHelper: DFU progress: Reconnected.");
        return BluenetPromiseWrapper.putInDFU();
      })
  }

  reset() {
    return BluenetPromiseWrapper.connect(this.handle)
      .then(() => {
        LOG.info("FirmwareHelper: DFU progress: Reconnected.");
        return BluenetPromiseWrapper.setupFactoryReset();
      })
      .then(() => {
        LOG.info("FirmwareHelper: DFU progress: FactoryReset successful.");
        return SetupStateHandler.setupStone(this.handle, this.sphereId);
      })
      .then(() => {
        LOG.info("FirmwareHelper: DFU progress: Setup complete.");
      })
  }
}