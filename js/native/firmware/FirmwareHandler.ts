import {CLOUD} from "../../cloud/cloudAPI";
import {LOG} from "../../logging/Log";
import {safeDeleteFile} from "../../util/Util";
const RNFS    = require('react-native-fs');
const sha1    = require('sha-1');

class FirmwareHandlerClass {
  firmware: any = {};
  bootloader: any = {};

  downloadedFirmwareVersion : string = null;
  downloadedBootloaderVersion : string = null;

  constructor() { }


  getVersions() {
    let promises = [];
    promises.push(CLOUD.getFirmwareDetails('1.3.1')
      .then((result) => {
        if (result) {
          this.firmware = result;
        }
      }));
    promises.push(CLOUD.getBootloaderDetails('1.2.2')
      .then((result) => {
        if (result) {
          this.bootloader = result;
        }
      }));
    return Promise.all(promises);
  }


  download(source, type) {
    let toPath = RNFS.DocumentDirectoryPath + '/' + type + '.zip';
    // remove the file we will write to if it exists
    return safeDeleteFile(toPath)
      .then(() => {
        return CLOUD.downloadFile(source.downloadUrl, toPath, {
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
          LOG.info(type, "HASH", '"' + hash + '"', '"' + source.sha1hash + '"')
          if (hash === source.sha1hash) {
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

  test() {
    this.getVersions()
      .then(() => {
        return this.download(this.firmware,'firmware');
      })
      .then(() => {
        LOG.info("FINISHED DOWNLOADING FIRMWARE");
        this.downloadedFirmwareVersion = this.firmware.version;
        return this.download(this.bootloader,'bootloader');
      })
      .then(() => {
        LOG.info("FINISHED DOWNLOADING BOOTLOADER");
        this.downloadedBootloaderVersion = this.bootloader.version;
        LOG.info("All tests done.")
      })
      .catch((err) => { LOG.error("Failed test", err)})
  }


  /**
   * This expects the stone to be not connected and not in DFU mode.
   * @param store
   * @param stoneId
   * @param stone
   */
  update(store, stoneId, stone) {

  }
}

export const FirmwareHandler = new FirmwareHandlerClass();