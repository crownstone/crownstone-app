import { update } from './util'

let defaultState = {
  app: {
    activeGroup: undefined,
    doFirstTimeSetup: true,
  }
};

// appReducer
export default (state = defaultState.app, action = {}) => {
  switch (action.type) {
    case 'SET_ACTIVE_GROUP':
      if (action.data) {
        let newState = {...state};
        newState.activeGroup = update(action.data.activeGroup, newState.activeGroup);
        return newState;
      }
      return state;
    case 'UPDATE_APP_STATE':
      if (action.data) {
        let newState = {...state};
        newState.activeGroup       = update(action.data.activeGroup, newState.activeGroup);
        newState.doFirstTimeSetup  = update(action.data.doFirstTimeSetup,  newState.doFirstTimeSetup);
        return newState;
      }
      return state;
    default:
      return state;
  }
};
