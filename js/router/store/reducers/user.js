import { update } from './util'

let defaultSettings = {
  user: {
    firstName: undefined,
    lastName: undefined,
    email: undefined,
    accessToken: undefined,
    userId: undefined,
    picture: null
  },
  groupKeys: {}
};

let groupKeyReducer = (state = defaultSettings.groupKeys, action = {}) => {
  switch (action.type) {
    case 'ADD_GROUP_KEY':
      if (action.data && action.data.groupId) {
        let newState = {...state};
        if (newState[action.data.groupId] === undefined)
          newState[action.data.groupId] = {owner:undefined, user:undefined, guest:undefined};
        newState[action.data.groupId].owner = update(action.data.ownerKey, newState[action.data.groupId].owner);
        newState[action.data.groupId].user  = update(action.data.userKey , newState[action.data.groupId].user );
        newState[action.data.groupId].guest = update(action.data.guestKey, newState[action.data.groupId].guest);
        return newState;
      }
      return state;
    case 'REMOVE_GROUP_OWNER_KEY':
      if (action.data && action.data.groupId && state[action.data.groupId]) {
        let newState = {...state};
        newState[action.data.groupId].owner = undefined;
        return newState;
      }
      return state;
    case 'REMOVE_GROUP_USER_KEY':
      if (action.data && action.data.groupId && state[action.data.groupId]) {
        let newState = {...state};
        newState[action.data.groupId].user = undefined;
        return newState;
      }
      return state;
    case 'REMOVE_GROUP_GUEST_KEY':
      if (action.data && action.data.groupId && state[action.data.groupId]) {
        let newState = {...state};
        newState[action.data.groupId].guest = undefined;
        return newState;
      }
      return state;
    case 'REMOVE_GROUP_AUTHORIZATION':
      if (action.data && action.data.groupId && state[action.data.groupId]) {
        let newState = {...state};
        delete newState[action.data.groupId];
        return newState;
      }
      return state;
    default:
      return state;
  }
};

// userReducer
export default (state = defaultSettings.user, action = {}) => {
  switch (action.type) {
    case 'USER_LOG_IN':
    case 'USER_UPDATE':
    case 'USER_APPEND': // append means filling in the data without updating the cloud.
      if (action.data) {
        let newState = {...state};
        newState.firstName   = update(action.data.firstName, newState.firstName);
        newState.lastName    = update(action.data.lastName,  newState.lastName);
        newState.email       = update(action.data.email,   newState.email);
        newState.accessToken = update(action.data._accessToken,  newState.tokens);
        newState.userId      = update(action.data._userId,  newState._userId);
        newState.picture     = update(action.data.picture, newState.picture);
        newState.groupKeys   = groupKeyReducer(state.groupKeys, action);
        return newState;
      }
      return state;
    default:
      return state;
  }
};
