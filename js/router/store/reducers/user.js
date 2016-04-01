import { update } from './util'

let defaultSettings = {
  user: {
    name: undefined,
    tokens: [],
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
        newState.name    = update(action.data.name,    newState.name);
        newState.tokens  = update(action.data.tokens,  newState.tokens);
        newState.picture = update(action.data.picture, newState.picture);
        return newState;
      }
      return state;
    case 'USER_LOG_OUT':
      return {};
    default:
      return state;
  }
};
