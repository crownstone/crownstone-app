import { core } from "../Core";
import { Get } from "./GetUtil";
import {enoughCrownstonesInLocationsForIndoorLocalization} from "./DataUtil";
import {FingerprintUtil} from "./FingerprintUtil";


export const LocalizationUtil = {

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

    if (Object.keys(location.fingerprints.raw).length === 0) {
      return true;
    }
    return false;
  },


  /**
   * True is we need to gather fingerprints in this location
   * @param sphereId
   * @param locationId
   */
  shouldTrainLocationNow: function(sphereId: sphereId, locationId: locationId) : boolean {
    if (LocalizationUtil.shouldTrainLocation(sphereId, locationId) === false) {
      return false;
    }

    let sphere = Get.sphere(sphereId);
    if (sphere.state.present   === false) { return false; } // cant train a room when not in the sphere
    if (sphere.state.reachable === false) { return false; } // cant train a room when not in the sphere

    return true;
  },


  deleteAllLocalizationData(sphereId: sphereId, locationId: locationId) : void {
    core.store.dispatch({type:"REMOVE_ALL_FINGERPRINTS_V2", sphereId, locationId});
  },


  getLocationsInNeedOfAttention(sphereId: sphereId) : LocationData[] {
    return checkLocations(sphereId, (location) => {
      let score = FingerprintUtil.calculateLocationScore(sphereId, location.id);
      return !FingerprintUtil.isScoreGoodEnough(score);
    });
  },


  getLocationsWithGoodFingerprints(sphereId: sphereId) : LocationData[] {
    return checkLocations(sphereId, (location) => {
      let score = FingerprintUtil.calculateLocationScore(sphereId, location.id);
      return FingerprintUtil.isScoreGoodEnough(score);
    });
  },
}

function checkLocations(sphereId: sphereId, comparator) : LocationData[] {
  let sphere = Get.sphere(sphereId);
  if (!sphere) { return []; }

  let result = [];
  let locations = Object.values(sphere.locations);
  for (let location of locations) {
    if (comparator(location)) {
      result.push(location);
    }
  }

  return result;
}
