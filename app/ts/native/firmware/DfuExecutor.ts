import { xUtil } from "../../util/StandAloneUtil";
import { core } from "../../core";
import { LOG, LOGd, LOGe, LOGi, LOGv } from "../../logging/Log";
import { BleUtil } from "../../util/BleUtil";
import { DfuHelper } from "./DfuHelper";
import { StoneUtil } from "../../util/StoneUtil";
import { FileUtil } from "../../util/FileUtil";
import { DfuUtil } from "../../util/DfuUtil";
import { DfuStateHandler } from "./DfuStateHandler";
import { ALWAYS_DFU_UPDATE_BOOTLOADER, ALWAYS_DFU_UPDATE_FIRMWARE } from "../../ExternalConfig";
import { Scheduler } from "../../logic/Scheduler";
import { Animated } from "react-native";
import add = Animated.add;
import { SessionManager } from "../../logic/constellation/SessionManager";
import { CommandAPI } from "../../logic/constellation/Commander";
import { claimBluetooth } from "../../logic/constellation/Tellers";


export const DfuExecutionInformation = {
  GETTING_INFORMATION:          "GETTING_INFORMATION",
  CROWNSTONE_FOUND:             "CROWNSTONE_FOUND",
  OBTAINED_INFORMATION_CLOUD:   "OBTAINED_INFORMATION_CLOUD",
  OBTAINED_VERSIONS_FROM_STONE: "OBTAINED_VERSIONS_FROM_STONE",
  VERSION_OBTAINING_FAILED:     "VERSION_OBTAINING_FAILED",
  OBTAINED_STEPS:               "OBTAINED_STEPS",
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
  PREPARATION:                 "PREPERATION",
  GET_INFORMATION_FROM_CLOUD:  "GET_INFORMATION_FROM_CLOUD",
  SEACHING_FOR_CROWNSTONE:     "SEACHING_FOR_CROWNSTONE",
  RESERVING_BLE_CONTROLLER:    "RESERVING_BLE_CONTROLLER",
  GETTING_VERSION_INFORMATION: "GETTING_VERSION_INFORMATION",
  GETTING_FIRMWARE_VERSION:    "GETTING_FIRMWARE_VERSION",
  GETTING_BOOTLOADER_VERSION:  "GETTING_BOOTLOADER_VERSION",
  PREPARING_BOOTLOADER_STEPS:  "PREPARING_BOOTLOADER_STEPS",
  PREPARING_FIRMWARE_STEPS:    "PREPARING_FIRMWARE_STEPS",
  PUT_IN_DFU_MODE:             "PUT_IN_DFU_MODE",
  BOOTLOADER:  "BOOTLOADER",
  FIRMWARE:    "FIRMWARE",
  SETUP:       "SETUP",
}

const DFU_CANCELLED = "DFU_CANCELLED";

const FORCE_MINIMAL_BOOTLOADER_LAYERS = 1;
const FORCE_MINIMAL_FIRMWARE_LAYERS = 1;

export class DfuExecutor {
  processSubscriptions = [];
  stopScanning = null;
  stopDFU = null;
  dfuHelper : DfuHelper;

  updateCallback : (dfuStatusUpdate) => void
  userConfig;
  stone;
  stoneId;
  handle;
  sphereId;
  sessionUUID;

  // progress state
  currentBootloaderVersion : string;
  currentFirmwareVersion : string;
  hardwareVersion : string;
  shownError : boolean;
  amountOfBootloaders : number;
  amountOfFirmwares   : number;
  currentStep : number
  errorInformation : string

  runningDfuProcess = false;

  claimedCommander : CommandAPI = null;

  constructor(sphereId, stoneId, updateCallback : (dfuStatusUpdate) => void) {
    this.updateCallback = updateCallback;
    this.stoneId = stoneId;
    this.sphereId = sphereId;

    this.sessionUUID = xUtil.getUUID();

    let state = core.store.getState();
    this.stone = StoneUtil.getStoneObject(this.sphereId, this.stoneId);
    this.handle = this.stone.config.handle;
    this.hardwareVersion = this.stone.config.hardwareVersion;
    this.userConfig = state.user;

    this.dfuHelper = new DfuHelper(this.sphereId, this.stoneId);

    // initialize the class variabled
    this._resetState();
  }


  /**
   * Stop DFU and clean up.
   */
  abort() {
    LOGi.dfu("Executor: Abort has been called.");
    this.stopDFU = true;
    this.dfuHelper.abortedDFU = true;
    this._searchCleanup();
    this.runningDfuProcess = false;
  }


  /**
   * Notify the controlling component about the progress
   * @param phase
   * @param step
   * @param progress
   * @param info
   * @private
   */
  _setProgress(phase, step, progress, info) {
    LOGd.dfu("Executor: progressUpdate", phase, step, progress, info);
    this.updateCallback({
      totalSteps: 1 + this.amountOfBootloaders + this.amountOfFirmwares, // the +1 is the preparation and the setup, but we only start counting after setup.
      amountOfBootloaders: this.amountOfBootloaders,
      amountOfFirmwares:   this.amountOfFirmwares,
      phase: phase,
      currentStep: step,
      progress: progress,
      info: info
    });
  }


  /**
   * Handle an error thrown during the process.
   * @param err
   * @param phase
   * @param info
   * @private
   */
  _handleError(err, phase, info) {
    LOGe.dfu("Executor: Error", err, phase, info);

    if (this.stopDFU)    { throw DFU_CANCELLED; }
    if (this.shownError) { throw err; }

    this._setProgress(phase, this.currentStep, 0, info);
    this.errorInformation = info;
    this.shownError = true;
    throw err;
  }


  /**
   * Create a wrapped callback to propagage the DFU events to the _setProgress
   * @param phase
   * @param step
   * @param setup
   * @private
   */
  _getUpdateCallback(phase, step, setup = false) {
    return (progress) => {
      this._setProgress(phase, step, 0.3 + progress * 0.7, setup ? DfuExecutionInformation.SETUP_PROGRESS : DfuExecutionInformation.UPDATE_PROGRESS )
    }
  }


  /**
   * Initialize the state variables for a clean start.
   * @private
   */
  _resetState() {
    this.currentBootloaderVersion = null;
    this.currentFirmwareVersion = null;
    this.shownError = false;
    this.errorInformation = null;
    this.amountOfBootloaders = 1;
    this.amountOfFirmwares   = 1;
    this.currentStep = 0;
  }


  /**
   * Start the DFU process!
   */
  async startDfu() {
    if (this.runningDfuProcess) { return; }
    this.runningDfuProcess = true;

    LOGi.dfu("Executor: Dfu process started.",      this.stoneId);
    LOGi.dfu("Executor: Stone hw version:",         this.hardwareVersion);
    LOGi.dfu("Executor: Stone allowed Bootloader:", this.userConfig.bootloaderVersionsAvailable[this.hardwareVersion.substr(0,11)]);
    LOGi.dfu("Executor: Stone allowed Firmware:",   this.userConfig.firmwareVersionsAvailable[this.hardwareVersion.substr(0,11)]);

    DfuStateHandler._dfuInProgress = true;

    // reset the counters and indices.
    this._resetState();

    let newestFirmware   = null;
    let newestBootloader = null;

    let cloudPromises = [];

    // we start blocking the BLE. We don't have to await this here, we'll await it below.
    let blockToFinish : Promise<void> = SessionManager.intiateBlock().then(() => { console.log("FINISHED BLOCK")})

    // download information on the latest firmware and bootloader available to us.
    this._setProgress(DfuPhases.GET_INFORMATION_FROM_CLOUD, this.currentStep, 0, DfuExecutionInformation.GETTING_INFORMATION);
    cloudPromises.push(
      DfuUtil.getBootloaderInformation(this.userConfig.bootloaderVersionsAvailable[this.hardwareVersion.substr(0,11)], this.hardwareVersion)
        .then((bootloader) => {
          LOGi.dfu("Executor: Cloud bootloader Data received.", bootloader);
          newestBootloader = bootloader;
        })
    );
    cloudPromises.push(
      DfuUtil.getFirmwareInformation(this.userConfig.firmwareVersionsAvailable[this.hardwareVersion.substr(0,11)], this.hardwareVersion)
        .then((firmware) => {
          LOGi.dfu("Executor: Cloud firmware Data received.", firmware);
          newestFirmware = firmware;
        })
    );


    try {
      // Waiting for get information from the cloud to do the DFU
      await Promise.all(cloudPromises).catch((err) => { this._handleError(err, DfuPhases.PREPARATION, DfuExecutionInformation.DOWNLOAD_FAILED); })
      if (this.stopDFU) { throw DFU_CANCELLED; }
      LOGi.dfu("Executor: cloud preperation step 1 finished.");

      // check the version of the firmware and bootload from the Crownstone via BLE
      this._setProgress(DfuPhases.SEACHING_FOR_CROWNSTONE, this.currentStep, 0.1, DfuExecutionInformation.OBTAINED_INFORMATION_CLOUD);
      try {
        let crownstoneMode = await this._searchForCrownstone();

        // IMPORTANT: we now need to block bluetooth and claimBLE for our session.
        this._setProgress(DfuPhases.RESERVING_BLE_CONTROLLER, this.currentStep, 0.1, DfuExecutionInformation.CROWNSTONE_FOUND);
        await blockToFinish;

        // now the block is set, claim bluetooth for this commander.
        this.claimedCommander = await claimBluetooth(this.handle)

        this._setProgress(DfuPhases.GETTING_FIRMWARE_VERSION, this.currentStep, 0.2, DfuExecutionInformation.CROWNSTONE_FOUND);
        await this._prepareAndGetVersions(crownstoneMode);
      }
      catch (err) {
        this._handleError(err, DfuPhases.GETTING_VERSION_INFORMATION, DfuExecutionInformation.VERSION_OBTAINING_FAILED);
      }


      try {
        // Assuming we could not get the bootloader version before, first put it in dfu.
        if (this.currentBootloaderVersion === null) {
          LOGi.dfu("Executor: getting the bootloader from DFU....");
          this._setProgress(DfuPhases.PUT_IN_DFU_MODE, this.currentStep, 0.7, DfuExecutionInformation.OBTAINED_VERSIONS_FROM_STONE);
          await this._getBootloaderVersionFromDFU();
        }
      }
      catch (err) {
        this._handleError(err, DfuPhases.PREPARATION, DfuExecutionInformation.VERSION_OBTAINING_FAILED);
      }


      try {
        if (this.stopDFU) {
          throw DFU_CANCELLED;
        }
        LOGi.dfu("Executor: ble preperation finished.");
        this._setProgress(DfuPhases.PREPARING_BOOTLOADER_STEPS, this.currentStep, 0.8, DfuExecutionInformation.OBTAINED_VERSIONS_FROM_STONE);
        await this._checkBootloaderOperations(newestBootloader);

        if (this.stopDFU) {
          throw DFU_CANCELLED;
        }
        LOGi.dfu("Executor: cloud bootloader step count finished.");
        this._setProgress(DfuPhases.PREPARING_FIRMWARE_STEPS, this.currentStep, 0.9, DfuExecutionInformation.OBTAINED_VERSIONS_FROM_STONE);
        await this._checkFirmwareOperations(newestFirmware);
      }
      catch (err) {
        this._handleError(err, DfuPhases.PREPARATION, DfuExecutionInformation.DOWNLOAD_FAILED);
      }

      // The DFU phase starts here.
      if (this.stopDFU) { throw DFU_CANCELLED; }
      LOGi.dfu("Executor: cloud firmware step count finished.");

      // debugging overrides
        if (this._debugExtraBootloader()) { this.amountOfBootloaders = FORCE_MINIMAL_BOOTLOADER_LAYERS; }
        if (this._debugExtraFirmware())   { this.amountOfFirmwares   = FORCE_MINIMAL_FIRMWARE_LAYERS; }
      // </ debugging overrides

      this._setProgress(DfuPhases.PUT_IN_DFU_MODE, this.currentStep++, 1, DfuExecutionInformation.OBTAINED_VERSIONS_FROM_STONE);
      await this._handleBootloader(newestBootloader).catch((err) => { this._handleError(err, DfuPhases.BOOTLOADER, DfuExecutionInformation.UPDATE_FAILED); })

      if (this.stopDFU) { throw DFU_CANCELLED; }
      LOGi.dfu("Executor: bootloader has been finished.");
      await this._handleFirmware(newestFirmware).catch((err) => { this._handleError(err, DfuPhases.FIRMWARE, DfuExecutionInformation.UPDATE_FAILED); })


      // Setup phase starts here
      try {
        LOGi.dfu("Executor: firmware has been finished.");
        this._setProgress(DfuPhases.SETUP, this.currentStep, 0, DfuExecutionInformation.SETUP_START);
        let crownstoneMode = await this._searchForCrownstone();

        LOGi.dfu("Executor: Starting final setup...");
        await this.dfuHelper.setup(crownstoneMode, this._getUpdateCallback(DfuPhases.SETUP, this.currentStep, true))
      }
      catch (err) {
        this._handleError(err, DfuPhases.SETUP, DfuExecutionInformation.SETUP_FAILED);
      }

      LOGi.dfu("Executor: setup has been finished.");
      this._setProgress(DfuPhases.SETUP, this.currentStep++, 1, DfuExecutionInformation.SETUP_SUCCESS);
      DfuStateHandler._dfuInProgress = false;
      this.runningDfuProcess = false;
      LOGi.dfu("Executor: DFU finshed.");
    }
    catch (err) {
      DfuStateHandler._dfuInProgress = false;
      this.runningDfuProcess = false;
      LOGi.dfu("Executor: DFU failed.");
      if (this.claimedCommander) {
        await this.claimedCommander.bootloaderToNormalMode().catch(() => {
          throw err;
        });
      }
      throw err;
    }
    finally {
      if (this.claimedCommander) {
        await this.claimedCommander.end();
        this.claimedCommander = null;
      }

      SessionManager.releaseBlock();
    }

  }


  async _prepareAndGetVersions(crownstoneMode) {
    if (crownstoneMode.dfuMode === true) {
      await this._getVersionsInBootloaderMode()
      await this.claimedCommander.bootloaderToNormalMode()
      let crownstoneMode = await this._searchForCrownstone()
      if (crownstoneMode.dfuMode === true) {
        // we conclude the firmware is not functional.
        this.currentFirmwareVersion = null;
        return
      }
    }
    return this._getVersions();
  }


  async _getVersions() {
    // get Bootloader from Crownstone.
    this._setProgress(DfuPhases.GETTING_BOOTLOADER_VERSION, this.currentStep, 0.3, DfuExecutionInformation.OBTAINED_VERSIONS_FROM_STONE);
    let bootloaderVersion = await this.claimedCommander.getBootloaderVersion();
    this.__storeBootloaderVersion(bootloaderVersion);


    // get Firmware from Crownstone.
    this._setProgress(DfuPhases.GETTING_FIRMWARE_VERSION, this.currentStep, 0.4, DfuExecutionInformation.OBTAINED_VERSIONS_FROM_STONE);
    let firmwareVersion = await this.claimedCommander.getFirmwareVersion();
    this.__storeFirmwareVersion(firmwareVersion);

    this._setProgress(DfuPhases.GETTING_FIRMWARE_VERSION, this.currentStep, 0.5, DfuExecutionInformation.OBTAINED_VERSIONS_FROM_STONE);
  }

  async _getVersionsInBootloaderMode() {
    // get FW/BL from Crownstone.
    let bootloaderVersion = await this.claimedCommander.getBootloaderVersion();
    this.__storeBootloaderVersion(bootloaderVersion);
  }


  async _getBootloaderVersionFromDFU() {
    let crownstoneMode = await this._searchForCrownstone();
    await this.claimedCommander.putInDFU()
    crownstoneMode = await this._searchForCrownstone();
    let bootloaderVersion = await this.claimedCommander.getBootloaderVersion();
    if (!bootloaderVersion) {
      throw "Failed to get Bootloader!"
    }
    this.currentBootloaderVersion = bootloaderVersion;
    LOGi.dfu("Executor: Stone bootloader version received.", this.currentBootloaderVersion);
    core.store.dispatch({
      type: "UPDATE_STONE_CONFIG",
      stoneId: this.stoneId,
      sphereId: this.sphereId,
      data: {
        bootloaderVersion: bootloaderVersion,
      }
    });
  }


  __storeBootloaderVersion(bootloaderVersion) {
    if (!bootloaderVersion) {
      this.currentBootloaderVersion = null;
      return;
    }
    else {
      this.currentBootloaderVersion = bootloaderVersion;
    }

    LOGi.dfu("Executor: Stone bootloader version received.", this.currentBootloaderVersion);
    core.store.dispatch({
      type: "UPDATE_STONE_CONFIG",
      stoneId: this.stoneId,
      sphereId: this.sphereId,
      data: {
        bootloaderVersion: bootloaderVersion,
      }
    });
  }


  // _getFirmwareVersionFromStone() {
  //   return StoneUtil.checkFirmwareVersion(this.sphereId, this.stoneId)
  //     .then((firmwareVersion) => {
  //       this._setProgress(DfuPhases.GETTING_FIRMWARE_VERSION, this.currentStep, 0.5, DfuExecutionInformation.OBTAINED_VERSIONS_FROM_STONE);
  //       this.__storeFirmwareVersion(firmwareVersion);
  //     })
  // };


  __storeFirmwareVersion(firmwareVersion) {
    this.currentFirmwareVersion = firmwareVersion;
    LOGi.dfu("Executor: Stone firmware version received.", this.currentFirmwareVersion);
    core.store.dispatch({
      type: "UPDATE_STONE_CONFIG",
      stoneId: this.stoneId,
      sphereId: this.sphereId,
      data: {
        firmwareVersion: firmwareVersion,
      }
    });
  }

  /**
   * This checks how many bootloader operations we need to perform.
   * @param bootloaderCandidate
   */
  _checkBootloaderOperations(bootloaderCandidate) {
    if (!bootloaderCandidate.dependsOnBootloaderVersion) { return Promise.resolve(); }

    if (xUtil.versions.isLower(this.currentBootloaderVersion, bootloaderCandidate.dependsOnBootloaderVersion)) {
      this.amountOfBootloaders += 1;

      LOGi.dfu("Executor: Extra bootloader step required.");
      // we need to download the old BL first.
      return DfuUtil.getBootloaderInformation(bootloaderCandidate.dependsOnBootloaderVersion, this.hardwareVersion)
        .then((previousBootloader) => {
          return this._checkBootloaderOperations(previousBootloader)
        })
    }
    else {
      return Promise.resolve();
    }
  }

  /**
   * This checks how many firmware operations we need to perform.
   * @param bootloaderCandidate
   */
  _checkFirmwareOperations(firmwareCandidate) {
    if (!firmwareCandidate.dependsOnFirmwareVersion) { return Promise.resolve(); }

    // console.log("_checkFirmwareOperations", firmwareCandidate, this.currentFirmwareVersion, firmwareCandidate.dependsOnFirmwareVersion)
    let addFirmwareOperation = () => {
      this.amountOfFirmwares += 1;
      LOGi.dfu("Executor: Extra firmware step required.");
      // we need to download the old BL first.
      return DfuUtil.getFirmwareInformation(firmwareCandidate.dependsOnFirmwareVersion, this.hardwareVersion)
        .then((previousFirmware) => {
          return this._checkFirmwareOperations(previousFirmware)
        })
    }

    // if the current firmware is missing, and there is a dependency from the newest one, do the old one first
    if (firmwareCandidate.dependsOnFirmwareVersion && this.currentFirmwareVersion === null ) {
      // if the bootloader version of this firmware version is lower than the one we have, we probably already have this firmware version.
      if (xUtil.versions.isLower(firmwareCandidate.dependsOnBootloaderVersion, this.currentBootloaderVersion)) {
        return Promise.resolve();
      }
      else {
        return addFirmwareOperation();
      }
    }
    else if (firmwareCandidate.dependsOnFirmwareVersion && xUtil.versions.isLower(this.currentFirmwareVersion, firmwareCandidate.dependsOnFirmwareVersion)) {
      return addFirmwareOperation();
    }
    else {
      return Promise.resolve();
    }
  }


  _handleBootloader(bootloaderCandidate) {
    if (this.stopDFU) { return Promise.reject(DFU_CANCELLED); }

    if (xUtil.versions.isHigherOrEqual(this.currentBootloaderVersion, bootloaderCandidate.version) && !this._debugRepeatBootloader()) {
      LOGi.dfu("Executor: bootloader is up-to-date!");
      this._setProgress(DfuPhases.BOOTLOADER, this.currentStep++, 1, DfuExecutionInformation.UPDATE_SUCCESS);
      return Promise.resolve();
    }

    if (bootloaderCandidate.dependsOnBootloaderVersion && xUtil.versions.isLower(this.currentBootloaderVersion, bootloaderCandidate.dependsOnBootloaderVersion)) {
      // we need to download the old BL first.
      return DfuUtil.getBootloaderInformation(bootloaderCandidate.dependsOnBootloaderVersion, this.hardwareVersion)
        .catch((err) => { this._handleError(err, DfuPhases.BOOTLOADER, DfuExecutionInformation.DOWNLOAD_FAILED); })
        .then(( previousBootloader) => {
          return this._handleBootloader(previousBootloader)
        })
        .then(() => {
          return this._handleBootloader(bootloaderCandidate);
        })
    }
    else {
      LOGi.dfu("Executor: start bootloader update from", this.currentBootloaderVersion, 'to', bootloaderCandidate.version);
      // we can do the DFU now.
      let downloadedBootloaderPath = null;;
      this._setProgress(DfuPhases.BOOTLOADER, this.currentStep, 0, DfuExecutionInformation.DOWNLOAD_STARTED);
      return DfuUtil.downloadBootloader(bootloaderCandidate)
        .catch((err) => { this._handleError(err, DfuPhases.BOOTLOADER, DfuExecutionInformation.DOWNLOAD_FAILED); })
        .then((downloadPath) => {
          LOGi.dfu("Executor: bootloader download complete.");

          this._setProgress(DfuPhases.BOOTLOADER, this.currentStep, 0.1, DfuExecutionInformation.DOWNLOAD_SUCCESS);
          downloadedBootloaderPath = downloadPath;
          return this._searchForCrownstone();
        })
        .then((crownstoneMode) => {
          LOGi.dfu("Executor: crownstone located.", crownstoneMode);
          this._setProgress(DfuPhases.BOOTLOADER, this.currentStep, 0.2, DfuExecutionInformation.UPDATE_PUT_IN_DFU_MODE);
          return this.dfuHelper.putInDFU(this.claimedCommander, crownstoneMode);
        })
        .then(() => {
          LOGi.dfu("Executor: crownstone put in dfu mode.");
          return this._searchForCrownstone();
        })
        .then((crownstoneMode) => {
          LOGi.dfu("Executor: dfu crownstone located. Update starting...");
          this._setProgress(DfuPhases.BOOTLOADER, this.currentStep, 0.3, DfuExecutionInformation.UPDATE_START);
          return this.dfuHelper.updateBootloader(crownstoneMode, downloadedBootloaderPath, this._getUpdateCallback(DfuPhases.BOOTLOADER, this.currentStep));
        })
        .then(() => {
          LOGi.dfu("Executor: bootloader updated to", bootloaderCandidate.version);
          this.currentBootloaderVersion = bootloaderCandidate.version;
          core.store.dispatch({
            type: "UPDATE_STONE_CONFIG",
            stoneId: this.stoneId,
            sphereId: this.sphereId,
            data: {
              bootloaderVersion: bootloaderCandidate.version,
            }
          });
          this._setProgress(DfuPhases.BOOTLOADER, this.currentStep++, 1, DfuExecutionInformation.UPDATE_SUCCESS);
          return FileUtil.safeDeleteFile(downloadedBootloaderPath).catch(() => {});
        })
        .then(() => {
          if (this._debugRepeatBootloader()) {
            return this._handleBootloader(bootloaderCandidate)
          }
        })
    }
  }


  _handleFirmware(firmwareCandidate) {
    if (this.stopDFU) { return Promise.reject(DFU_CANCELLED); }
    if (xUtil.versions.isHigherOrEqual(this.currentFirmwareVersion, firmwareCandidate.version) && !this._debugRepeatFirmware()) {
      LOGi.dfu("Executor: Firmware is up-to-date!");
      this._setProgress(DfuPhases.FIRMWARE, this.currentStep++, 1, DfuExecutionInformation.UPDATE_SUCCESS);
      return Promise.resolve();
    }

    // if the current firmware is missing, and there is a dependency from the newest one, do the old one first
    if (
        (firmwareCandidate.dependsOnFirmwareVersion && this.currentFirmwareVersion === null ) ||
        (firmwareCandidate.dependsOnFirmwareVersion && xUtil.versions.isLower(this.currentFirmwareVersion, firmwareCandidate.dependsOnFirmwareVersion))
      ) {
      // if the bootloader version of this firmware version is lower than the one we have, we probably already have this firmware version.
      return this._addFirmwareStep(firmwareCandidate);
    }
    else {
      // we can do the DFU now.
      return this._performFirmwareUpdate(firmwareCandidate);
    }
  }


  _addFirmwareStep(firmwareCandidate) {
    // we need to download the old FW first.
    return DfuUtil.getFirmwareInformation(firmwareCandidate.dependsOnFirmwareVersion, this.hardwareVersion)
      .catch((err) => { this._handleError(err, DfuPhases.FIRMWARE, DfuExecutionInformation.DOWNLOAD_FAILED); })
      .then((previousFirmware) => {
        // if the bootloader version of this firmware version is lower than the one we have, we probably already have this firmware version.
        if (xUtil.versions.isLower(previousFirmware.dependsOnBootloaderVersion, this.currentBootloaderVersion)) {
          LOGi.dfu("Executor: bootloader of previous version is older than what we have. Not required to backtrack further!");
          return this._performFirmwareUpdate(firmwareCandidate);
        }
        else {
          return this._handleFirmware(previousFirmware)
        }
      })
      .then(() => {
        return this._handleFirmware(firmwareCandidate);
      })
  }


  _performFirmwareUpdate(firmwareCandidate) {
    LOGi.dfu("Executor: start firmware update from", this.currentFirmwareVersion, 'to', firmwareCandidate.version);
    let downloadedFirmwarePath = null;;
    this._setProgress(DfuPhases.FIRMWARE, this.currentStep, 0, DfuExecutionInformation.DOWNLOAD_STARTED);
    return DfuUtil.downloadFirmware(firmwareCandidate)
      .catch((err) => { this._handleError(err, DfuPhases.FIRMWARE, DfuExecutionInformation.DOWNLOAD_FAILED); })
      .then((downloadPath) => {
        LOGi.dfu("Executor: firmware download complete.");

        this._setProgress(DfuPhases.FIRMWARE, this.currentStep, 0.1, DfuExecutionInformation.DOWNLOAD_SUCCESS);
        downloadedFirmwarePath = downloadPath;
        return this._searchForCrownstone();
      })
      .then((crownstoneMode) => {
        LOGi.dfu("Executor: crownstone located.", crownstoneMode);

        this._setProgress(DfuPhases.FIRMWARE, this.currentStep, 0.2, DfuExecutionInformation.UPDATE_PUT_IN_DFU_MODE);
        return this.dfuHelper.putInDFU(this.claimedCommander, crownstoneMode);
      })
      .then(() => {
        LOGi.dfu("Executor: crownstone put in dfu mode.");
        return this._searchForCrownstone();
      })
      .then((crownstoneMode) => {
        LOGi.dfu("Executor: dfu crownstone located. Update starting...");
        this._setProgress(DfuPhases.FIRMWARE, this.currentStep, 0.3, DfuExecutionInformation.UPDATE_START);
        return this.dfuHelper.updateFirmware(crownstoneMode, downloadedFirmwarePath, this._getUpdateCallback(DfuPhases.FIRMWARE, this.currentStep));
      })
      .then(() => {
        LOGi.dfu("Executor: Firmware updated to", firmwareCandidate.version);
        this.currentFirmwareVersion = firmwareCandidate.version;
        core.store.dispatch({
          type: "UPDATE_STONE_CONFIG",
          stoneId: this.stoneId,
          sphereId: this.sphereId,
          data: {
            firmwareVersion: firmwareCandidate.version,
          }
        });
        this._setProgress(DfuPhases.FIRMWARE, this.currentStep++, 1, DfuExecutionInformation.UPDATE_SUCCESS);
        return FileUtil.safeDeleteFile(downloadedFirmwarePath).catch(() => {});
      })
      .then(() => {
        if (this._debugRepeatFirmware()) {
          return this._handleFirmware(firmwareCandidate)
        }
      })
  }


  _searchForCrownstone() : Promise<crownstoneModes> {
    if (this.stopDFU === true) { throw DFU_CANCELLED; }

    // we need high frequency scanning to get duplicates of the DFU crownstone.
    LOG.dfu("DfuOverlay: Start HF Scanning for all Crownstones");
    BleUtil.startHighFrequencyScanning(this.sessionUUID, true);

    return new Promise((resolve, reject) => {
      this.stopScanning = reject;
      let clearSearchTimeout = Scheduler.scheduleCallback(() => {
        BleUtil.stopHighFrequencyScanning(this.sessionUUID);
        this.stopScanning = null;
        this._searchCleanup();
        reject("CANT_FIND_CROWNSTONE");
      }, 15000, "DFU Timeout")



      // this will show the user that he has to move closer to the crownstone or resolve if the user is close enough.
      let rssiResolver = (data, setupMode, dfuMode) => {
        clearSearchTimeout();

        LOGd.dfu("DfuOverlay: Found match:", data);
        // if ((setupMode && data.rssi < -99) || (data.rssi < -80)) {
        //   core.eventBus.emit("updateDfuStep", STEP_TYPES.SEARCHING_MOVE_CLOSER);
        // }
        
        // no need to HF scan any more
        LOG.dfu("DfuOverlay: Stop HF Scanning for all Crownstones");
        BleUtil.stopHighFrequencyScanning(this.sessionUUID);
        this.stopScanning = null;

        this._searchCleanup();
        resolve({setupMode, dfuMode});
      };

      this.processSubscriptions.push(core.nativeBus.on(core.nativeBus.topics.advertisement, (advertisement) => {
        console.log("Got a scan advertisement", advertisement)
        if (advertisement.handle === this.stone.config.handle) {
          rssiResolver(advertisement, false, false);
        }
        else {
          LOGv.dfu("DFUExecutor: Other advertisment received while looking for", this.stone.config.handle, advertisement);
        }
      }));

      this.processSubscriptions.push(core.nativeBus.on(core.nativeBus.topics.setupAdvertisement, (setupAdvertisement) => {
        console.log("Got a scan setupAdvertisement", setupAdvertisement)
        if (setupAdvertisement.handle === this.stone.config.handle) {
          rssiResolver(setupAdvertisement, true, false);
        }
        else {
          LOGv.dfu("DFUExecutor: Other setupAdvertisement received while looking for", this.stone.config.handle, setupAdvertisement);
        }
      }));

      this.processSubscriptions.push(core.nativeBus.on(core.nativeBus.topics.dfuAdvertisement, (dfuAdvertisement) => {
        console.log("Got a scan dfuAdvertisement", dfuAdvertisement)
        if (dfuAdvertisement.handle === this.stone.config.handle) {
          rssiResolver(dfuAdvertisement, false, true);
        }
        else {
          LOGv.dfu("DFUExecutor: Other dfuAdvertisement received while looking for", this.stone.config.handle, dfuAdvertisement);
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


  _debugExtraBootloader() {
    if (ALWAYS_DFU_UPDATE_BOOTLOADER) {
      if (this.amountOfBootloaders < FORCE_MINIMAL_BOOTLOADER_LAYERS) {
        return true;
      }
    }
    return false;
  }
  _debugRepeatBootloader() {
    if (ALWAYS_DFU_UPDATE_BOOTLOADER) {
      if (this.currentStep < 1 + this.amountOfBootloaders) { // 1+ means preparation phase
        return true;
      }
    }
    return false;
  }

  _debugExtraFirmware() {
    if (ALWAYS_DFU_UPDATE_FIRMWARE) {
      if (this.amountOfFirmwares < FORCE_MINIMAL_FIRMWARE_LAYERS) {
        return true;
      }
    }
    return false;
  }
  _debugRepeatFirmware() {
    if (ALWAYS_DFU_UPDATE_FIRMWARE) {
      if (this.currentStep < 1 + this.amountOfBootloaders + this.amountOfFirmwares) {  // 1+ means preparation phase
        return true;
      }
    }
    return false;
  }
}

