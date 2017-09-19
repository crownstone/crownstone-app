export const devices = {
  getDevices: function (options : any = {}) {
    return this._setupRequest('GET', '/users/{id}/devices', {...options, data:{filter:{"include":"installations"}}});
  },

  createDevice: function (data, background = true) {
    return this._setupRequest(
      'POST',
      '/users/{id}/devices',
      { data: data, background: background},
      'body'
    );
  },

  updateDevice: function (deviceId, data, background = true) {
    return this._setupRequest(
      'PUT',
      '/Devices/' + deviceId,
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

  updateDeviceSphere: function (sphereId, background = true) {
    return this._setupRequest(
      'PUT',
      '/Devices/{id}/currentSphere/' + sphereId,
      { background: background }
    );
  },

  deleteDevice: function(deviceId) {
    return this._setupRequest(
      'DELETE',
      '/users/{id}/devices/' + deviceId
    );
  },

  deleteAllDevices: function() {
    return this._setupRequest(
      'DELETE',
      '/users/{id}/deleteAllDevices'
    );
  }
};