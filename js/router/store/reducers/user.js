import { update } from './util'

let defaultSettings = {
  user: {
    firstName: undefined,
    lastName: undefined,
    email: undefined,
    tokens: [],
    userId: [],
    picture: undefined
  }
};

// userReducer
export default (state = defaultSettings.user, action = {}) => {
  switch (action.type) {
    case 'USER_LOG_IN':
    case 'USER_LOG_UPDATE':
      if (action.data) {
        let newState = {...state};
        newState.firstName = update(action.data.firstName, newState.firstName);
        newState.lastName  = update(action.data.lastName,  newState.lastName);
        newState.email   = update(action.data.email,   newState.email);
        newState.tokens  = update(action.data.tokens,  newState.tokens);
        newState.userId  = update(action.data.userId,  newState.userId);
        newState.picture = update(action.data.picture, newState.picture);
        return newState;
      }
      return state;
    default:
      return state;
  }
};
