import { Alert } from 'react-native';
import { Bluenet, BluenetPromises, NativeBus } from './Proxy';
import { LOG, LOGDebug, LOGError } from '../logging/Log'

export const LocalizationUtil = {

  /**
   * clear all beacons and re-register them. This will not re-emit roomEnter/exit if we are in the same room.
   */
  trackSpheres: function (store) {
    LOG("LocalizationUtil: Track Spheres called.");
    BluenetPromises.isReady()
      .then(() => {
        return BluenetPromises.clearTrackedBeacons();
      })
      .then(() => {
        // register the iBeacons UUIDs with the localization system.
        const state = store.getState();
        let sphereIds = Object.keys(state.spheres);
        let showRemoveFingerprintNotification = false;
        let actions = [];

        sphereIds.forEach((sphereId) => {
          let sphereIBeaconUUID = state.spheres[sphereId].config.iBeaconUUID;

          // track the sphere beacon UUID
          Bluenet.trackIBeacon(sphereIBeaconUUID, sphereId);

          LOG("LocalizationUtil: Setup tracking for iBeacon UUID: ", sphereIBeaconUUID);

          let locations = state.spheres[sphereId].locations;
          let locationIds = Object.keys(locations);
          locationIds.forEach((locationId) => {
            if (locations[locationId].config.fingerprintRaw) {
              // check format of the fingerprint:
              LOG("LocalizationUtil: Checking fingerprint format for: ", locationId, " in sphere: ", sphereId);
              if (validateFingerprint(locations[locationId].config.fingerprintRaw)) {
                LOG("LocalizationUtil: Loading fingerprint for: ", locationId, " in sphere: ", sphereId);
                Bluenet.loadFingerprint(sphereId, locationId, locations[locationId].config.fingerprintRaw);
              }
              else {
                showRemoveFingerprintNotification = true;
                actions.push({type: 'REMOVE_LOCATION_FINGERPRINT', sphereId: sphereId, locationId: locationId})
              }
            }
          });
        });

        if (showRemoveFingerprintNotification === true) {
          if (actions.length > 0)
            store.batchDispatch(actions);

          Alert.alert(
            "Please forgive me :(",
            "Due to many improvements in the localization you will have to train your rooms again...",
            [{text:"OK"}]
          );
        }
      })
      .catch()
  },
};


/**
 * Use this method to catch any case where the fingerprint would be incorrect due to bugs or old formats.
 *
 * @param fingerprintRaw
 * @returns {boolean}
 */
function validateFingerprint(fingerprintRaw) {
  let fingerprint = JSON.parse(fingerprintRaw);
  if (fingerprint.length > 0 && fingerprint[0].devices !== undefined) {
    // check for negative major or minors, coming from casting to Int16 instead of UInt16 in Android.
    for (let i = 0; i < fingerprint.length; i++) {
      let deviceIds = Object.keys(fingerprint[i].devices);
      for (let j = 0; j < deviceIds.length; j++) {
        if (deviceIds[j].length < 1 || deviceIds[j].indexOf(":-") > 0) {
          return false;
        }
      }
    }

    return true;
  }

  return false;
}