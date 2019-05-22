import { cloudApiBase } from "./cloudApiBase";

import DeviceInfo from 'react-native-device-info';

export const firmware = {
  getFirmwareDetails: function (version, hardwareVersion, background = true) {
    return cloudApiBase._setupRequest('GET', '/Firmwares?version=' + version + '&hardwareVersion=' + hardwareVersion, {background:background});
  },

  getLatestAvailableFirmware: function (background = true) {
    let appVersionArray = DeviceInfo.getReadableVersion().split(".");
    if (Array.isArray(appVersionArray) && appVersionArray.length >= 3) {
      let appVersion = appVersionArray[0] + '.' + appVersionArray[1] + '.' + appVersionArray[2];
      return cloudApiBase._setupRequest('GET', '/Firmwares/latest?appVersion=' + appVersion, {background: background});
    }
    else {
      return new Promise((resolve, reject) => { reject("Can't get app version correctly."); })
    }
  },
};