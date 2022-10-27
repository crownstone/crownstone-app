import { combineReducers }      from 'redux'
import { update, getTime, refreshDefaults, idReducerGenerator } from "./reducerUtil";
import behaviourReducer    from './stoneSubReducers/behaviours'
import reachabilityReducer from './stoneSubReducers/reachability'
import lastUpdatedReducer  from './stoneSubReducers/lastUpdated'
import stoneKeyReducer     from './stoneSubReducers/stoneKeys'
import abilityReducer      from './stoneSubReducers/abilities'
import { STONE_TYPES } from "../../Enums";


let defaultConfig: StoneDataConfig = {
  name: 'Crownstone Plug',
    description: '',
  icon: 'c2-pluginFilled',
  type: STONE_TYPES.plug,
  uid: undefined, // new field to generalize between sphere, location and stone uid.
  iBeaconMajor: undefined,
  iBeaconMinor: undefined,
  handle: undefined,

  cloudId: null,

  firmwareVersion: null,
  bootloaderVersion: null,
  hardwareVersion: null,
  uicr: null,

  dfuResetRequired: false,
  locationId: null,

  macAddress: undefined,

  hidden: false,
  locked: false,

  updatedAt: 1,
};

const defaultState: StoneState = {
  timeSet: false,
  state: 0.0,
  previousState: 0.0,
  currentUsage: 0,
  behaviourOverridden: false,
  dimmerReady: false,
  powerFactor: null,
  updatedAt: 1
}

const defaultErrors : StoneErrors = {
    overCurrent: false,
    overCurrentDimmer: false,
    temperatureChip: false,
    temperatureDimmer: false,
    dimmerOnFailure: false,
    dimmerOffFailure: false,
    hasError: false,
  }


let stoneConfigReducer = (state = defaultConfig, action : DatabaseAction = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_CLOUD_ID':
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'UPDATE_STONE_HANDLE':
      if (action.data) {
        let newState = {...state};
        newState.handle          = update(action.data.handle, newState.handle);
        return newState;
      }
      return state;

    case 'UPDATE_STONE_DFU_RESET':
      if (action.data) {
        let newState = {...state};
        newState.dfuResetRequired = update(action.data.dfuResetRequired, newState.dfuResetRequired);
        return newState;
      }
      return state;
    case 'UPDATE_STONE_LOCAL_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.cloudId                       = update(action.data.cloudId,          newState.cloudId);
        newState.dfuResetRequired              = update(action.data.dfuResetRequired, newState.dfuResetRequired);
        newState.handle                        = update(action.data.handle,           newState.handle);
        newState.hidden                        = update(action.data.hidden,           newState.hidden);
        newState.locked                        = update(action.data.locked,           newState.locked);
        return newState;
      }
      return state;
    case 'ADD_STONE':
    case 'UPDATE_STONE_CONFIG':
    case 'UPDATE_STONE_CONFIG_TRANSIENT':
      if (action.data) {
        let newState = {...state};
        newState.uid               = update(action.data.uid,               newState.uid);
        newState.cloudId           = update(action.data.cloudId,           newState.cloudId);
        newState.firmwareVersion   = update(action.data.firmwareVersion,   newState.firmwareVersion);
        newState.bootloaderVersion = update(action.data.bootloaderVersion, newState.bootloaderVersion);
        newState.hardwareVersion   = update(action.data.hardwareVersion,   newState.hardwareVersion);
        newState.uicr              = update(action.data.uicr,              newState.uicr);
        newState.dfuResetRequired  = update(action.data.dfuResetRequired,  newState.dfuResetRequired);
        newState.handle            = update(action.data.handle,            newState.handle);
        newState.hidden            = update(action.data.hidden,            newState.hidden);
        newState.icon              = update(action.data.icon,              newState.icon);
        newState.iBeaconMajor      = update(action.data.iBeaconMajor,      newState.iBeaconMajor);
        newState.iBeaconMinor      = update(action.data.iBeaconMinor,      newState.iBeaconMinor);
        newState.locationId        = update(action.data.locationId,        newState.locationId);
        newState.locked            = update(action.data.locked,            newState.locked);
        newState.macAddress        = update(action.data.macAddress,        newState.macAddress);
        newState.name              = update(action.data.name,              newState.name);
        newState.description       = update(action.data.description,       newState.description);
        newState.type              = update(action.data.type,              newState.type);
        newState.updatedAt         = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'UPDATE_STONE_LOCATION':
      if (action.data) {
        let newState = {...state};
        newState.locationId      = update(action.data.locationId, newState.locationId);
        newState.updatedAt       = getTime(action.data.updatedAt);
        return newState;
      }
      return state;

    case 'REFRESH_DEFAULTS':

      return refreshDefaults(state, defaultConfig);
    default:
      return state;
  }
};

let stoneStateReducer = (state = defaultState, action : DatabaseAction = {}) => {
  switch (action.type) {
    case 'CLEAR_STONE_USAGE':
      let newState          = {...state};
      newState.currentUsage = 0;
      newState.updatedAt    = getTime();
      return newState;
    case 'UPDATE_STONE_TIME_STATE':
      if (action.data) {
        let newState     = {...state};
        newState.timeSet = update(action.data.timeSet,  newState.timeSet);
        return newState;
      }
      return state;
    case 'UPDATED_STONE_TIME':
      if (state.timeSet !== true) {
        let newState = {...state};
        return newState;
      }
      return state;
    case 'UPDATE_STONE_STATE':
    case 'UPDATE_STONE_SWITCH_STATE': // this duplicate call will allow the cloudEnhancer to differentiate.
    case 'UPDATE_STONE_SWITCH_STATE_TRANSIENT': // this duplicate call will allow the cloudEnhancer to differentiate.
      if (action.data) {
        let newState           = {...state};

        if (newState.state !== action.data.state && action.data.state !== null && action.data.state !== undefined) {
          newState.previousState = newState.state;
        }

        newState.state               = update(action.data.state,               newState.state);
        newState.dimmerReady         = update(action.data.dimmerReady,         newState.dimmerReady);
        newState.currentUsage        = update(action.data.currentUsage,        newState.currentUsage);
        newState.behaviourOverridden = update(action.data.behaviourOverridden, newState.behaviourOverridden);
        newState.powerFactor         = update(action.data.powerFactor,         newState.powerFactor);
        newState.timeSet             = update(action.data.timeSet,             newState.timeSet);
        newState.updatedAt           = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultState);
    default:
      return state;
  }
};



let stoneErrorsReducer = (state = defaultErrors, action: any = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_ERRORS':
      if (action.data) {
        let newState = {...state};
        newState.overCurrent        = update(action.data.overCurrent,       newState.overCurrent);
        newState.overCurrentDimmer  = update(action.data.overCurrentDimmer, newState.overCurrentDimmer);
        newState.temperatureChip    = update(action.data.temperatureChip,   newState.temperatureChip);
        newState.temperatureDimmer  = update(action.data.temperatureDimmer, newState.temperatureDimmer);
        newState.dimmerOnFailure    = update(action.data.dimmerOnFailure,   newState.dimmerOnFailure);
        newState.dimmerOffFailure   = update(action.data.dimmerOffFailure,  newState.dimmerOffFailure);

        newState.hasError = newState.overCurrent       ||
                            newState.overCurrentDimmer ||
                            newState.temperatureChip   ||
                            newState.temperatureDimmer ||
                            newState.dimmerOnFailure   ||
                            newState.dimmerOffFailure;
        return newState;
      }
      return state;
    case 'RESET_STONE_ERRORS':
      if (action.data) {
        let newState = {...state};
        newState.overCurrent       = update(action.data.overCurrent,       newState.overCurrent);
        newState.overCurrentDimmer = update(action.data.overCurrentDimmer, newState.overCurrentDimmer);
        newState.temperatureChip   = update(action.data.temperatureChip,   newState.temperatureChip);
        newState.temperatureDimmer = update(action.data.temperatureDimmer, newState.temperatureDimmer);
        newState.dimmerOnFailure   = update(action.data.dimmerOnFailure,   newState.dimmerOnFailure);
        newState.dimmerOffFailure  = update(action.data.dimmerOffFailure,  newState.dimmerOffFailure);

        newState.hasError = newState.overCurrent       ||
                            newState.overCurrentDimmer ||
                            newState.temperatureChip   ||
                            newState.temperatureDimmer ||
                            newState.dimmerOnFailure   ||
                            newState.dimmerOffFailure;
        return newState;
      }
      return state;
    case 'CLEAR_STONE_ERRORS':
      let newState = {...state};
      newState.overCurrent       = false;
      newState.overCurrentDimmer = false;
      newState.temperatureChip   = false;
      newState.temperatureDimmer = false;
      newState.dimmerOnFailure   = false;
      newState.dimmerOffFailure  = false;

      newState.hasError          = false;
      return newState;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultErrors);
    default:
      return state;
  }
};


let combinedStoneReducer = combineReducers({
  id:           idReducerGenerator("ADD_STONE", "stoneId"),
  config:       stoneConfigReducer,
  state:        stoneStateReducer,
  abilities:    abilityReducer,
  behaviours:   behaviourReducer,
  errors:       stoneErrorsReducer,
  lastUpdated:  lastUpdatedReducer,
  reachability: reachabilityReducer,
  keys:         stoneKeyReducer,
});

// stonesReducer
export default (state = {}, action : DatabaseAction = {}) => {
  switch (action.type) {
    case 'REMOVE_STONE':
      let stateCopy = {...state};
      delete stateCopy[action.stoneId];
      return stateCopy;
    default:
      if (action.stoneId !== undefined) {
        if (state[action.stoneId] !== undefined || action.type === "ADD_STONE") {
          return {
            ...state,
            ...{[action.stoneId]: combinedStoneReducer(state[action.stoneId], action)}
          };
        }
      }
      return state;
  }
};

