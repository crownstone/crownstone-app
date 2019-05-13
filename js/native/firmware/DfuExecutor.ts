import { xUtil } from "../../util/StandAloneUtil";
import { core } from "../../core";
import { LOG, LOGd } from "../../logging/Log";
import { BleUtil } from "../../util/BleUtil";
import { DfuHelper } from "./DfuHelper";
import { StoneUtil } from "../../util/StoneUtil";
import { FileUtil } from "../../util/FileUtil";
import { DfuUtil } from "../../util/DfuUtil";
import { DfuStateHandler } from "./DfuStateHandler";


export const DfuExecutionInformation = {
  GETTING_INFORMATION:          "GETTING_INFORMATION",
  OBTAINED_INFORMATION_CLOUD:   "OBTAINED_INFORMATION_CLOUD",
  OBTAINED_VERSIONS_FROM_STONE: "OBTAINED_VERSIONS_FROM_STONE",
  DOWNLOAD_STARTED:             "DOWNLOAD_STARTED",
  DOWNLOAD_SUCCESS:             "DOWNLOAD_SUCCESS",
  DOWNLOAD_FAILED:              "DOWNLOAD_FAILED",
  UPDATE_PUT_IN_DFU_MODE:       "UPDATE_PUT_IN_DFU_MODE",
  UPDATE_START:                 "UPDATE_START",
  UPDATE_PROGRESS:              "UPDATE_PROGRESS",
  UPDATE_SUCCESS:               "UPDATE_SUCCESS",
  UPDATE_FAILED:                "UPDATE_FAILED",
  SETUP_START:                  "SETUP_START",
  SETUP_PROGRESS:               "SETUP_PROGRESS",
  SETUP_SUCCESS:                "SETUP_SUCCESS",
  SETUP_FAILED:                 "SETUP_FAILED",
}

export const DfuPhases = {
  PREPARATION: "PREPERATION",
  BOOTLOADER:  "BOOTLOADER",
  FIRMWARE:    "FIRMWARE",
  SETUP:       "SETUP",
}

const DFU_CANCELLED = "DFU_CANCELLED";

export class DfuExecutor {
  processSubscriptions = [];
  stopScanning = null;
  stopDFU = null;
  dfuHelper   : DfuHelper;

  updateCallback;
  userConfig;
  stone;
  stoneId;
  sphereId;

  currentBootloaderVersion = null;
  currentFirmwareVersion = null;
  hardwareVersion = null;
  
  sessionUUID;
  shownError = false;

  amountOfBootloaders = 1;
  amountOfFirmwares   = 1;
  currentStep = 0;

  constructor(sphereId, stoneId, updateCallback) {
    this.updateCallback = updateCallback;
    this.stoneId = stoneId;
    this.sphereId = sphereId;
    
    this.sessionUUID = xUtil.getUUID();

    let state = core.store.getState();
    this.stone = StoneUtil.getStoneObject(this.sphereId, this.stoneId);
    this.hardwareVersion = this.stone.config.hardwareVersion;
    this.userConfig = state.user.config;
  }

  abort() {
    this.stopDFU = true;
    this.dfuHelper.abortedDFU = true;
    this._searchCleanup();
  }

  _setProgress(phase, step, progress, info) {
    this.updateCallback({
      steps: 2 + this.amountOfBootloaders + this.amountOfFirmwares,
      amountOfBootloaders: this.amountOfBootloaders,
      amountOfFirmwares:   this.amountOfFirmwares,
      phase: phase,
      currentStep: step,
      progress: progress,
      info: info}
    );
  }

  _setError(err, phase, info) {
    if (this.stopDFU)    { throw DFU_CANCELLED; }
    if (this.shownError) { throw err; }

    this._setProgress(phase, this.currentStep, 0, info);
    this.shownError = true;
    throw err;
  }

  _getUpdateCallback(phase, step, setup = false) {
    return (progress) => {
      this._setProgress(phase, step, progress * 0.5, setup ? DfuExecutionInformation.SETUP_PROGRESS : DfuExecutionInformation.UPDATE_PROGRESS )
    }
  }

  startDfu() {
    this.dfuHelper = new DfuHelper(this.sphereId, this.stoneId);
    DfuStateHandler._dfuInProgress = true;


    let newestFirmware   = null;
    let newestBootloader = null;

    let cloudPromises = [];
    let blePromises   = [];

    this._setProgress(DfuPhases.PREPARATION, this.currentStep, 0, DfuExecutionInformation.GETTING_INFORMATION);

    cloudPromises.push(
      DfuUtil.getBootloaderInformation(this.userConfig.bootloaderVersionsAvailable[this.hardwareVersion], this.hardwareVersion)
        .then((bootloader) => { newestBootloader = bootloader; })
    );

    cloudPromises.push(
      DfuUtil.getFirmwareInformation(this.userConfig.firmwareVersionsAvailable[this.hardwareVersion], this.hardwareVersion)
        .then((firmware) => { newestFirmware = firmware; })
    );


    // get FW/BL from Crownstone. If BL is not available in application mode, default to 1.4.0
    // the new FWs and BLs will be v3 and higher.
    blePromises.push(StoneUtil.checkBootloaderVersion(this.sphereId, this.stoneId)
      .then((bootloaderVersion) => {
        if (!bootloaderVersion) {
          this.currentBootloaderVersion = "1.4.0";
        }
        else {
          this.currentBootloaderVersion = bootloaderVersion;
        }
        core.store.dispatch({
          type: "UPDATE_STONE_CONFIG",
          stoneId: this.stoneId,
          sphereId: this.sphereId,
          data: {
            bootloaderVersion: bootloaderVersion,
          }
        });
      })
    );

    blePromises.push(StoneUtil.checkFirmwareVersion(this.sphereId, this.stoneId)
      .then((firmwareVersion) => {
        this.currentFirmwareVersion = firmwareVersion;
        core.store.dispatch({
          type: "UPDATE_STONE_CONFIG",
          stoneId: this.stoneId,
          sphereId: this.sphereId,
          data: {
            firmwareVersion: firmwareVersion,
          }
        });
      })
    );


    Promise.all(cloudPromises)
      .then(() => {
        if (this.stopDFU) { throw DFU_CANCELLED; }
        this._setProgress(DfuPhases.PREPARATION,this.currentStep,  0.5, DfuExecutionInformation.OBTAINED_INFORMATION_CLOUD);
        return Promise.all(blePromises);
      })
      .catch((err) => { this._setError(err, DfuPhases.PREPARATION, DfuExecutionInformation.DOWNLOAD_FAILED); })
      .then(() => {
        if (this.stopDFU) { throw DFU_CANCELLED; }

        this._setProgress(DfuPhases.PREPARATION, this.currentStep++, 1, DfuExecutionInformation.OBTAINED_VERSIONS_FROM_STONE);
        return this.handleBootloader(newestBootloader);
      })
      .catch((err) => { this._setError(err, DfuPhases.BOOTLOADER, DfuExecutionInformation.UPDATE_FAILED); })
      .then(() => {
        return this.handleFirmware(newestFirmware);
      })
      .catch((err) => { this._setError(err, DfuPhases.FIRMWARE, DfuExecutionInformation.UPDATE_FAILED); })
      .then(() : Promise<crownstoneModes> => {
        this._setProgress(DfuPhases.SETUP, this.currentStep, 0, DfuExecutionInformation.SETUP_START);
        return this._searchForCrownstone();
      })
      .then((crownstoneMode : crownstoneModes) => {
        return this.dfuHelper.setup(crownstoneMode, this._getUpdateCallback(DfuPhases.SETUP, this.currentStep, true))
      })
      .catch((err) => { this._setError(err, DfuPhases.SETUP, DfuExecutionInformation.SETUP_FAILED); })
      .then(() => {
        this._setProgress(DfuPhases.SETUP, this.currentStep++, 1, DfuExecutionInformation.SETUP_SUCCESS);
        DfuStateHandler._dfuInProgress = false;
      })
      .catch((err) => {
        DfuStateHandler._dfuInProgress = false;
        throw err;
      })
  }

  handleBootloader(bootloaderCandidate) {
    if (bootloaderCandidate.dependsOnBootloaderVersion && xUtil.versions.isHigherOrEqual(this.currentBootloaderVersion, bootloaderCandidate.dependsOnBootloaderVersion)) {
      // we can do the DFU now.
      let downloadedBootloaderPath = null;;
      this._setProgress(DfuPhases.BOOTLOADER, this.currentStep, 0, DfuExecutionInformation.DOWNLOAD_STARTED);
      return DfuUtil.downloadBootloader(bootloaderCandidate)
        .then((downloadPath) => {
          this._setProgress(DfuPhases.BOOTLOADER, this.currentStep, 0.1, DfuExecutionInformation.DOWNLOAD_SUCCESS);

          downloadedBootloaderPath = downloadPath;
          return this._searchForCrownstone();
        })
        .then((crownstoneMode) => {
          this._setProgress(DfuPhases.BOOTLOADER, this.currentStep, 0.3, DfuExecutionInformation.UPDATE_START);
          return this.dfuHelper.putInDFU(crownstoneMode);
        })
        .then(() => {
          return this._searchForCrownstone();
        })
        .then((crownstoneMode) => {
          this._setProgress(DfuPhases.BOOTLOADER, this.currentStep, 0.5, DfuExecutionInformation.UPDATE_START);
          return this.dfuHelper.updateBootloader(crownstoneMode, downloadedBootloaderPath, this._getUpdateCallback(DfuPhases.BOOTLOADER, this.currentStep));
        })
        .then(() => {
          this.currentBootloaderVersion = bootloaderCandidate.version;
          FileUtil.safeDeleteFile(downloadedBootloaderPath).catch(() => {});
          core.store.dispatch({
            type: "UPDATE_STONE_CONFIG",
            stoneId: this.stoneId,
            sphereId: this.sphereId,
            data: {
              bootloaderVersion: bootloaderCandidate.version,
            }
          });
          this._setProgress(DfuPhases.BOOTLOADER, this.currentStep++, 1, DfuExecutionInformation.UPDATE_SUCCESS);
        })
    }
    else {
      this.amountOfBootloaders += 1;
      // we need to download the old BL first.
      return DfuUtil.getBootloaderInformation(bootloaderCandidate.dependsOnBootloaderVersion, this.hardwareVersion)
        .then(( previousBootloader) => {
          return this.handleBootloader(previousBootloader)
        })
        .then(() => {
          return this.handleBootloader(bootloaderCandidate);
        })
    }
  }

  handleFirmware(firmwareCandidate) {
    if (firmwareCandidate.dependsOnFirmwareVersion && xUtil.versions.isHigherOrEqual(this.currentFirmwareVersion, firmwareCandidate.dependsOnFirmwareVersion)) {
      // we can do the DFU now.
      let downloadedFirmwarePath = null;;

      this._setProgress(DfuPhases.FIRMWARE, this.currentStep, 0, DfuExecutionInformation.DOWNLOAD_STARTED);
      return DfuUtil.downloadFirmware(firmwareCandidate)
        .then((downloadPath) => {
          this._setProgress(DfuPhases.FIRMWARE, this.currentStep, 0.1, DfuExecutionInformation.DOWNLOAD_SUCCESS);
          downloadedFirmwarePath = downloadPath;
          return this._searchForCrownstone();
        })
        .then((crownstoneMode) => {
          this._setProgress(DfuPhases.FIRMWARE, this.currentStep, 0.3, DfuExecutionInformation.UPDATE_START);
          return this.dfuHelper.putInDFU(crownstoneMode);
        })
        .then(() => {
          return this._searchForCrownstone();
        })
        .then((crownstoneMode) => {
          return this.dfuHelper.updateFirmware(crownstoneMode, downloadedFirmwarePath, this._getUpdateCallback(DfuPhases.FIRMWARE, this.currentStep));
        })
        .then(() => {
          this.currentFirmwareVersion = firmwareCandidate.version;
          FileUtil.safeDeleteFile(downloadedFirmwarePath).catch(() => {});
          core.store.dispatch({
            type: "UPDATE_STONE_CONFIG",
            stoneId: this.stoneId,
            sphereId: this.sphereId,
            data: {
              firmwareVersion: firmwareCandidate.version,
            }
          });
          this._setProgress(DfuPhases.FIRMWARE, this.currentStep++, 1, DfuExecutionInformation.UPDATE_SUCCESS);
        })
    }
    else {
      this.amountOfFirmwares += 1;
      // we need to download the old BL first.
      return DfuUtil.getFirmwareInformation(firmwareCandidate.dependsOnFirmwareVersion, this.hardwareVersion)
        .then(( previousFirmware) => {
          return this.handleFirmware(previousFirmware)
        })
        .then(() => {
          return this.handleFirmware(firmwareCandidate);
        })
    }
  }


  _searchForCrownstone() : Promise<crownstoneModes> {
    if (this.stopDFU === true) { throw DFU_CANCELLED; }

    // we need high frequency scanning to get duplicates of the DFU crownstone.
    LOG.info("DfuOverlay: Start HF Scanning for all Crownstones");
    BleUtil.startHighFrequencyScanning(this.sessionUUID, true);
    return new Promise((resolve, reject) => {
      this.stopScanning = reject;

      // this will show the user that he has to move closer to the crownstone or resolve if the user is close enough.
      let rssiResolver = (data, setupMode, dfuMode) => {
        LOGd.info("DfuOverlay: Found match:", data);
        // if ((setupMode && data.rssi < -99) || (data.rssi < -80)) {
        //   core.eventBus.emit("updateDfuStep", STEP_TYPES.SEARCHING_MOVE_CLOSER);
        // }
        
        // no need to HF scan any more
        LOG.info("DfuOverlay: Stop HF Scanning for all Crownstones");
        BleUtil.stopHighFrequencyScanning(this.sessionUUID);
        this.stopScanning = null;

        this._searchCleanup();
        resolve({setupMode, dfuMode});
      };

      this.processSubscriptions.push(core.nativeBus.on(core.nativeBus.topics.advertisement, (advertisement) => {
        if (advertisement.handle === this.stone.config.handle) {
          rssiResolver(advertisement, false, false);
        }
      }));

      this.processSubscriptions.push(core.nativeBus.on(core.nativeBus.topics.setupAdvertisement, (setupAdvertisement) => {
        if (setupAdvertisement.handle === this.stone.config.handle) {
          rssiResolver(setupAdvertisement, true, false);
        }
      }));

      this.processSubscriptions.push(core.nativeBus.on(core.nativeBus.topics.dfuAdvertisement, (dfuAdvertisement) => {
        if (dfuAdvertisement.handle === this.stone.config.handle) {
          rssiResolver(dfuAdvertisement, false, true);
        }
      }))
    });
  }

  _searchCleanup() {
    BleUtil.stopHighFrequencyScanning(this.sessionUUID);
    if (typeof this.stopScanning === 'function') {
      this.stopScanning("User cancelled");
      this.stopScanning = null;
    }
    this.processSubscriptions.forEach((callback) => {callback()});
    this.processSubscriptions = [];
  }
}

