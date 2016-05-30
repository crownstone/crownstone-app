import { update, getTime } from './reducerUtil'

let defaultSettings = {
  user: {
    firstName: undefined,
    lastName: undefined,
    email: undefined,
    passwordHash: undefined,
    accessToken: undefined,
    userId: undefined,
    picture: null,
    updatedAt: getTime()
  },
};

// userReducer
export default (state = defaultSettings.user, action = {}) => {
  switch (action.type) {
    case 'USER_LOG_IN':
    case 'USER_UPDATE':
    case 'USER_APPEND': // append means filling in the data without updating the cloud.
      if (action.data) {
        let newState = {...state};
        newState.firstName   = update(action.data.firstName,    newState.firstName);
        newState.lastName    = update(action.data.lastName,     newState.lastName);
        newState.email       = update(action.data.email,        newState.email);
        newState.accessToken = update(action.data.accessToken,  newState.accessToken);
        newState.passwordHash = update(action.data.passwordHash,  newState.passwordHash);
        newState.userId      = update(action.data.userId,       newState.userId);
        newState.picture     = update(action.data.picture,      newState.picture);
        newState.updatedAt   = getTime();
        return newState;
      }
      return state;
    default:
      return state;
  }
};
