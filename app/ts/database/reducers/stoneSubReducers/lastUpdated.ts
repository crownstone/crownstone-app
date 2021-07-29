import { getTime, refreshDefaults } from '../reducerUtil'



let dataState = {
  stoneTime: 0,
};

// lastUpdatedReducer
export default (state = dataState, action : any = {}) => {
  switch (action.type) {
    case 'UPDATED_STONE_TIME':
      let newState = {...state};
      newState.stoneTime = getTime();
      return newState;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, dataState);
    default:
      return state;
  }
};
