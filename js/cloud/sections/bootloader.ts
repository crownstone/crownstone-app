import { cloudApiBase } from "./cloudApiBase";

const DeviceInfo = require('react-native-device-info');


export const bootloader = {
  getBootloaderDetails: function (version, hardwareVersion, background = true) {
    return cloudApiBase._setupRequest('GET', '/Bootloaders?version=' + version + '&hardwareVersion=' + hardwareVersion, {background:background});
  },

  getLatestAvailableBootloader: function (background = true) {
    let appVersionArray = DeviceInfo.getReadableVersion().split(".");
    if (Array.isArray(appVersionArray) && appVersionArray.length >= 3) {
      let appVersion = appVersionArray[0] + '.' + appVersionArray[1] + '.' + appVersionArray[2];
      return cloudApiBase._setupRequest('GET', '/Bootloaders/latest?appVersion=' + appVersion, {background: background});
    }
    else {
      return new Promise((resolve, reject) => { reject("Can't get app version correctly."); })
    }
  },
};