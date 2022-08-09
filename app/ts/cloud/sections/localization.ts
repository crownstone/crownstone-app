import {cloudApiBase} from "./cloudApiBase";
import {CloudAddresses} from "../../backgroundProcesses/indirections/CloudAddresses";
import { MapProvider } from "../../backgroundProcesses/MapProvider";

export const localization = {

  createFingerprintV2: function (data: cloud_Fingerprint_settable, background = true) {
    return cloudApiBase._setupRequest(
      'POST',
      CloudAddresses.cloud_v2 + 'spheres/{id}/fingerprint/',
      { data: data, background: background },
      'body'
    );
  },

  updateFingerprintV2: function (localFingerprintId, data: cloud_Fingerprint_settable, background = true) {
    let cloudFingerprintId = MapProvider.local2cloudMap.fingerprints[localFingerprintId] || localFingerprintId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'PUT',
      CloudAddresses.cloud_v2 + 'spheres/{id}/fingerprint/' + localFingerprintId,
      { background: background, data: data },
      'body'
    );
  },

  deleteFingerprintV2: function (fingerprintCloudId, background = true) {
    return cloudApiBase._setupRequest(
      'DELETE',
      CloudAddresses.cloud_v2 + 'spheres/{id}/fingerprint/' + fingerprintCloudId,
    );
  },
};
