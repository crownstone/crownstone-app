import {cloudApiBase} from "./cloudApiBase";
import {CloudAddresses} from "../../backgroundProcesses/indirections/CloudAddresses";

export const spheresNext = {

  deleteFingerprintV2: function (fingerprintCloudId, background = true) {
    return cloudApiBase._setupRequest(
      'DELETE',
      CloudAddresses.cloud_v2 + 'spheres/{id}/fingerprint/' + fingerprintCloudId,
    );
  },
};
