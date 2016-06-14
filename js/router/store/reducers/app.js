import { update, getTime } from './reducerUtil'

let defaultState = {
  app: {
    activeGroup: undefined,
    doFirstTimeSetup: true,
    updatedAt: 1
  }
};

// appReducer
export default (state = defaultState.app, action = {}) => {
  switch (action.type) {
    case 'SET_ACTIVE_GROUP':
      if (action.data) {
        let newState = {...state};
        newState.activeGroup = update(action.data.activeGroup, newState.activeGroup);
        newState.updatedAt   = getTime();
        return newState;
      }
      return state;
    case 'UPDATE_APP_STATE':
      if (action.data) {
        let newState = {...state};
        newState.activeGroup       = update(action.data.activeGroup, newState.activeGroup);
        newState.doFirstTimeSetup  = update(action.data.doFirstTimeSetup,  newState.doFirstTimeSetup);
        newState.updatedAt         = getTime();
        return newState;
      }
      return state;
    default:
      return state;
  }
};
