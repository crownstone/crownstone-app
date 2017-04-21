import {CLOUD} from "../../cloud/cloudAPI";
import {LOG} from "../../logging/Log";
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


  download() {
    let toPath = RNFS.DocumentDirectoryPath + '/firmware.zip';
    CLOUD.downloadFile(this.firmware.downloadUrl, toPath, {
      start:    (data) => { LOG.info("start DOWNLOAD", data); },
      progress: (data) => { LOG.info("progress DOWNLOAD", data); },
      success:  (data) => { LOG.info("success DOWNLOAD", data); },
    })
      .then((resultPath) => {
        this.downloadedFirmwareVersion = this.firmware.version;
        LOG.info("Downloaded file", resultPath);
      })
      .catch((err) => {
        LOG.error("Could not download file", err);
      })
  }

  test() {
    this.getVersions()
      .then(() => {
        return this.download();
      })
      .then(() => {
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