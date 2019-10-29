import { update, refreshDefaults } from './reducerUtil'

let defaultState = {
  storeCrownstonesInCloud: false,
  sphereUsedForSetup: null,
  fastPhone: false,
};

// developmentReducer
export default (state = defaultState, action : any = {}) => {
  let newState;
  switch (action.type) {
    case 'DEV_USER_UPDATE':
      if (action.data) {
        newState = {...state};
        newState.storeCrownstonesInCloud = update(action.data.storeCrownstonesInCloud, newState.storeCrownstonesInCloud);
        newState.sphereUsedForSetup      = update(action.data.sphereUsedForSetup,      newState.sphereUsedForSetup);
        newState.fastPhone               = update(action.data.fastPhone,               newState.fastPhone);
        return newState;
      }
      return state;
    case 'REVERT_LOGGING_DETAILS':
      return { ...defaultState };
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultState);
    default:
      return state;
  }
};
