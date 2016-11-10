import { update, getTime } from './reducerUtil'

let defaultSettings = {
  user: {
    firstName: null,
    lastName: null,
    email: null,
    accessToken: null,
    passwordHash: null,
    userId: null,
    isNew: true,
    picture: null,
    updatedAt: 1
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
        newState.firstName    = update(action.data.firstName,    newState.firstName);
        newState.lastName     = update(action.data.lastName,     newState.lastName);
        newState.email        = update(action.data.email,        newState.email);
        newState.passwordHash = update(action.data.passwordHash, newState.passwordHash);
        newState.isNew        = update(action.data.isNew,        newState.isNew);
        newState.accessToken  = update(action.data.accessToken,  newState.accessToken);
        newState.userId       = update(action.data.userId,       newState.userId);
        newState.picture      = update(action.data.picture,      newState.picture);
        newState.updatedAt    = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    default:
      return state;
  }
};
