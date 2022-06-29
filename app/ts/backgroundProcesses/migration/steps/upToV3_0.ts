import { core } from "../../../Core";
import { xUtil } from "../../../util/StandAloneUtil";
import { KEY_TYPES } from "../../../Enums";


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

    let sphere : any = state.spheres[sphereId];
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


export const upTo3_0 = function(lastMigrationVersion, appVersion) {
  if (xUtil.versions.isLower(lastMigrationVersion, appVersion, 4) || !lastMigrationVersion) {
    moveKeysInDatabase();
    clearHardwareVersions();
    core.store.dispatch({type: "UPDATE_APP_SETTINGS", data: {migratedDataToVersion: appVersion}});
  }
}
