import {getTime, refreshDefaults, update} from "../reducerUtil";
import {Util} from "../../../../util/Util";

let defaultSettings = {
  accessToken: null,
  refreshToken: null,
  schedule: "",
  updatedAt: 0
};


// toonReducer
export default (state = defaultSettings, action : any = {}) => {
  switch (action.type) {
    case 'ADD_TOKEN':
    case 'UPDATE_TOKEN':
      if (action.data) {
        let newState = {...state};
        newState.accessToken  = update(action.data.accessToken,  newState.accessToken);
        newState.refreshToken = update(action.data.refreshToken, newState.refreshToken);
        newState.schedule     = update(action.data.schedule,     newState.schedule);
        newState.updatedAt    = getTime(action.data.timestamp || action.updatedAt);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings);
    default:
      return state;
  }
};

