import { core } from "../../../core";
import { xUtil } from "../../../util/StandAloneUtil";
import { KEY_TYPES } from "../../../Enums";
import { Permissions } from "../../PermissionManager";
import { DataUtil } from "../../../util/DataUtil";
import DeviceInfo from "react-native-device-info";


function moveKeysInDatabase() {
  let state = core.store.getState();
  let actions = [];
  Object.keys(state.spheres).forEach((sphereId) => {
    let inserted = false;
    let insertKey = (key, type) => {
      inserted = true;
      actions.push({type:'ADD_SPHERE_KEY', sphereId: sphereId, keyId: xUtil.getUUID(), data: {
          key:       key,
          keyType:   type,
          createdAt: new Date().valueOf(),
          ttl:       0
        }})
    }

    let sphere = state.spheres[sphereId];
    if (sphere.config.adminKey) {
      insertKey(sphere.config.adminKey, KEY_TYPES.ADMIN_KEY);
    }
    if (sphere.config.memberKey) {
      insertKey(sphere.config.memberKey, KEY_TYPES.MEMBER_KEY);
    }
    if (sphere.config.guestKey) {
      insertKey(sphere.config.guestKey, KEY_TYPES.BASIC_KEY);
      insertKey(sphere.config.guestKey, KEY_TYPES.SERVICE_DATA_KEY);
    }

    if (inserted) {
      actions.push({type:'UPDATE_SPHERE_CONFIG', sphereId: sphereId, data: {adminKey:null, memberKey: null, guestKey: null}});
    }
  });
  core.store.batchDispatch(actions);
}

function putDefaultRoomsInEmptySpheres() {
  let state = core.store.getState();
  let locationMap = {};
  let actions = [];
  Object.keys(state.spheres).forEach((sphereId) => {
    if (Object.keys(state.spheres[sphereId].locations).length === 0) {
      let localId = xUtil.getUUID();
      locationMap[sphereId] = localId;
      if (Permissions.inSphere(sphereId).addRoom) {
        actions.push({
          type:'ADD_LOCATION',
          sphereId: sphereId,
          locationId: localId,
          data: {name: "Living room", icon: "c1-tvSetup2"}
        });
      }
    }
  });
  core.store.batchDispatch(actions);
}


function setApplianceIconsInStone() {
  let state = core.store.getState();
  let actions = [];
  DataUtil.callOnAllStones(state, (sphereId, stoneId, stone) => {
    if (Permissions.inSphere(sphereId).editCrownstone) {
      // check if we have an appliance
      let name = stone.config.name;
      let icon = stone.config.icon;
      // if icon is not a default!!
      if (icon !== 'c2-pluginFilled' && icon !== 'c2-crownstone') {
        return;
      }
      if (stone.config.applianceId) {
        let appliance = state.spheres[sphereId].appliances[stone.config.applianceId];
        if (appliance) {
          let applianceName = appliance.config.name;
          let applianceIcon = appliance.config.icon;
          if (name !== applianceName || icon !== applianceIcon) {
            actions.push({
              type: "UPDATE_STONE_CONFIG",
              sphereId: sphereId,
              stoneId: stoneId,
              data: {
                name: appliance.config.name || name,
                icon: appliance.config.icon || icon,
                applianceId: null,
              }
            });
          }
        }
      }
    }
  });
  core.store.batchDispatch(actions);
}


export const upTo3_0 = function() {
  let state = core.store.getState();
  let appVersion = DeviceInfo.getReadableVersion();
  if (xUtil.versions.isLower(state.app.migratedDataToVersion, appVersion) || !state.app.migratedDataToVersion) {
    moveKeysInDatabase();
    putDefaultRoomsInEmptySpheres();
    setApplianceIconsInStone();
    core.store.dispatch({type: "UPDATE_APP_SETTINGS", data: {migratedDataToVersion: appVersion}});
  }
}
