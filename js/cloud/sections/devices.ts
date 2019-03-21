import {MapProvider} from "../../backgroundProcesses/MapProvider";
import { cloudApiBase } from "./cloudApiBase";

export const devices = {
  getDevices: function (background: true) {
    return cloudApiBase._setupRequest('GET', '/users/{id}/devices', {background:background, data:{filter:{"include":"installations"}}});
  },

  createDevice: function (data, background = true) {
    return cloudApiBase._setupRequest(
      'POST',
      '/users/{id}/devices',
      { data: data, background: background},
      'body'
    );
  },

  updateDevice: function (deviceId, data, background = true) {
    return cloudApiBase._setupRequest(
      'PUT',
      '/Devices/' + deviceId,
      { data: data, background: background },
      'body'
    );
  },

  sendTestNotification: function() {
    return cloudApiBase._setupRequest(
      'POST',
      '/Devices/{id}/testNotification/'
    );
  },

  deleteDevice: function(deviceId) {
    return cloudApiBase._setupRequest(
      'DELETE',
      '/users/{id}/devices/' + deviceId
    );
  },

  deleteAllDevices: function() {
    return cloudApiBase._setupRequest(
      'DELETE',
      '/users/{id}/deleteAllDevices'
    );
  },

  inSphere: function (localSphereId, background = true) {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'POST',
      '/Devices/{id}/inSphere/',
      { data: {sphereId:cloudSphereId}, background: background },
      'query'
    );
  },

  inLocation: function (localSphereId, localLocationId, background = true) {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    let cloudLocationId = MapProvider.local2cloudMap.locations[localLocationId] || localLocationId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'POST',
      '/Devices/{id}/inLocation/',
      { data: {sphereId:cloudSphereId, locationId:cloudLocationId }, background: background },
      'query'
    );
  },

  exitLocation: function (localSphereId, localLocationId, background = true) {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    let cloudLocationId = MapProvider.local2cloudMap.locations[localLocationId] || localLocationId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'POST',
      '/Devices/{id}/exitLocation/',
      { data: {sphereId:cloudSphereId, locationId:cloudLocationId }, background: background },
      'query'
    );
  },

  exitSphere: function (localSphereId, background = true) {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'POST',
      '/Devices/{id}/exitSphere/',
      { data: {sphereId:cloudSphereId}, background: background },
      'query'
    );
  },
};