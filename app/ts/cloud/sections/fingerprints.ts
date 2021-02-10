import {MapProvider} from "../../backgroundProcesses/MapProvider";
import { cloudApiBase } from "./cloudApiBase";

export const fingerprints = {
  createFingerprint: function (localLocationId, data, background: true) {
    let cloudLocationId = MapProvider.local2cloudMap.locations[localLocationId] || localLocationId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'POST',
      '/Devices/{id}/fingerprint?locationId='+cloudLocationId,
      { background: background, data: data },
      'body'
    );
  },

  getFingerprintsInLocations: function (cloudLocationIdArray, background = true) {
    return cloudApiBase._setupRequest(
      'GET',
      '/Devices/{id}/fingerprintsForLocations?locationIds='+JSON.stringify(cloudLocationIdArray),
      { background: background },
    );
  },

  getFingerprints: function (fingerprintIdArray, background = true) {
    return cloudApiBase._setupRequest(
      'GET',
      '/Devices/{id}/fingerprints?fingerprintIds='+JSON.stringify(fingerprintIdArray),
      { background: background },
    );
  },

  updateFingerprint: function (fingerprintId, data, background = true) {
    return cloudApiBase._setupRequest(
      'PUT',
      '/Devices/{id}/fingerprint?fingerprintId='+fingerprintId,
      { background: background, data:data },
      'body'
    );
  },


  getMatchingFingerprintsInLocations: function (cloudLocationIdArray, background = true) {
    return cloudApiBase._setupRequest(
      'GET',
      '/Devices/{id}/fingerprintsMatching?locationIds='+JSON.stringify(cloudLocationIdArray),
      { background: background }
    );
  },


  linkFingerprints: function (fingerprintIdArray, background = true) {
    return cloudApiBase._setupRequest(
      'POST',
      '/Devices/{id}/fingerprintsLink?fingerprintIds='+JSON.stringify(fingerprintIdArray),
      { background: background }
    );
  },


  getFingerprintUpdateTimes: function (fingerprintIdArray, background = true) {
    return cloudApiBase._setupRequest(
      'GET',
      '/Devices/{id}/fingerprintsUpdatedAt?fingerprintIds='+JSON.stringify(fingerprintIdArray),
      { background: background }
    );
  },
};