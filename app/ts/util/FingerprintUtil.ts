import { core } from "../Core";
import { Get } from "./GetUtil";


export const requireMoreFingerprintsBeforeLocalizationCanStart = function (sphereId : string) : boolean {
  let state = core.store.getState();
  let sphere = Get.sphere(sphereId);
  if (!sphere) { return false; }

  for (let locationId in sphere.locations) {
    let location = sphere.locations[locationId];
    if (Object.keys(location.fingerprints.raw).length === 0) {
      return true;
    }
  }
  return false;
};

export const FingerprintUtil = {

  // check if there are any fingerprints in the location
  hasFingerprints: function(sphereId : string, locationId : string) : boolean {
    let location = Get.location(sphereId, locationId);
    if (!location) { return false; }

    return Object.keys(location.fingerprints.raw).length !== 0;
  }
}
