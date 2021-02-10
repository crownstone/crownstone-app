import { combineReducers } from 'redux'
import { update, getTime, refreshDefaults, idReducerGenerator } from "./reducerUtil";
import stonesReducer       from './stones'
import { STONE_TYPES }     from "../../../Enums";



let defaultSettings : HubData = {
  id: undefined,
  config: {
    name:          'Crownstone Hub',
    cloudId:       null,
    ipAddress:     null,
    linkedStoneId: null,
    locationId:    null,
    httpPort:      80,
    httpsPort:     443,
    updatedAt:     1,
  },
  state: {
    uartAlive                          : false,
    uartAliveEncrypted                 : false,
    uartEncryptionRequiredByCrownstone : false,
    uartEncryptionRequiredByHub        : false,
    hubHasBeenSetup                    : false,
    hubHasInternet                     : false,
    hubHasError                        : false,
  },
  reachability: {
    reachable: false,
    lastSeen:  null,
  },
};


const hubConfigReducer = (state = defaultSettings.config, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_HUB_CLOUD_ID':
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'UPDATE_HUB_LOCATION':
      if (action.data) {
        let newState = {...state};
        newState.locationId      = update(action.data.locationId, newState.locationId);
        newState.updatedAt       = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'ADD_HUB':
    case 'UPDATE_HUB_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.name          = update(action.data.name,          newState.name);
        newState.cloudId       = update(action.data.cloudId,       newState.cloudId);
        newState.ipAddress     = update(action.data.ipAddress,     newState.ipAddress);
        newState.linkedStoneId = update(action.data.linkedStoneId, newState.linkedStoneId);
        newState.locationId    = update(action.data.locationId,    newState.locationId);
        newState.httpPort      = update(action.data.httpPort,      newState.httpPort);
        newState.httpsPort     = update(action.data.httpsPort,     newState.httpsPort);
        newState.updatedAt     = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings.config);
    default:
      return state;
  }
};

const hubStateReducer = (state = defaultSettings.state, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_HUB_STATE':
      if (action.data) {
        let newState = {...state};
        newState.uartAlive                          = update(action.data.uartAlive,                          newState.uartAlive);
        newState.uartAliveEncrypted                 = update(action.data.uartAliveEncrypted,                 newState.uartAliveEncrypted);
        newState.uartEncryptionRequiredByCrownstone = update(action.data.uartEncryptionRequiredByCrownstone, newState.uartEncryptionRequiredByCrownstone);
        newState.uartEncryptionRequiredByHub        = update(action.data.uartEncryptionRequiredByHub,        newState.uartEncryptionRequiredByHub);
        newState.hubHasBeenSetup                    = update(action.data.hubHasBeenSetup,                    newState.hubHasBeenSetup);
        newState.hubHasInternet                     = update(action.data.hubHasInternet,                     newState.hubHasInternet);
        newState.hubHasError                        = update(action.data.hubHasError,                        newState.hubHasError);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings.state);
    default:
      return state;
  }
};


const reachabilityReducer = (state = defaultSettings.reachability, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_HUB_REACHABILITY':
      if (action.data) {
        let newState = {...state};
        newState.reachable  = update(action.data.reachable,   newState.reachable);
        newState.lastSeen   = update(action.data.lastSeen,    newState.lastSeen);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings.reachability);
    default:
      return state;
  }
};

const hubReducer = combineReducers({
  id:           idReducerGenerator("ADD_HUB", "hubId"),
  config:       hubConfigReducer,
  state:        hubStateReducer,
  reachability: reachabilityReducer,
});


// hubWrapperReducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_ALL_HUBS':
      return {};
    case 'REMOVE_HUB':
      let stateCopy = {...state};
      delete stateCopy[action.hubId];
      return stateCopy;
    default:
      if (action.hubId !== undefined) {
        if (state[action.hubId] !== undefined || action.type === "ADD_HUB") {
          return {
            ...state,
            ...{[action.hubId]: hubReducer(state[action.hubId], action)}
          };
        }
      }
      return state;
  }
};
