import { combineReducers } from 'redux'
import locationsReducer from './locations'
import sphereUserReducer from './sphereUser'
import stonesReducer from './stones'
import appliancesReducer from './appliances'
import { update, getTime } from './reducerUtil'

let defaultSettings = {
  config: {
    name: undefined,
    iBeaconUUID: undefined, // ibeacon uuid
    adminKey: null,
    memberKey: null,
    guestKey: null,
    meshAccessAddress: null,
    reachable: false,
    present: false,
    updatedAt: 1
  }
};

let sphereConfigReducer = (state = defaultSettings.config, action = {}) => {
  switch (action.type) {
    case 'SET_SPHERE_STATE':
      if (action.data) {
        let newState = {...state};
        newState.reachable  = update(action.data.reachable, newState.reachable);
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
        newState.name        = update(action.data.name, newState.name);
        newState.iBeaconUUID = update(action.data.iBeaconUUID, newState.iBeaconUUID);
        newState.adminKey    = update(action.data.adminKey, newState.adminKey);
        newState.memberKey   = update(action.data.memberKey, newState.memberKey);
        newState.guestKey    = update(action.data.guestKey, newState.guestKey);
        newState.meshAccessAddress = update(action.data.meshAccessAddress, newState.meshAccessAddress);
        newState.updatedAt   = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    default:
      return state;
  }
};

let presetsReducer = (state = [], action = {}) => {
  switch (action.type) {
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
  appliances: appliancesReducer
});

// spheresReducer
export default (state = {}, action = {}) => {
  switch (action.type) {
    case 'REMOVE_SPHERE':
      let newState = {...state};
      delete newState[action.sphereId];
      return newState;
    default:
      if (action.sphereId !== undefined) {
        return {
          ...state,
          ...{[action.sphereId]:combinedSphereReducer(state[action.sphereId], action)}
        };
      }
      return state;
  }
};

