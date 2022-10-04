import { combineReducers } from 'redux'
import locationsReducer from './locations'
import sphereUserReducer from './sphereUser'
import stonesReducer from './stones'
import messageReducer from './messages'
import scenesReducer from './scenes'
import hubReducer from './hub'
import sortedListsReducer from './sortedLists'
import thirdPartyReducer from './thirdParty'
import { update, getTime, refreshDefaults, idReducerGenerator } from "./reducerUtil";
import sphereKeyReducer from "./sphereKeys";


let defaultSettings : SphereData = {
  id: undefined,
  config: {
    name: undefined,
    iBeaconUUID: undefined, // ibeacon uuid
    uid: null,
    cloudId: null,

    latitude: null,
    longitude: null,

    timezone: null,
    updatedAt: 1,
  },
  state: {
    lastPresentTime: 0,
    reachable: false,
    present: false,
    smartHomeEnabled: true,
  },
  keys: {
    // these will be filled with an x number of keys used for encryption.
  },
  features:    {},
  users:       {},
  locations:   {},
  stones:      {},
  scenes:      {},
  hubs:        {},
  messages:    {},
  thirdParty:  {},
  sortedLists: {},
};

let sphereConfigReducer = (state = defaultSettings.config, action : DatabaseAction = {}) => {
  switch (action.type) {
    case 'UPDATE_SPHERE_CLOUD_ID':
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'SET_SPHERE_GPS_COORDINATES':
      if (action.data) {
        let newState = {...state};

        newState.latitude  = update(action.data.latitude, newState.latitude);
        newState.longitude = update(action.data.longitude, newState.longitude);

        newState.updatedAt = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'SET_SPHERE_TIMEZONE':
      if (action.data) {
        let newState = {...state};
        newState.timezone = update(action.data.timezone, newState.timezone);
        newState.updatedAt   = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'ADD_SPHERE':
    case 'UPDATE_SPHERE_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.name        = update(action.data.name,        newState.name);
        newState.uid         = update(action.data.uid,         newState.uid);
        newState.iBeaconUUID = update(action.data.iBeaconUUID, newState.iBeaconUUID);
        newState.cloudId     = update(action.data.cloudId,     newState.cloudId);

        newState.latitude    = update(action.data.latitude, newState.latitude);
        newState.longitude   = update(action.data.longitude, newState.longitude);

        newState.updatedAt   = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      if (action.__sphereOnly === true) {
        return refreshDefaults(state, defaultSettings.config);
      }
    default:
      return state;
  }
};


let sphereStateReducer = (state = defaultSettings.state, action : DatabaseAction = {}) => {
  switch (action.type) {
    case 'RESET_SPHERE_PRESENCE_STATE':
      if (action.data) {
        let newState = {...state};
        newState.reachable = update(action.data.reachable, newState.reachable);
        newState.present = update(action.data.present, newState.present);
        return newState;
      }
      return state;
    case 'SET_SPHERE_SMART_HOME_STATE': {
      if (action.data) {
        let newState = {...state};
        newState.smartHomeEnabled  = update(action.data.smartHomeEnabled, newState.smartHomeEnabled);
        return newState;
      }
      return state;
    }
    case 'SET_SPHERE_STATE':
      if (action.data) {
        let newState = {...state};

        newState.smartHomeEnabled = update(action.data.smartHomeEnabled, newState.smartHomeEnabled);
        newState.reachable        = update(action.data.reachable, newState.reachable);
        newState.present          = update(action.data.present, newState.present);

        return newState;
      }
      return state;

    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings.state);
    default:
      return state;
  }
};


const featureDataReducer = (state : FeatureData = {enabled: false}, action : DatabaseAction = {}) => {
  switch (action.type) {
    case 'ADD_SPHERE_FEATURE':
    case 'UPDATE_SPHERE_FEATURE':
      if (action.data) {
        let newState = {...state};
        newState.enabled = update(action.data.enabled, newState.enabled);
        return newState;
      }
      return state;
    default:
      return state;
  }
}

const featureReducer = (state = defaultSettings.features, action : DatabaseAction = {}) => {
  switch (action.type) {
    case 'REMOVE_SPHERE_FEATURE':
      let newState = {...state};
      delete newState[action.featureId];
      return newState;
    default:
      if (action.featureId !== undefined) {
        if (state[action.featureId] !== undefined || action.type === "ADD_SPHERE_FEATURE") {
          return {
            ...state,
            ...{[action.featureId]: featureDataReducer(state[action.featureId], action)}
          };
        }
      }
      return state;
  }
};



let combinedSphereReducer = combineReducers({
  id:          idReducerGenerator("ADD_SPHERE", 'sphereId'),
  config:      sphereConfigReducer,
  users:       sphereUserReducer,
  locations:   locationsReducer,
  stones:      stonesReducer,
  scenes:      scenesReducer,
  hubs:        hubReducer,
  features:    featureReducer,
  messages:    messageReducer,
  state:       sphereStateReducer,
  thirdParty:  thirdPartyReducer,
  sortedLists: sortedListsReducer,
  keys:        sphereKeyReducer,
});

// spheresReducer
export default (state = {}, action : DatabaseAction = {}) => {
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

