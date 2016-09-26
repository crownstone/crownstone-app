import { update, getTime } from './reducerUtil'

let defaultState = {
  app: {
    activeSphere: null,
    enableLocalization: true,
    doFirstTimeSetup: true,
    updatedAt: 1
  }
};

// appReducer
export default (state = defaultState.app, action = {}) => {
  switch (action.type) {
    case 'SET_ACTIVE_SPHERE':
      if (action.data) {
        let newState = {...state};
        newState.activeSphere = update(action.data.activeSphere, newState.activeSphere);
        newState.updatedAt    = getTime();
        return newState;
      }
      return state;
    case 'CLEAR_ACTIVE_SPHERE':
      let newState = {...state};
      newState.activeSphere = null;
      newState.updatedAt   = getTime();
      return newState;
    case 'UPDATE_APP_STATE':
      if (action.data) {
        let newState = {...state};
        newState.activeSphere       = update(action.data.activeSphere, newState.activeSphere);
        newState.doFirstTimeSetup   = update(action.data.doFirstTimeSetup,  newState.doFirstTimeSetup);
        newState.enableLocalization = update(action.data.enableLocalization,  newState.enableLocalization);
        newState.updatedAt          = getTime();
        return newState;
      }
      return state;
    default:
      return state;
  }
};
