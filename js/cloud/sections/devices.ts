import {MapProvider} from "../../backgroundProcesses/MapProvider";

export const devices = {
  getDevices: function (background: true) {
    return this._setupRequest('GET', '/users/{id}/devices', {background:background, data:{filter:{"include":"installations"}}});
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

  updateDeviceLocation: function (localLocationId, background = true) {
    let cloudLocationId = MapProvider.local2cloudMap.locations[localLocationId] || localLocationId; // the OR is in case a cloudId has been put into this method.
    return this._setupRequest(
      'PUT',
      '/Devices/{id}/currentLocation/' + cloudLocationId,
      { background: background }
    );
  },

  updateDeviceSphere: function (localSphereId, background = true) {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    return this._setupRequest(
      'PUT',
      '/Devices/{id}/currentSphere/' + cloudSphereId,
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