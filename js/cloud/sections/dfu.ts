export const dfu = {
  getFirmwareDetails: function (version, background = false) {
    return this._setupRequest('GET', '/Firmwares/getByVersion?version=' + version, {background:background});
  },

  getBootloaderDetails: function (version, background = false) {
    return this._setupRequest('GET', '/Bootloaders/getByVersion?version=' + version, {background:background});
  },

};