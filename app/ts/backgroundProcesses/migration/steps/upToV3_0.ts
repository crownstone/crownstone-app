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
          createdAt: Date.now(),
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


function clearHardwareVersions() {
  core.store.dispatch({
    type: "SET_NEW_FIRMWARE_VERSIONS",
    data: {
      bootloaderVersionsAvailable: {},
      firmwareVersionsAvailable: {},
    }
  });
}


export const upTo3_0 = function() {
  let state = core.store.getState();
  let appVersion = DeviceInfo.getReadableVersion();
  if (xUtil.versions.isLower(state.app.migratedDataToVersion, appVersion) || !state.app.migratedDataToVersion) {
    moveKeysInDatabase();
    clearHardwareVersions();
    core.store.dispatch({type: "UPDATE_APP_SETTINGS", data: {migratedDataToVersion: appVersion}});
  }
}
