import { combineReducers } from 'redux'
import locationsReducer from './locations'
import groupUserReducer from './groupUser'
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
    updatedAt: 1
  }
};

let groupConfigReducer = (state = defaultSettings.config, action = {}) => {
  switch (action.type) {
    case 'SET_GROUP_KEYS':
      if (action.data) {
        let newState = {...state};
        newState.adminKey = update(action.data.adminKey, newState.adminKey);
        newState.memberKey = update(action.data.memberKey, newState.memberKey);
        newState.guestKey = update(action.data.guestKey, newState.guestKey);
        return newState;
      }
      return state;
    case 'ADD_GROUP':
    case 'UPDATE_GROUP_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.name = update(action.data.name, newState.name);
        newState.iBeaconUUID = update(action.data.iBeaconUUID, newState.iBeaconUUID);
        newState.adminKey = update(action.data.adminKey, newState.adminKey);
        newState.memberKey = update(action.data.memberKey, newState.memberKey);
        newState.guestKey = update(action.data.guestKey, newState.guestKey);
        newState.meshAccessAddress = update(action.data.meshAccessAddress, newState.meshAccessAddress);
        newState.updatedAt = getTime();
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

let combinedGroupReducer = combineReducers({
  config:     groupConfigReducer,
  users:      groupUserReducer,
  presets:    presetsReducer,
  locations:  locationsReducer,
  stones:     stonesReducer,
  appliances: appliancesReducer
});

// groupsReducer
export default (state = {}, action = {}) => {
  switch (action.type) {
    case 'REMOVE_GROUP':
      let newState = {...state};
      delete newState[action.groupId];
      return newState;
    default:
      if (action.groupId !== undefined) {
        return {
          ...state,
          ...{[action.groupId]:combinedGroupReducer(state[action.groupId], action)}
        };
      }
      return state;
  }
};

