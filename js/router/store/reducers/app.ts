import { update, getTime, refreshDefaults } from './reducerUtil'

let defaultState = {
  activeSphere: null,
  notificationToken: null,
  enableLocalization: true,
  updatedAt: 1
};

// appReducer
export default (state = defaultState, action : any = {}) => {
  let newState;
  switch (action.type) {
    case 'SET_NOTIFICATION_TOKEN':
      if (action.data) {
        newState = {...state};
        newState.notificationToken      = update(action.data.notificationToken, newState.notificationToken);
        newState.updatedAt              = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'SET_ACTIVE_SPHERE':
      if (action.data) {
        newState = {...state};
        newState.activeSphere           = update(action.data.activeSphere, newState.activeSphere);
        newState.updatedAt              = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'CLEAR_ACTIVE_SPHERE':
      newState = {...state};
      newState.activeSphere = null;
      newState.updatedAt = getTime();
      return newState;
    case 'UPDATE_APP_STATE':
      if (action.data) {
        newState = {...state};
        newState.activeSphere        = update(action.data.activeSphere, newState.activeSphere);
        newState.enableLocalization  = update(action.data.enableLocalization,  newState.enableLocalization);
        newState.updatedAt           = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultState);
    default:
      return state;
  }
};
