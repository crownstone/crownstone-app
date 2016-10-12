import { update, getTime } from './reducerUtil'

let defaultState = {
  app: {
    activeSphere: null,
    remoteSphere: null,
    previouslyActiveSphere: null,
    enableLocalization: true,
    doFirstTimeSetup: true,
    updatedAt: 1
  }
};

// appReducer
export default (state = defaultState.app, action = {}) => {
  let newState;
  switch (action.type) {
    case 'SET_ACTIVE_SPHERE':
      if (action.data) {
        newState = {...state};
        newState.activeSphere           = update(action.data.activeSphere, newState.activeSphere);
        newState.previouslyActiveSphere = update(action.data.activeSphere, newState.activeSphere);
        newState.updatedAt              = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'SET_REMOTE_SPHERE':
      if (action.data) {
        newState = {...state};
        newState.remoteSphere = update(action.data.remoteSphere, newState.remoteSphere);
        newState.updatedAt    = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'CLEAR_ACTIVE_SPHERE':
      newState = {...state};
      newState.activeSphere = null;
      newState.updatedAt   = getTime();
      return newState;
    case 'CLEAR_PREVIOUSLY_ACTIVE_SPHERE':
      newState = {...state};
      newState.previouslyActiveSphere = null;
      newState.updatedAt   = getTime();
      return newState;
    case 'CLEAR_REMOTE_SPHERE':
      newState = {...state};
      newState.remoteSphere = null;
      newState.updatedAt   = getTime();
      return newState;
    case 'UPDATE_APP_STATE':
      if (action.data) {
        newState = {...state};
        newState.activeSphere        = update(action.data.activeSphere, newState.activeSphere);
        newState.doFirstTimeSetup    = update(action.data.doFirstTimeSetup,  newState.doFirstTimeSetup);
        newState.enableLocalization  = update(action.data.enableLocalization,  newState.enableLocalization);
        newState.updatedAt           = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    default:
      return state;
  }
};
