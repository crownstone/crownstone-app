import {cloudApiBase} from "./cloudApiBase";

export const dfu = {
  getFirmwareDetails: function (version, hardwareVersion, background = false) {
    return cloudApiBase._setupRequest('GET', '/Firmwares?version=' + version + '&hardwareVersion=' + hardwareVersion, {background:background});
  },

  getBootloaderDetails: function (version, hardwareVersion, background = false) {
    return cloudApiBase._setupRequest('GET', '/Bootloaders?version=' + version + '&hardwareVersion=' + hardwareVersion, {background:background});
  },

};