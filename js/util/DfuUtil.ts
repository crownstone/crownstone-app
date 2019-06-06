import { CLOUD }          from "../cloud/cloudAPI";
import {LOG, LOGe} from "../logging/Log";
import { FileUtil } from "./FileUtil";
import { Languages } from "../Languages";
import { core } from "../core";
import { xUtil } from "./StandAloneUtil";
import { ALWAYS_DFU_UPDATE_BOOTLOADER, ALWAYS_DFU_UPDATE_FIRMWARE } from "../ExternalConfig";

const RNFS = require('react-native-fs');
const sha1 = require('sha-1');

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DfuHelper", key)(a,b,c,d,e);
}


let RELEASE_NOTES_ERROR = lang("Could_not_download_releas");
let RELEASE_NOTES_NA    = lang("Release_notes_not_availab");

export const DfuUtil = {
  getFirmwareInformation: function(version, hardwareVersion) {
    return CLOUD.getFirmwareDetails(version, hardwareVersion, false)
      .then((result) => {
        if (result === null) {
          throw "No firmware available.";
        }
        return result;
      })
  },

  getBootloaderInformation: function(version, hardwareVersion) {
    return CLOUD.getBootloaderDetails(version, hardwareVersion, false)
      .then((result) => {
        if (result === null) {
          throw "No bootloader available.";
        }
        return result;
      })
  },

  downloadFirmware: function(firmwareCandidate) {
    return _download(firmwareCandidate,'firmware');
  },

  downloadBootloader: function(bootloaderCandidate) {
    return _download(bootloaderCandidate,'bootloader');
  },

  getReleaseNotes: function(sphereId, userConfig) {
    let updateData = DfuUtil.getUpdatableStones(sphereId);

    let hightestFirmwareVersion = Object.keys(updateData.versionsObj).sort((a,b) => { return a > b ? -1 : 1 })[0]
    let hardwareVersion = updateData.versionsObj[hightestFirmwareVersion];

    return DfuUtil.getFirmwareInformation(hightestFirmwareVersion, hardwareVersion)
      .then((newFirmwareDetails) => {
        let releaseNotes = newFirmwareDetails.releaseNotes;
        if (typeof releaseNotes === 'object') {
          // the first hit should be the locale of the user, then fallback on english, then fallback on the first key (if no keys exist)
          releaseNotes = releaseNotes['en'] || releaseNotes['en'] || releaseNotes[Object.keys(releaseNotes)[0]];
        }
        // final fallback, release notes not available.
        releaseNotes = releaseNotes || RELEASE_NOTES_NA;
        return releaseNotes;
      })
      .catch((err) => {
        LOGe.info("DFU UTIL: Could not download release notes...", err);
        let errorMessage = RELEASE_NOTES_ERROR;
        if (userConfig.firmwareVersionsAvailable[hardwareVersion] === undefined) {
          errorMessage += "\nNo firmware available form hardwareVersion: " + hardwareVersion + "\n"
        }
        if (userConfig.bootloaderVersionsAvailable[hardwareVersion] === undefined) {
          errorMessage += "\nNo bootloader available form hardwareVersion: " + hardwareVersion + "\n"
        }

        return errorMessage;
      })
  },

  getUpdatableStones: function(sphereId) : {stones: {[key:string]: any}, amountOfStones: number, versionsObj: any}  {
    let state = core.store.getState();
    let stones = state.spheres[sphereId].stones;
    let stoneIds = Object.keys(stones);

    let updatableStones = {};
    let versionsAvailable = {};
    stoneIds.forEach((stoneId) => {
      let stone = stones[stoneId];
      let availableFW = state.user.firmwareVersionsAvailable[stone.config.hardwareVersion];
      if (!availableFW) { return; }

      if (xUtil.versions.isLower(stone.config.firmwareVersion, availableFW) || ALWAYS_DFU_UPDATE_BOOTLOADER || ALWAYS_DFU_UPDATE_FIRMWARE) {
        if (versionsAvailable[availableFW] === undefined) {
          versionsAvailable[availableFW] = stone.config.hardwareVersion
        }
        updatableStones[stoneId] = stone;
      }
    });

    return { stones: updatableStones, amountOfStones: Object.keys(updatableStones).length, versionsObj: versionsAvailable };
  }



}

function _download(sourceDetails, type) {
  // set path depending on ios or android
  let toPath = FileUtil.getPath(type + '.zip');

  // remove the file we will write to if it exists
  return FileUtil.safeDeleteFile(toPath)
    .then(() => {
      return CLOUD.downloadFile(sourceDetails.downloadUrl, toPath, {
        start: (data) => {
          LOG.info("DfuHandler: start DOWNLOAD", data);
        },
        progress: (data) => {
          LOG.info("DfuHandler: progress DOWNLOAD", data);
        },
        success: (data) => {
          LOG.info("DfuHandler: success DOWNLOAD", data);
        },
      })
    })
    .then((resultPath) => {
      LOG.info("DfuUtil: Downloaded file", resultPath);
      return RNFS.readFile(resultPath, 'ascii');
    })
    .then((fileContent) => {
      return new Promise((resolve, reject) => {
        let hash = sha1(fileContent);
        LOG.info(type, "HASH", '"' + hash + '"', '"' + sourceDetails.sha1hash + '"');
        if (hash === sourceDetails.sha1hash) {
          LOG.info("DfuUtil: Verified hash");
          resolve(toPath);
        }
        else {
          return FileUtil.safeDeleteFile(toPath)
            .then(() => { reject("Invalid hash");})
            .catch(() => { reject("Invalid hash");});
        }
      })
    })
    .catch((err) => {
      LOGe.info("DfuUtil: Could not download file", err);
      return FileUtil.safeDeleteFile(toPath)
        .catch(() => { throw err; })
        .then(() => { throw err; })
    })
}

