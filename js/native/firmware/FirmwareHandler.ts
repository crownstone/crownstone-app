import { CLOUD }          from "../../cloud/cloudAPI";
import { LOG }            from "../../logging/Log";
import { safeDeleteFile } from "../../util/Util";
import { FirmwareHelper } from "./FirmwareHelper";

const RNFS = require('react-native-fs');
const sha1 = require('sha-1');

class FirmwareHandlerClass {
  newFirmwareDetails: any = {};
  newBootloaderDetails: any = {};

  downloadedFirmwareVersion : string = null;
  downloadedBootloaderVersion : string = null;

  paths: any = {};

  constructor() { }

  getVersions(firmwareVersion, bootloaderVersion) {
    if (!firmwareVersion || !bootloaderVersion) {
      throw "No version available!";
    }
    let promises = [];
    promises.push(CLOUD.getFirmwareDetails(firmwareVersion)
      .then((result) => {
        if (result) {
          this.newFirmwareDetails = result;
        }
      }));
    promises.push(CLOUD.getBootloaderDetails(bootloaderVersion)
      .then((result) => {
        if (result) {
          this.newBootloaderDetails = result;
        }
      }));
    return Promise.all(promises);
  }


  download(sourceDetails, type) {
    let toPath = RNFS.DocumentDirectoryPath + '/' + type + '.zip';
    this.paths[type] = toPath;
    // remove the file we will write to if it exists
    return safeDeleteFile(toPath)
      .then(() => {
        return CLOUD.downloadFile(sourceDetails.downloadUrl, toPath, {
          start: (data) => {
            LOG.info("start DOWNLOAD", data);
          },
          progress: (data) => {
            LOG.info("progress DOWNLOAD", data);
          },
          success: (data) => {
            LOG.info("success DOWNLOAD", data);
          },
        })
      })
      .then((resultPath) => {
        LOG.info("Downloaded file", resultPath);
        return RNFS.readFile(resultPath, 'ascii');
      })
      .then((fileContent) => {
        return new Promise((resolve, reject) => {
          let hash = sha1(fileContent);
          LOG.info(type, "HASH", '"' + hash + '"', '"' + sourceDetails.sha1hash + '"');
          if (hash === sourceDetails.sha1hash) {
            LOG.info("Verified hash");
            resolve();
          }
          else {
            safeDeleteFile(toPath).catch(() => {});
            reject("Invalid hash");
          }
        })
      })
      .catch((err) => {
        safeDeleteFile(toPath).catch(() => {});
        LOG.error("Could not download file", err);

        // propagate the error
        throw err;
      })
  }

  getNewVersions(firmwareVersion, bootloaderVersion) {
    return this.getVersions(firmwareVersion, bootloaderVersion)
      .then(() => {
        return this.download(this.newFirmwareDetails,'firmware');
      })
      .then(() => {
        LOG.info("FINISHED DOWNLOADING FIRMWARE");
        this.downloadedFirmwareVersion = this.newFirmwareDetails.version;
        return this.download(this.newBootloaderDetails,'bootloader');
      })
      .then(() => {
        LOG.info("FINISHED DOWNLOADING BOOTLOADER");
        this.downloadedBootloaderVersion = this.newBootloaderDetails.version;
      })
  }


  /**
   * This expects the stone to be not connected and not in DFU mode.
   * @param store
   * @param sphereId
   * @param stoneId
   */
  getFirmwareHelper(store, sphereId, stoneId) {
    let state = store.getState();
    let stone = state.spheres[sphereId].stones[stoneId];
    let helper = new FirmwareHelper({
      handle: stone,
      sphereId: sphereId,
      firmwareURI: this.paths['firmware'],
      bootloaderURI: this.paths['bootloader'],
      stoneFirmwareVersion: stone.config.firmwareVersion,
      stoneBootloaderVersion: stone.config.bootloaderVersion,
      newFirmwareDetails: this.newFirmwareDetails,
      newBootloaderDetails: this.newBootloaderDetails,
    });
    return helper;
  }
}

export const FirmwareHandler = new FirmwareHandlerClass();