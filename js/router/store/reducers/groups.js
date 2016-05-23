import { combineReducers } from 'redux'
import locationsReducer from './locations'
import stonesReducer from './stones'
import { update } from './util'

let defaultSettings = {
  config: {
    name: undefined,
    uuid: undefined, // ibeacon uuid
    ownerKey: null,
    userKey: null,
    guestKey: null,
  },
  member: {
    firstName: undefined,
    lastName: undefined,
    picture: null,
    accessLevel: undefined
  }
};

let memberReducer = (state = defaultSettings.member, action = {}) => {
  switch (action.type) {
    case 'ADD_MEMBER':
    case 'UPDATE_MEMBER':
      if (action.data) {
        let newState = {...state};
        newState.firstName = update(action.data.firstName, newState.firstName);
        newState.lastName = update(action.data.lastName, newState.lastName);
        newState.picture = update(action.data.picture, newState.picture);
        newState.level = update(action.data.level, newState.level);
        return newState;
      }
      return state;
    default:
      return state
  }
};

let membersReducer = (state = {}, action = {}) => {
  switch (action.type) {
    case 'REMOVE_MEMBER':
      let newState = {...state};
      delete newState[action.memberId];
      return newState;
    default:
      if (action.memberId !== undefined) {
        return {
          ...state,
          ...{[action.memberId]:memberReducer(state[action.memberId], action)}
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
        newState.uuid = update(action.data.uuid, newState.uuid);
        newState.ownerKey = update(action.data.ownerKey, newState.ownerKey);
        newState.userKey = update(action.data.userKey, newState.userKey);
        newState.guestKey = update(action.data.guestKey, newState.guestKey);
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
  config:    groupConfigReducer,
  members:   membersReducer,
  presets:   presetsReducer,
  locations: locationsReducer,
  stones:    stonesReducer
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

