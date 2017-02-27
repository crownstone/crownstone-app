import { update, getTime, refreshDefaults } from './reducerUtil'

let defaultSettings = {
  firstName: null,
  lastName: null,
  email: null,
  invitationPending: false,
  present: false,
  picture: null,
  accessLevel: undefined, // 'admin', 'member', 'guest'
  updatedAt: 1
};

let sphereUserReducer = (state = defaultSettings.users, action = {}) => {
  switch (action.type) {
    case 'USER_ENTER_SPHERE':
      let newState = {...state};
      newState.present = true;
      return newState;
    case 'USER_EXIT_SPHERE':
      newState = {...state};
      newState.present = false;
      return newState;
    case 'ADD_SPHERE_USER':
    case 'UPDATE_SPHERE_USER':
      if (action.data) {
        let newState = {...state};
        newState.firstName           = update(action.data.firstName,     newState.firstName);
        newState.lastName            = update(action.data.lastName,      newState.lastName);
        newState.picture             = update(action.data.picture,       newState.picture);
        newState.email               = update(action.data.email,         newState.email);
        newState.invitationPending   = update(action.data.invitationPending,   newState.invitationPending);
        newState.accessLevel         = update(action.data.accessLevel,   newState.accessLevel);
        newState.updatedAt           = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings);
    default:
      return state
  }
};

// sphereUserReducer
export default (state = {}, action = {}) => {
  switch (action.type) {
    case 'REMOVE_SPHERE_USER':
      let newState = {...state};
      delete newState[action.userId];
      return newState;
    default:
      if (action.userId !== undefined) {
        return {
          ...state,
          ...{[action.userId]: sphereUserReducer(state[action.userId], action)}
        };
      }
      return state;
  }
};