export const dfu = {
  getFirmwareDetails: function (version, background = false) {
    return this._setupRequest('GET', '/Firmware/getByVersion?version=' + version, {background:background});
  },

  getBootloaderDetails: function (version, background = false) {
    return this._setupRequest('GET', '/Bootloader/getByVersion?version=' + version, {background:background});
  },

};