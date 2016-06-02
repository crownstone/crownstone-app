import { combineReducers } from 'redux'
import locationsReducer from './locations'
import stonesReducer from './stones'
import appliancesReducer from './appliances'
import { update, getTime } from './reducerUtil'

let defaultSettings = {
  config: {
    name: undefined,
    uuid: undefined, // ibeacon uuid
    adminKey: null,
    memberKey: null,
    guestKey: null,
    updatedAt: getTime()
  },
  members: {
    firstName: undefined,
    lastName: undefined,
    picture: null,
    accessLevel: undefined,
    updatedAt: getTime()
  }
};

let memberReducer = (state = defaultSettings.members, action = {}) => {
  switch (action.type) {
    case 'ADD_MEMBER':
    case 'UPDATE_MEMBER':
      if (action.data) {
        let newState = {...state};
        newState.firstName = update(action.data.firstName, newState.firstName);
        newState.lastName = update(action.data.lastName, newState.lastName);
        newState.picture = update(action.data.picture, newState.picture);
        newState.level = update(action.data.level, newState.level);
        newState.updatedAt = getTime();
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
        newState.adminKey = update(action.data.adminKey, newState.adminKey);
        newState.memberKey = update(action.data.memberKey, newState.memberKey);
        newState.guestKey = update(action.data.guestKey, newState.guestKey);
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
  config:    groupConfigReducer,
  members:   membersReducer,
  presets:   presetsReducer,
  locations: locationsReducer,
  stones:    stonesReducer,
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

