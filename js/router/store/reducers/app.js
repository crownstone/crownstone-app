import { update } from './util'

let defaultState = {
  app: {
    activeGroup: 'Home',
    doFirstTimeSetup: true,
  }
};

// appReducer
export default (state = defaultState.app, action = {}) => {
  switch (action.type) {
    case 'APP_UPDATE': // append means filling in the data without updating the cloud.
      if (action.data) {
        let newState = {...state};
        newState.activeGroup = update(action.data.activeGroup, newState.activeGroup);
        newState.doFirstTimeSetup  = update(action.data.doFirstTimeSetup,  newState.doFirstTimeSetup);
        return newState;
      }
      return state;
    default:
      return state;
  }
};
