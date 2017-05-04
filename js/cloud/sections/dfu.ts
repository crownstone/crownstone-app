export const dfu = {
  getFirmwareDetails: function (version, hardwareVersion, background = false) {
    return this._setupRequest('GET', '/Firmwares/getFirmware?version=' + version + '&hardwareVersion=' + hardwareVersion, {background:background});
  },

  getBootloaderDetails: function (version, hardwareVersion, background = false) {
    return this._setupRequest('GET', '/Bootloaders/getBootloader?version=' + version + '&hardwareVersion=' + hardwareVersion, {background:background});
  },

};