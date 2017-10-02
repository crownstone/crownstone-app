import { combineReducers } from 'redux'
import locationsReducer from './locations'
import sphereUserReducer from './sphereUser'
import stonesReducer from './stones'
import appliancesReducer from './appliances'
import messageReducer from './messages'
import { update, getTime, refreshDefaults } from './reducerUtil'


let defaultSettings = {
  config: {
    name: undefined,
    iBeaconUUID: undefined, // ibeacon uuid
    adminKey: null,
    memberKey: null,
    guestKey: null,
    cloudId: null,
    meshAccessAddress: null,
    reachable: false,
    present: false,
    aiName: undefined,
    aiSex: undefined,
    exitDelay: 600,
    latitude: null,
    longitude: null,
    updatedAt: 1,
    lastSeen: 1,
  }
};

let sphereConfigReducer = (state = defaultSettings.config, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_SPHERE_CLOUD_ID':
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'UPDATE_STONE_RSSI':
      // update the time this user has seen the sphere last.
      let newState = {...state};
      newState.lastSeen = getTime(action && action.data && action.data.lastSeen);
      return newState;
    case 'SET_SPHERE_STATE':
      if (action.data) {
        let newState = {...state};

        newState.reachable = update(action.data.reachable, newState.reachable);
        newState.present = update(action.data.present, newState.present);

        return newState;
      }
      return state;
    case 'RESET_SPHERE_STATE':
      if (action.data) {
        let newState = {...state};
        newState.reachable = update(action.data.reachable, newState.reachable);
        newState.present = update(action.data.present, newState.present);

        return newState;
      }
      return state;
    case 'SET_SPHERE_KEYS':
      if (action.data) {
        let newState = {...state};
        newState.adminKey  = update(action.data.adminKey, newState.adminKey);
        newState.memberKey = update(action.data.memberKey, newState.memberKey);
        newState.guestKey  = update(action.data.guestKey, newState.guestKey);
        return newState;
      }
      return state;
    case 'ADD_SPHERE':
    case 'UPDATE_SPHERE_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.name        = update(action.data.name,      newState.name);
        newState.aiName      = update(action.data.aiName,    newState.aiName);
        newState.aiSex       = update(action.data.aiSex,     newState.aiSex);
        newState.latitude    = update(action.data.latitude,  newState.latitude);
        newState.longitude   = update(action.data.longitude, newState.longitude);
        newState.exitDelay   = update(action.data.exitDelay, newState.exitDelay);
        newState.iBeaconUUID = update(action.data.iBeaconUUID, newState.iBeaconUUID);
        newState.adminKey    = update(action.data.adminKey,  newState.adminKey);
        newState.memberKey   = update(action.data.memberKey, newState.memberKey);
        newState.guestKey    = update(action.data.guestKey,  newState.guestKey);
        newState.cloudId     = update(action.data.cloudId,  newState.cloudId);
        newState.meshAccessAddress = update(action.data.meshAccessAddress, newState.meshAccessAddress);
        newState.updatedAt   = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      if (action.sphereOnly === true) {
        return refreshDefaults(state, defaultSettings.config);
      }
    default:
      return state;
  }
};

let presetsReducer = (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REFRESH_DEFAULTS':
      if (Array.isArray(state)) {
        return {}
      }
    default:
      return state;
  }
};

let combinedSphereReducer = combineReducers({
  config:     sphereConfigReducer,
  users:      sphereUserReducer,
  presets:    presetsReducer,
  locations:  locationsReducer,
  stones:     stonesReducer,
  messages:   messageReducer,
  appliances: appliancesReducer
});

// spheresReducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_SPHERE':
      let newState = {...state};
      delete newState[action.sphereId];
      return newState;
    default:
      if (action.sphereId !== undefined) {
        if (state[action.sphereId] !== undefined || action.type === "ADD_SPHERE") {
          return {
            ...state,
            ...{[action.sphereId]: combinedSphereReducer(state[action.sphereId], action)}
          };
        }
      }
      return state;
  }
};

