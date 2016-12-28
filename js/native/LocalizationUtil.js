import { Alert } from 'react-native';
import { Bluenet, BleActions, NativeBus } from './Proxy';
import { LOG, LOGDebug, LOGError } from '../logging/Log'

export const LocalizationUtil = {

  /**
   * clear all beacons and re-register them. This will not re-emit roomEnter/exit if we are in the same room.
   */
  trackSpheres: function (store) {
    BleActions.isReady()
      .then(() => {
        return BleActions.clearTrackedBeacons();
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

          LOG("-------------- SETUP TRACKING FOR ", sphereIBeaconUUID);

          let locations = state.spheres[sphereId].locations;
          let locationIds = Object.keys(locations);
          locationIds.forEach((locationId) => {
            if (locations[locationId].config.fingerprintRaw) {
              // check format of the fingerprint:
              if (validateFingerprint(locations[locationId].config.fingerprintRaw)) {
                LOG("-------------- LOADING FINGERPRINT FOR ", locationId, " IN SPHERE ", sphereId);
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
    // yes its neater to return the if statement but this makes it easier to extend.
    return true;
  }
  else {
    return false;
  }
}