import { core } from "../Core";
import { Get } from "./GetUtil";
import {enoughCrownstonesInLocationsForIndoorLocalization} from "./DataUtil";
import DeviceInfo from "react-native-device-info";



export const FingerprintUtil = {

  requireMoreFingerprintsBeforeLocalizationCanStart: function (sphereId : string) : boolean {
    let sphere = Get.sphere(sphereId);
    if (!sphere) { return false; }

    for (let locationId in sphere.locations) {
      let location = sphere.locations[locationId];
      if (Object.keys(location.fingerprints.raw).length === 0) {
        return true;
      }
    }
    return false;
  },


  hasInPocketSet: function(location: LocationData) : boolean {
    for (let [fingerprintId, fingerprint] of Object.entries(location.fingerprints.raw)) {
      if (fingerprint.type === "IN_POCKET") {
        return true;
      }
    }
    return false;
  },


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


  /**
   * TODO: Implement scoring system.
   * @param sphereId
   * @param locationId
   * @param fingerprintId
   */
  isFingerprintGoodEnough: function(sphereId, locationId, fingerprintId) : boolean {
    return true;
  },


  /**
   * True is we need to gather fingerprints in this location
   * @param sphereId
   * @param locationId
   */
  shouldTrainLocation: function(sphereId: sphereId, locationId: locationId) : boolean {
    let location = Get.location(sphereId, locationId);
    if (!location) { return false; }

    let enoughCrownstonesInLocations = enoughCrownstonesInLocationsForIndoorLocalization(sphereId);
    let state = core.store.getState();

    if (!state.app.indoorLocalizationEnabled) { return false; } // do not show localization if it is disabled
    if (!enoughCrownstonesInLocations)        { return false; } // not enough crownstones to train this room

    if (Object.keys(location.fingerprints.raw).length > 0) {
      let hasGoodFingerprint = false
      for (let fingerprintId in location.fingerprints.raw) {
        if (FingerprintUtil.isFingerprintGoodEnough(sphereId, locationId, fingerprintId)) {
          hasGoodFingerprint = true;
          break;
        }
      }

      if (hasGoodFingerprint) {
        return false; // already have fingerprints in this location
      }
    }

    return true;
  },


  /**
   * True is we need to gather fingerprints in this location
   * @param sphereId
   * @param locationId
   */
  shouldTrainLocationNow: function(sphereId: sphereId, locationId: locationId) : boolean {
    if (FingerprintUtil.shouldTrainLocation(sphereId, locationId) === false) {
      return false;
    }

    let sphere = Get.sphere(sphereId);
    if (sphere.state.present   === false) { return false; } // cant train a room when not in the sphere
    if (sphere.state.reachable === false) { return false; } // cant train a room when not in the sphere

    return true;
  },


  getDeviceType(): string {
    let state = core.store.getState();

    let deviceId = DeviceInfo.getDeviceId;

    return `${deviceId}_${state.user.userId}`
  },
}

