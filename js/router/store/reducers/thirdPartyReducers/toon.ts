import {getTime, refreshDefaults, update} from "../reducerUtil";
import {Util} from "../../../../util/Util";

let defaultSettings = {
  accessToken: null,
  accessTokenExpires: null,
  refreshToken: null,
  toonAgreementId: null,
  schedule: "",
  scheduleUpdatedAt: 0,
  updatedAt: 0,
  enabled: false
};


// toonReducer
export default (state = defaultSettings, action : any = {}) => {
  switch (action.type) {
    case 'TOON_ADD_TOKEN':
      if (action.data) {
        let newState = {...state};
        newState.accessToken         = update(action.data.accessToken,         newState.accessToken);
        newState.accessTokenExpires  = update(action.data.accessTokenExpires,  newState.accessTokenExpires);
        newState.refreshToken        = update(action.data.refreshToken,        newState.refreshToken);
        newState.updatedAt           = getTime(action.data.timestamp || action.updatedAt);
        newState.enabled  = true;
        return newState;
      }
      return state;
    case 'TOON_UPDATE_TOKEN':
      if (action.data) {
        let newState = {...state};
        newState.accessToken         = update(action.data.accessToken,         newState.accessToken);
        newState.accessTokenExpires  = update(action.data.accessTokenExpires,  newState.accessTokenExpires);
        newState.refreshToken        = update(action.data.refreshToken,        newState.refreshToken);
        newState.updatedAt           = getTime(action.data.timestamp || action.updatedAt);
        return newState;
      }
      return state;
    case 'TOON_UPDATE_SETTINGS':
      if (action.data) {
        let newState = {...state};
        newState.enabled            = update(action.data.enabled,         newState.enabled);
        newState.toonAgreementId    = update(action.data.toonAgreementId, newState.toonAgreementId);
        newState.schedule           = update(action.data.schedule,        newState.schedule);
        newState.scheduleUpdatedAt  = update(action.data.scheduleUpdatedAt,  newState.scheduleUpdatedAt);
        return newState;
      }
      return state;
    case 'TOON_DISABLE_TOON':
      return {...defaultSettings};
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings);
    default:
      return state;
  }
};

