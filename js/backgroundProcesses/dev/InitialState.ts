import { xUtil } from "../../util/StandAloneUtil";
import { core } from "../../core";
import { KEY_TYPES } from "../../Enums";
import { BroadcastStateManager } from "../BroadcastStateManager";


export const TESTING_SPHERE_NAME = "Dev app Sphere"

export const insertInitialState = function() {
  let state = core.store.getState();
  let spheres = state.spheres;
  let hasDevSphere = false;
  Object.keys(spheres).forEach((sphereId) => {
    if (spheres[sphereId].config.name === TESTING_SPHERE_NAME) {
      hasDevSphere = true;
    }
  })

  if (hasDevSphere) {
    setDefaultSessionData();
    return;
  }

  let actions = [];
  let sphereId = xUtil.getUUID();
  actions.push({type:"USER_LOG_IN", data: {
    isNew: false,
  }})

  actions.push({type:"ADD_SPHERE", sphereId: sphereId, data: {
    name: TESTING_SPHERE_NAME,
    iBeaconUUID: "1843423e-e175-4af0-a2e4-31e32f729a8a",
    uid: 1,
    meshAccessAddress: "4f745905",
  }})

  let insertKey = (key, type) => {
    actions.push({type:'ADD_SPHERE_KEY', sphereId: sphereId, keyId: xUtil.getUUID(), data: {
        key:       key,
        keyType:   type,
        createdAt: new Date().valueOf(),
        ttl:       0
      }})
  }

  insertKey("adminKeyForCrown", KEY_TYPES.ADMIN_KEY);
  insertKey("memberKeyForHome", KEY_TYPES.MEMBER_KEY);
  insertKey("guestKeyForOther", KEY_TYPES.BASIC_KEY);
  insertKey("localizationKeyX", KEY_TYPES.LOCALIZATION_KEY);
  insertKey("guestKeyForOther", KEY_TYPES.SERVICE_DATA_KEY);
  insertKey("meshKeyForStones", KEY_TYPES.MESH_NETWORK_KEY);
  insertKey("meshAppForStones", KEY_TYPES.MESH_APPLICATION_KEY);

  core.store.batchDispatch(actions);
  setDefaultSessionData();
}

export const setDefaultSessionData = function() {
  let state = core.store.getState();
  let spheres = state.spheres;
  Object.keys(spheres).forEach((sphereId) => {
    if (spheres[sphereId].config.name === TESTING_SPHERE_NAME) {
      if (state.user.sphereUsedForSetup === null) {
        core.store.dispatch({type:"USER_UPDATE", data: {sphereUsedForSetup : sphereId}})
      }

      BroadcastStateManager._updateLocationState(sphereId);
      BroadcastStateManager._reloadDevicePreferences();
    }
  })

}
