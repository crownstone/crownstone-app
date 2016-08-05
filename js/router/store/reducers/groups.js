import { combineReducers } from 'redux'
import locationsReducer from './locations'
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
  },
  users: {
    firstName: undefined,
    lastName: undefined,
    email: undefined,
    emailVerified: false,
    picture: null,
    accessLevel: undefined, // 'admin', 'member', 'guest'
    updatedAt: 1
  }
};

let userReducer = (state = defaultSettings.users, action = {}) => {
  switch (action.type) {
    case 'ADD_USER':
    case 'UPDATE_USER':
      if (action.data) {
        let newState = {...state};
        newState.firstName     = update(action.data.firstName,     newState.firstName);
        newState.lastName      = update(action.data.lastName,      newState.lastName);
        newState.picture       = update(action.data.picture,       newState.picture);
        newState.email         = update(action.data.email,         newState.email);
        newState.emailVerified = update(action.data.emailVerified, newState.emailVerified);
        newState.accessLevel   = update(action.data.accessLevel,   newState.accessLevel);
        newState.updatedAt     = getTime();
        return newState;
      }
      return state;
    default:
      return state
  }
};

let usersReducer = (state = {}, action = {}) => {
  switch (action.type) {
    case 'REMOVE_USER':
      let newState = {...state};
      delete newState[action.userId];
      return newState;
    default:
      if (action.userId !== undefined) {
        return {
          ...state,
          ...{[action.userId]: userReducer(state[action.userId], action)}
        };
      }
      return state;
  }
};

let groupConfigReducer = (state = defaultSettings.config, action = {}) => {
  switch (action.type) {
    case 'ADD_GROUP':
    case 'UPDATE_GROUP':
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
  users:      usersReducer,
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

