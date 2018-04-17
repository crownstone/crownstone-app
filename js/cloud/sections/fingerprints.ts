import {MapProvider} from "../../backgroundProcesses/MapProvider";

export const fingerprints = {
  createFingerprint: function (localLocationId, data, background: true) {
    let cloudLocationId = MapProvider.local2cloudMap.locations[localLocationId] || localLocationId; // the OR is in case a cloudId has been put into this method.
    return this._setupRequest(
      'POST',
      '/Devices/{id}/fingerprints?locationId='+cloudLocationId,
      { background: background, data: data }
    );
  },

  getFingerprintsInSphere: function (localSphereId, background = true) {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    return this._setupRequest(
      'GET',
      '/Devices/{id}/fingerprintsInSphere?sphereId='+cloudSphereId,
      { background: background},
      'body'
    );
  },

  getFingerprintsInLocations: function (cloudLocationIdArray, background = true) {
    return this._setupRequest(
      'GET',
      '/Devices/{id}/fingerprints?locationIds='+JSON.stringify(cloudLocationIdArray),
      { background: background },
      'body'
    );
  },

  getMatchingFingerprint: function (localLocationId, background = true) {
    let cloudLocationId = MapProvider.local2cloudMap.locations[localLocationId] || localLocationId; // the OR is in case a cloudId has been put into this method.
    return this._setupRequest(
      'GET',
      '/Devices/{id}/matchingFingerprint?locationId='+cloudLocationId,
      { background: background }
    );
  },
};