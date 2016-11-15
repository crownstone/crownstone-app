export const devices = {
  getDevices: function (options = {}) {
    return this._setupRequest('GET', '/users/{id}/devices', options);
  },

  createDevice: function (data, background = true) {
    return this._setupRequest(
      'POST',
      '/users/{id}/devices',
      { data: data, background: background},
      'body'
    );
  },

  updateDevice: function (data, background = true) {
    return this._setupRequest(
      'PUT',
      '/Devices/{id}',
      { data: data, background: background },
      'body'
    );
  },

  updateDeviceLocation: function (locationId, background = true) {
    return this._setupRequest(
      'PUT',
      '/Devices/{id}/currentLocation/' + locationId,
      { background: background }
    );
  },


  deleteDevice: function(deviceId) {
    return this._setupRequest(
      'DELETE',
      '/users/{id}/devices/' + deviceId
    );
  }
};