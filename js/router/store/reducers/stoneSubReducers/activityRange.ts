import { update, getTime, refreshDefaults } from '../reducerUtil'



let dataState = {
  switchedToState: null,  // 0 .. 1 || -1
  type:            null,  // "keepAliveState" || "keepAlive"
  startTime:       0,     // timestamp
  lastDirectTime:  null,  // timestamp
  lastMeshTime:    null,  // timestamp
  count:           0,     // amount of commands in this range
  delayInCommand:  0,     // delay in seconds
  userId:          null,
  cloudId:         null,
  updatedAt:       0,     // timestamp
};

let rangeReducer = (state = dataState, action : any = {}) => {
  switch (action.type) {
    case "UPDATE_ACTIVITY_RANGE_CLOUD_ID":
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'ADD_ACTIVITY_RANGE':
    case 'UPDATE_ACTIVITY_RANGE':
      if (action.data) {
        let newState = {...state};
        newState.switchedToState = update( action.data.switchedToState, newState.switchedToState);
        newState.type            = update( action.data.type,            newState.type);
        newState.startTime       = update( action.data.startTime,       newState.startTime);
        newState.lastDirectTime  = update( action.data.lastDirectTime,  newState.lastDirectTime);
        newState.lastMeshTime    = update( action.data.lastMeshTime,    newState.lastMeshTime);
        newState.count           = update( action.data.count,           newState.count);
        newState.delayInCommand  = update( action.data.delayInCommand,  newState.delayInCommand);
        newState.cloudId         = update( action.data.cloudId,         newState.cloudId);
        newState.userId          = update( action.data.userId,          newState.userId);
        newState.updatedAt       = getTime( action.data.updatedAt );
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, dataState);
    default:
      return state;
  }
};

// activityRangesReducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'DELETE_ACTIVITY_RANGE_CLOUD_IDS':
      let s = {...state};
      let k = Object.keys(s);
      for (let i = 0; i < k.length; i++) {
        s[k[i]].cloudId = null;
      }
      return s;
    case 'REMOVE_ALL_ACTIVITY_RANGES':
      return {};
    case 'REMOVE_ACTIVITY_RANGE':
      let stateCopy = {...state};
      delete stateCopy[action.rangeId];
      return stateCopy;
    default:
      if (action.rangeId !== undefined) {
        if (state[action.rangeId] !== undefined || action.type === "ADD_ACTIVITY_RANGE") {
          return {
            ...state,
            ...{[action.rangeId]: rangeReducer(state[action.rangeId], action)}
          };
        }
      }
      return state;
  }
};

