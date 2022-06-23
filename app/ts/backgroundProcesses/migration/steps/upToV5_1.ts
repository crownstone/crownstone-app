import {core} from "../../../Core";
import {xUtil} from "../../../util/StandAloneUtil";
import {RoomStockBackground} from "../../../views/styles";

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

function migrateFingerprints() {
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
