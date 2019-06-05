import { combineReducers } from 'redux'
import locationsReducer from './locations'
import sphereUserReducer from './sphereUser'
import stonesReducer from './stones'
import appliancesReducer from './appliances'
import messageReducer from './messages'
import thirdPartyReducer from './thirdParty'
import { update, getTime, refreshDefaults } from './reducerUtil'
import sphereKeyReducer from "./sphereKeys";

let defaultSettings = {
  config: {
    name: undefined,
    iBeaconUUID: undefined, // ibeacon uuid
    uid: null,
    adminKey: null,
    memberKey: null,
    guestKey: null,
    cloudId: null,
    meshAccessAddress: null,

    aiName: null,
    aiSex: null,
    exitDelay: 600,

    updatedAt: 1,
    lastSeen: 1,
  },
  layout: {
    floatingLocation: {
      x: null,
      y: null,
      setOnThisDevice: false,
      updatedAt: 0,
    }
  },
  state: {
    reachable: false,
    present: false,
    latitude: null,
    longitude: null,
    newMessageFound: false,
  },
  keys: {
    // these will be filled with an x number of keys used for encryption.
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
    case 'SET_SPHERE_KEYS':
      if (action.data) {
        let newState = {...state};
        newState.adminKey  = update(action.data.adminKey,  newState.adminKey);
        newState.memberKey = update(action.data.memberKey, newState.memberKey);
        newState.guestKey  = update(action.data.guestKey,  newState.guestKey);
        return newState;
      }
      return state;
    case 'ADD_SPHERE':
    case 'UPDATE_SPHERE_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.name        = update(action.data.name,        newState.name);
        newState.uid         = update(action.data.uid,         newState.uid);
        newState.aiName      = update(action.data.aiName,      newState.aiName);
        newState.aiSex       = update(action.data.aiSex,       newState.aiSex);
        newState.exitDelay   = update(action.data.exitDelay,   newState.exitDelay);
        newState.iBeaconUUID = update(action.data.iBeaconUUID, newState.iBeaconUUID);
        newState.adminKey    = update(action.data.adminKey,    newState.adminKey);
        newState.memberKey   = update(action.data.memberKey,   newState.memberKey);
        newState.guestKey    = update(action.data.guestKey,    newState.guestKey);
        newState.cloudId     = update(action.data.cloudId,     newState.cloudId);
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


let sphereStateReducer = (state = defaultSettings.state, action : any = {}) => {
  switch (action.type) {
    case 'RESET_SPHERE_STATE':
      if (action.data) {
        let newState = {...state};
        newState.reachable = update(action.data.reachable, newState.reachable);
        newState.present = update(action.data.present, newState.present);
        return newState;
      }
      return state;
    case 'SET_SPHERE_MESSAGE_STATE': {
      if (action.data) {
        let newState = {...state};
        newState.newMessageFound  = update(action.data.newMessageFound, newState.newMessageFound);
        return newState;
      }
      return state;
    }
    case 'SET_SPHERE_STATE':
      if (action.data) {
        let newState = {...state};

        newState.reachable = update(action.data.reachable, newState.reachable);
        newState.present = update(action.data.present, newState.present);

        return newState;
      }
      return state;
    case 'SET_SPHERE_GPS_COORDINATES':
      if (action.data) {
        let newState = {...state};

        newState.latitude = update(action.data.latitude, newState.latitude);
        newState.longitude = update(action.data.longitude, newState.longitude);

        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings.layout.floatingLocation);
    default:
      return state;
  }
};

let floatingLocationReducer = (state = defaultSettings.layout.floatingLocation, action : any = {}) => {
  switch (action.type) {
    case 'SET_FLOATING_LAYOUT_LOCATION':
      if (action.data) {
        let newState = {...state};
        newState.x = update(action.data.x, newState.x);
        newState.y = update(action.data.y, newState.y);
        newState.setOnThisDevice = update(action.data.setOnThisDevice, newState.setOnThisDevice);
        newState.updatedAt = getTime(action.data.timestamp || action.updatedAt);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings.layout.floatingLocation);
    default:
      return state;
  }
};

let layoutReducer = combineReducers({
  floatingLocation: floatingLocationReducer,
});


let combinedSphereReducer = combineReducers({
  config:     sphereConfigReducer,
  layout:     layoutReducer,
  users:      sphereUserReducer,
  locations:  locationsReducer,
  stones:     stonesReducer,
  messages:   messageReducer,
  appliances: appliancesReducer,
  state:      sphereStateReducer,
  thirdParty: thirdPartyReducer,
  keys:       sphereKeyReducer,
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

