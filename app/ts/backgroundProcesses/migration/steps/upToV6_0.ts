import {core} from "../../../Core";
import {xUtil} from "../../../util/StandAloneUtil";
import {RoomStockBackground} from "../../../views/styles";
import { FingerprintUtil } from "../../../util/FingerprintUtil";
import { StoreManager } from "../../../database/storeManager";
import {ABILITY_PROPERTY_TYPE_ID} from "../../../database/reducers/stoneSubReducers/abilities";

export const clean_upTo6_0 = async function() {
  return StoreManager.persistor.destroyDataFields([{spheres: { _id_ : {"thirdParty": "hue"}}}], "MIGRATED_6.0")
  return StoreManager.persistor.destroyDataFields([{spheres: { _id_ : "messages"}}], "MIGRATED_6.0")
}

export const upTo6_0 = function(lastMigrationVersion, appVersion) {
  if (xUtil.versions.isLower(lastMigrationVersion, appVersion, 4) || !lastMigrationVersion) {
    loadRoomStockImages();
    migrateFingerprints();
    migrateAbilityProperties();
    // migrateMessages();
    core.store.dispatch({type: "UPDATE_APP_SETTINGS", data: {migratedDataToVersion: appVersion}});
  }
}

function migrateAbilityProperties() {
  let state = core.store.getState();
  let actions : DatabaseAction[] = [];

  for (let [sphereId, sphere] of Object.entries<SphereData>(state.spheres)) {
    for (let [stoneId, stone] of Object.entries<StoneData>(sphere.stones)) {
      actions.push({type:"ADD_ABILITY_PROPERTY", sphereId, stoneId, abilityId:'switchcraft', propertyId: ABILITY_PROPERTY_TYPE_ID.doubleTapSwitchcraft,
        data: {type:ABILITY_PROPERTY_TYPE_ID.doubleTapSwitchcraft, value: false, valueTarget: false,  syncedToCrownstone: true, updatedAt: Date.now()}
      });
      actions.push({type:"ADD_ABILITY_PROPERTY", sphereId, stoneId, abilityId:'switchcraft', propertyId: ABILITY_PROPERTY_TYPE_ID.defaultDimValue,
        data: {type:ABILITY_PROPERTY_TYPE_ID.defaultDimValue, value: 40, valueTarget: 40,  syncedToCrownstone: true, updatedAt: Date.now()}
      });
    }
  }

  core.store.batchDispatch(actions);
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
        let crownstonesAtCreation = getCrownstonesAtCreation(sphere);
        let data = getFingerprintData(fingerprint);
        actions.push({type:"ADD_FINGERPRINT_V2", sphereId, locationId, fingerprintId: newId, data: {
          type: "IN_HAND",
          __purelyLocal: true, // this is here to avoid uploading it to the cloud.
          updatedAt: location.config.fingerprintUpdatedAt,
          createdAt: location.config.fingerprintUpdatedAt,
          crownstonesAtCreation: crownstonesAtCreation,
          createdOnDeviceType: null,
          createdByUser:       null,
          data: data
        }});

        // remove the old one.
        actions.push({type:"REMOVE_LOCATION_FINGERPRINT", sphereId, locationId});
      }
    }
  }

  core.store.batchDispatch(actions);
}


function getCrownstonesAtCreation(sphere: SphereData) {
  let result = {};
  for (let stoneId in sphere.stones) {
    let stone = sphere.stones[stoneId];
    result[FingerprintUtil.getStoneIdentifierFromStone(stone)] = true;
  }
  return result;
}


function getFingerprintData(fingerprint) {
  if (typeof fingerprint === 'string') {
    fingerprint = JSON.parse(fingerprint);
  }

  let set = [];
  let time = 0;
  for (let measurement of fingerprint) {
    let dt = 1000*time++;
    let data = { };
    if (!measurement.devices) { continue; }

    let hasData = false;
    for (let deviceId in measurement.devices) {
      let identifier = FingerprintUtil.getStoneIdentifierFromIBeaconString(deviceId);
      if (!identifier) { continue; }

      data[identifier] = measurement.devices[deviceId];
      hasData = true;
    }

    if (hasData) {
      set.push({dt,data});
    }
  }
  return set;
}
