import { StoreManager } from "../../../database/storeManager";
import { core } from "../../../Core";
import DeviceInfo from "react-native-device-info";
import { xUtil } from "../../../util/StandAloneUtil";

export const clean_upTo4_4 = function() {
  return StoreManager.persistor.destroyDataFields([{spheres: { _id_ : "layout"}}], "MIGRATED_4.4")
}

export const upTo4_4 = function() {
  let state = core.store.getState();
  let appVersion = DeviceInfo.getReadableVersion();
  if (xUtil.versions.isLower(state.app.migratedDataToVersion, appVersion) || !state.app.migratedDataToVersion) {
    addIds();
    core.store.dispatch({type: "UPDATE_APP_SETTINGS", data: {migratedDataToVersion: appVersion}});
  }
}

function addIds() {
  let state = core.store.getState();
  let actions = [];

  // all devices
  // all events
  // all installations
  // all spheres
      // all sphereUsers
      // all locations
      // all stones
        // all rules
        // all keys
    // all scenes
    // all hubs
    // all messages
    // all sortedLists
    // all keys


  for (let id in state.devices) {
    actions.push({type:"INJECT_IDS", deviceId: id})
  }
  for (let id in state.events) {
    actions.push({type:"INJECT_IDS", id: id})
  }
  for (let id in state.installations) {
    actions.push({type:"INJECT_IDS", installationId: id})
  }
  for (let [sphereId, sphere] of Object.entries<SphereData>(state.spheres)) {
    actions.push({type:"INJECT_IDS", sphereId: sphereId})
    for (let id in sphere.users) {
      actions.push({type:"INJECT_IDS", sphereId, userId: id})
    }
    for (let id in sphere.locations) {
      actions.push({type:"INJECT_IDS", sphereId, locationId: id})
    }
    for (let id in sphere.scenes) {
      actions.push({type:"INJECT_IDS", sphereId, sceneId: id})
    }
    for (let id in sphere.hubs) {
      actions.push({type:"INJECT_IDS", sphereId, hubId: id})
    }
    for (let id in sphere.messages) {
      actions.push({type:"INJECT_IDS", sphereId, messageId: id})
    }
    for (let id in sphere.sortedLists) {
      actions.push({type:"INJECT_IDS", sphereId, sortedListId: id})
    }
    for (let id in sphere.keys) {
      actions.push({type:"INJECT_IDS", sphereId, keyId: id})
    }

    for (let [stoneId, stone] of Object.entries<StoneData>(sphere.stones)) {
      actions.push({type:"INJECT_IDS", sphereId, stoneId})
      for (let id in stone.rules) {
        actions.push({type:"INJECT_IDS", sphereId, stoneId, ruleId: id})
      }
      for (let id in stone.keys) {
        actions.push({type:"INJECT_IDS", sphereId, stoneId, keyId: id})
      }
    }
  }

  core.store.batchDispatch(actions);
}