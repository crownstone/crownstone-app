import {getTime, refreshDefaults, update} from "../reducerUtil";
import {Util} from "../../../../util/Util";

let defaultSettings = {
  toonAgreementId: null,
  toonAddress: null,
  cloudId: null,
  schedule: "",
  updatedScheduleTime: 0,
  enabled: true,
  cloudChangedProgram: null,
  cloudChangedProgramTime: 0,
  updatedAt: 0,
};


// toonReducer
let toonReducer = (state = defaultSettings, action : any = {}) => {
  switch (action.type) {
    case "UPDATE_TOON_CLOUD_ID":
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'ADD_TOON':
    case 'UPDATE_TOON':
      if (action.data) {
        let newState = {...state};
        newState.toonAgreementId = update(action.data.toonAgreementId,         newState.toonAgreementId);
        newState.toonAddress     = update(action.data.toonAddress,             newState.toonAddress);
        newState.schedule        = update(action.data.schedule,                newState.schedule);
        newState.cloudId         = update(action.data.cloudId,                 newState.cloudId);
        newState.enabled         = update(action.data.enabled,                 newState.enabled);
        newState.updatedScheduleTime = update(action.data.updatedScheduleTime, newState.updatedScheduleTime);

        newState.cloudChangedProgram     = update(action.data.cloudChangedProgram,     newState.cloudChangedProgram);
        newState.cloudChangedProgramTime = update(action.data.cloudChangedProgramTime, newState.cloudChangedProgramTime);

        newState.updatedAt       = getTime(action.data.timestamp || action.updatedAt);
        return newState;
      }
      return state;
    case 'TOON_UPDATE_SETTINGS':
      if (action.data) {
        let newState = {...state};
        newState.enabled = update(action.data.enabled,   newState.enabled);
        return newState;
      }
      return state;
    case 'TOON_UPDATE_SCHEDULE':
      if (action.data) {
        let newState = {...state};
        newState.schedule = update(action.data.schedule, newState.schedule);
        newState.updatedScheduleTime = update(action.data.updatedScheduleTime, newState.updatedScheduleTime);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings);
    default:
      return state;
  }
};



// toon reducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_TOON':
      let stateCopy = {...state};
      delete stateCopy[action.toonId];
      return stateCopy;
    case 'REMOVE_ALL_TOONS':
      return {};
    default:
      if (action.toonId !== undefined) {
        if (state[action.toonId] !== undefined || action.type === "ADD_TOON") {
          return {
            ...state,
            ...{[action.toonId]: toonReducer(state[action.toonId], action)}
          };
        }
      }
      return state;
  }
};



