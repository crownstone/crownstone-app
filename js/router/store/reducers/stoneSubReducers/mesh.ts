import { update, getTime, refreshDefaults } from '../reducerUtil'

let dataState = {
  rssi: null,
  timestamp: 0
};

let meshReducer = (state = dataState, action : any = {}) => {
  switch (action.type) {
    case 'SET_MESH_INDICATOR':
      if (action.data) {
        let newState = {...state};
        newState.rssi      = update( action.data.rssi,   newState.rssi);
        newState.timestamp = getTime(action.data.timestamp || action.updatedAt);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, dataState);
    default:
      return state;
  }
};

// meshReducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'CLEAR_MESH_TOPOLOGY':
      return {};
    default:
      if (action.nodeId !== undefined) {
        if (state[action.nodeId] !== undefined || action.type === "SET_MESH_INDICATOR") {
          return {
            ...state,
            ...{[action.nodeId]: meshReducer(state[action.nodeId], action)}
          };
        }
      }
      return state;
  }
};

