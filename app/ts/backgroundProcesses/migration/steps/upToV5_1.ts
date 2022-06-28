import {core} from "../../../Core";
import {xUtil} from "../../../util/StandAloneUtil";
import {RoomStockBackground} from "../../../views/styles";
import { FingerprintUtil } from "../../../util/FingerprintUtil";

export const clean_upTo5_1 = async function() {
}

export const upTo5_1 = function(lastMigrationVersion, appVersion) {
  if (xUtil.versions.isLower(lastMigrationVersion, appVersion, 4) || !lastMigrationVersion) {
    loadRoomStockImages();
    migrateFingerprints();
    core.store.dispatch({type: "UPDATE_APP_SETTINGS", data: {migratedDataToVersion: appVersion}});
  }
}

function loadRoomStockImages() {
  let state = core.store.getState();
  let actions = [];

  let count = -1;

  let keys = Object.keys(RoomStockBackground);
  let randomImage = function() { return keys[count++ % keys.length]; }

  for (let [sphereId, sphere] of Object.entries<SphereData>(state.spheres)) {
    for (let [locationId, location] of Object.entries<LocationData>(sphere.locations)) {
      if (location.config.picture === null || !location.config.picture.length) {
        actions.push({type:"LOCATION_UPDATE_PICTURE", sphereId, locationId, data: {
          pictureSource: "STOCK",
          picture: randomImage(),
        }});
      }
      else if (location.config.pictureSource === null) {
        actions.push({type:"LOCATION_UPDATE_PICTURE", sphereId, locationId, data: {
          pictureSource: "CUSTOM",
        }});
      }
    }
  }

  core.store.batchDispatch(actions);
}


/**
 * Move the old fingerprints to the new dataformat and the new position in the database location tree.
 */
function migrateFingerprints() {
  let state = core.store.getState();
  let actions = [];

  let spheres = state.spheres;
  for (let [sphereId, sphere] of Object.entries<SphereData>(spheres)) {
    let locations = sphere.locations;
    for (let [locationId, location] of Object.entries<LocationData>(locations)) {
      // already migrated this one.
      if (Object.keys(location.fingerprints.raw).length !== 0) {
        continue;
      }

      let fingerprint = location.config.fingerprintRaw;

      if (fingerprint) {
        let newId = xUtil.getUUID();
        let crownstonesAtCreation = getCrownstonesAtCreation(fingerprint);
        let deviceType = getDeviceType(fingerprint);
        let data = getFingerprintData(fingerprint, location.config.fingerprintUpdatedAt);
        actions.push({type:"ADD_FINGERPRINT_V2", sphereId, locationId, fingerprintId: newId, data: {
          type: "IN_HAND",
          updatedAt: location.config.fingerprintUpdatedAt,
          createdAt: location.config.fingerprintUpdatedAt,
          crownstonesAtCreation: crownstonesAtCreation,
          createdOnDeviceType: deviceType,
          data: data
        }});

        // remove the old one.
        actions.push({type:"REMOVE_LOCATION_FINGERPRINT", sphereId, locationId});
      }
    }
  }

  core.store.batchDispatch(actions);
}


function getCrownstonesAtCreation(fingerprint) {
  if (typeof fingerprint === 'string') {
    fingerprint = JSON.parse(fingerprint);
  }

  let set = { };
  for (let measurement of fingerprint) {
    let data = []
    if (!measurement.devices) { continue; }

    for (let deviceId in measurement.devices) {
      let identifier = FingerprintUtil.getStoneIdentifierFromIBeaconString(deviceId);
      if (!identifier) { continue; }

      set[identifier] = true;
    }
  }

  return Object.keys(set);
}


function getDeviceType(fingerprint) {
  return null;
}

function getFingerprintData(fingerprint, updatedAt) {
  if (typeof fingerprint === 'string') {
    fingerprint = JSON.parse(fingerprint);
  }

  let startTime = new Date(updatedAt).valueOf();
  let set = [];
  let time = 0;
  for (let measurement of fingerprint) {
    let dt = 1000*time++;
    let data = []
    if (!measurement.devices) { continue; }

    for (let deviceId in measurement.devices) {
      let identifier = FingerprintUtil.getStoneIdentifierFromIBeaconString(deviceId);
      if (!identifier) { continue; }

      data.push({[identifier] : measurement.devices[deviceId]});
    }

    if (data.length > 0) {
      set.push({dt,data});
    }
  }
  return set;
}
