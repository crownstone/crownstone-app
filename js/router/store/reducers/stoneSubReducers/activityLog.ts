import { update, getTime, refreshDefaults } from '../reducerUtil'



let dataState = {
  switchedToState: null, // 0 .. 1 || -1
  type: null,            // "keepAliveState" || "keepAlive" || "multiswitch" || "tap2toggle",
  intent: null,          // manual, room enter, room exit, sphere enter, sphere exit, near, far, tap-to-toggle
  delayInCommand: 0,     // time in seconds.
  viaMesh: false,        // time in seconds.
  cloudId: null,
  userId: null,
  commandUuid: null,
  timestamp: 0
};

let logReducer = (state = dataState, action : any = {}) => {
  switch (action.type) {
    case "UPDATE_ACTIVITY_LOG_CLOUD_ID":
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'ADD_ACTIVITY_LOG':
      if (action.data) {
        let newState = {...state};
        newState.switchedToState = update( action.data.switchedToState, newState.switchedToState);
        newState.type            = update( action.data.type,            newState.type);
        newState.intent          = update( action.data.intent,          newState.intent);
        newState.cloudId         = update( action.data.cloudId,         newState.cloudId);
        newState.delayInCommand  = update( action.data.delayInCommand,  newState.delayInCommand);
        newState.viaMesh         = update( action.data.viaMesh,         newState.viaMesh);
        newState.userId          = update( action.data.userId,          newState.userId);
        newState.commandUuid     = update( action.data.commandUuid,     newState.commandUuid);
        newState.timestamp       = getTime( action.data.timestamp );
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, dataState);
    default:
      return state;
  }
};

// activityLogReducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'DELETE_ACTIVITY_LOG_CLOUD_IDS':
      let s = {...state};
      let k = Object.keys(s);
      for (let i = 0; i < k.length; i++) {
        s[k[i]].cloudId = null;
      }
      return s;
    case 'REMOVE_ALL_ACTIVITY_LOGS':
      return {};
    case 'REMOVE_ACTIVITY_LOG':
      let stateCopy = {...state};
      delete stateCopy[action.logId];
      return stateCopy;
    default:
      if (action.logId !== undefined) {
        if (state[action.logId] !== undefined || action.type === "ADD_ACTIVITY_LOG") {
          return {
            ...state,
            ...{[action.logId]: logReducer(state[action.logId], action)}
          };
        }
      }
      return state;
  }
};

