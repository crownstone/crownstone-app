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
  },

  /**
   * Get the stone identifier maj_min from a string like this D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:47912_Min:57777
   */
  getStoneIdentifierFromIBeaconString: function(str : string) : string {
    let parts = str.split("_");
    if (parts.length !== 3) {
      return null;
    }
    return `${parts[1].substr(4)}_${parts[2].substr(4)}`;
  },

  getStoneIdentifierFromStone: function(stone : StoneData) : string {
    return `${stone.config.iBeaconMajor}_${stone.config.iBeaconMinor}`;
  },

}
