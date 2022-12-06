import { update, getTime, refreshDefaults } from './reducerUtil'
import { xUtil } from "../../util/StandAloneUtil";

type deviceId = string;

let defaultSettings : TransformData = {
  id: null,
  fromDevice: null,
  fromUser: null,
  toDevice: null,
  toUser: null,
  transform: [],
  updatedAt: 1,
};

const transformReducer = (state = defaultSettings, action : DatabaseAction = {}) => {
  switch (action.type) {
    case 'ADD_TRANSFORM':
    case 'UPDATE_TRANSFORM':
      if (action.data) {
        let newState = {...state};
        newState.fromDevice = update(action.data.fromDevice, newState.fromDevice);
        newState.fromUser   = update(action.data.fromUser,   newState.fromUser);
        newState.toDevice   = update(action.data.toDevice,   newState.toDevice);
        newState.toUser     = update(action.data.toUser,     newState.toUser);
        newState.transform  = update(action.data.transform,  newState.transform);
        newState.updatedAt  = update(action.data.updatedAt,  newState.updatedAt);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings);
    default:
      return state;
  }
};



// transformReducer
export default (state = {}, action : DatabaseAction = {}) => {
  switch (action.type) {
    case 'REMOVE_ALL_TRANSFORMS':
      return {};
    case 'REMOVE_TRANSFORM':
      let stateCopy = {...state};
      delete stateCopy[action.transformId];
      return stateCopy;
    default:
      if (action.transformId !== undefined) {
        if (state[action.transformId] !== undefined || action.type === "ADD_TRANSFORM") {
          return {
            ...state,
            ...{[action.transformId]: transformReducer(state[action.transformId], action)}
          };
        }
      }
      return state;
  }
};

