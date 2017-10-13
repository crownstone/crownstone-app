import { createStore, combineReducers } from 'redux'
import { update, getTime, refreshDefaults } from './reducerUtil'
import { LOG } from '../../../logging/Log'
import { updateToggleState, toggleState, toggleStateAway } from './shared'
import powerUsageReducer from './stoneSubReducers/powerUsage'
import scheduleReducer from './stoneSubReducers/schedule'

export let BEHAVIOUR_TYPES = {
  NEAR: 'onNear',
  AWAY: 'onAway',
  HOME_ENTER: 'onHomeEnter',
  HOME_EXIT: 'onHomeExit',
  ROOM_ENTER: 'onRoomEnter',
  ROOM_EXIT: 'onRoomExit',
};

export let STONE_TYPES = {
  plug: "PLUG",
  builtin: "BUILTIN",
  guidestone: "GUIDESTONE"
};

let defaultSettings = {
  config: {
    icon: 'c2-pluginFilled',
    applianceId: null,
    crownstoneId: undefined,
    disabled: true,
    cloudId: null,
    dimmingEnabled: false,
    firmwareVersion: null,
    bootloaderVersion: null,
    dfuResetRequired: false,
    hardwareVersion: null,
    iBeaconMajor: undefined,
    iBeaconMinor: undefined,
    handle: undefined,
    locationId: null,
    macAddress: undefined,
    meshNetworkId: null,
    name: 'Crownstone Plug',
    nearThreshold: null,
    rssi: -1000,
    onlyOnWhenDark: false,
    touchToToggle: true,
    hidden: false,
    locked: false,
    type: STONE_TYPES.plug,
    stoneTime: 0,
    stoneTimeChecked: 0,
    lastSeen: 1,
    updatedAt: 1,
    lastUpdatedStoneTime: 0,
  },
  state: {
    state: 0.0,
    currentUsage: 0,
    updatedAt: 1
  },
  schedules: { // this schedule will be overruled by the appliance if applianceId is not undefined.
    updatedAt: 1
  },
  behaviour: { // this behaviour will be overruled by the appliance if applianceId is not undefined.
    onHomeEnter: { /* toggleState */ },
    onHomeExit:  { /* toggleState */ },
    onRoomEnter: { /* toggleState */ },
    onRoomExit:  { /* toggleState */ },
    onNear:      { /* toggleState */ },
    onAway:      { /* toggleState */ },
  },
  errors: {
    overCurrent: false,
    overCurrentDimmer: false,
    temperatureChip: false,
    temperatureDimmer: false,
    hasError: false,
    obtainedErrors: false,
    advertisementError: false,
  },
  powerUsage: {
    //day as string: 2017-05-01 : { cloud: {...}, data: [] }
  }
};


let stoneConfigReducer = (state = defaultSettings.config, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_CLOUD_ID':
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeEnter':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeExit':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomEnter':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomExit':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onNear':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onAway':
      if (action.data) {
        let newState = {...state};
        newState.updatedAt       = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'UPDATE_STONE_STATE': // this is a duplicate action. If the state is updated, the stone is not disabled by definition
      if (action.data) {
        let newState = {...state};
        newState.disabled = false;
        return newState;
      }
      return state;
    case 'UPDATE_MESH_NETWORK_ID': // this is a duplicate action. If the state is updated, the stone is not disabled by definition
      if (action.data) {
        let newState = {...state};
        newState.meshNetworkId   = update(action.data.meshNetworkId, newState.meshNetworkId);
        return newState;
      }
      return state;
    case 'UPDATE_STONE_RSSI':
      if (action.data) {
        let newState = {...state};
        newState.rssi            = update(action.data.rssi, newState.rssi);
        newState.lastSeen        = update(action.data.lastSeen, newState.lastSeen);
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
    case 'UPDATE_STONE_DISABILITY': // used for crownstones that are not heard from for a while.
      if (action.data) {
        let newState = {...state};
        newState.disabled        = update(action.data.disabled, newState.disabled);
        newState.rssi            = update(action.data.rssi, newState.rssi);
        return newState;
      }
      return state;
    case 'UPDATE_STONE_REMOTE_TIME':
      if (action.data) {
        let newState = {...state};
        newState.stoneTime        = update(action.data.stoneTime, newState.stoneTime);
        newState.stoneTimeChecked = getTime(action.data.stoneTimeChecked);
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
    case 'ADD_STONE':
    case 'UPDATE_STONE_CONFIG':
      if (action.data) {

        let newState = {...state};
        newState.applianceId       = update(action.data.applianceId,       newState.applianceId);
        newState.crownstoneId      = update(action.data.crownstoneId,      newState.crownstoneId);
        newState.cloudId           = update(action.data.cloudId,           newState.cloudId);
        newState.dimmingEnabled    = update(action.data.dimmingEnabled,    newState.dimmingEnabled);
        newState.disabled          = update(action.data.disabled,          newState.disabled);
        newState.firmwareVersion   = update(action.data.firmwareVersion,   newState.firmwareVersion);
        newState.bootloaderVersion = update(action.data.bootloaderVersion, newState.bootloaderVersion);
        newState.hardwareVersion   = update(action.data.hardwareVersion,   newState.hardwareVersion);
        newState.dfuResetRequired  = update(action.data.dfuResetRequired,  newState.dfuResetRequired);
        newState.handle            = update(action.data.handle,            newState.handle);
        newState.hidden            = update(action.data.hidden,            newState.hidden);
        newState.icon              = update(action.data.icon,              newState.icon);
        newState.iBeaconMajor      = update(action.data.iBeaconMajor,      newState.iBeaconMajor);
        newState.iBeaconMinor      = update(action.data.iBeaconMinor,      newState.iBeaconMinor);
        newState.locationId        = update(action.data.locationId,        newState.locationId);
        newState.locked            = update(action.data.locked,            newState.locked);
        newState.macAddress        = update(action.data.macAddress,        newState.macAddress);
        newState.meshNetworkId     = update(action.data.meshNetworkId,     newState.meshNetworkId);
        newState.name              = update(action.data.name,              newState.name);
        newState.nearThreshold     = update(action.data.nearThreshold,     newState.nearThreshold);
        newState.onlyOnWhenDark    = update(action.data.onlyOnWhenDark,    newState.onlyOnWhenDark);
        newState.rssi              = update(action.data.rssi,              newState.rssi);
        newState.touchToToggle     = update(action.data.touchToToggle,     newState.touchToToggle);
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
    case 'UPDATED_STONE_TIME':
      let newState = {...state};
      newState.lastUpdatedStoneTime = getTime();
      return newState;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings.config);
    default:
      return state;
  }
};

let stoneStateReducer = (state = defaultSettings.state, action : any = {}) => {
  switch (action.type) {
    case 'CLEAR_STONE_USAGE':
      let newState          = {...state};
      newState.currentUsage = 0;
      newState.updatedAt    = getTime();
      return newState;
    case 'UPDATE_STONE_STATE':
    case 'UPDATE_STONE_SWITCH_STATE': // this duplicate call will allow the cloudEnhancer to differentiate.
      if (action.data) {
        let newState          = {...state};
        newState.state        = update(action.data.state,        newState.state);
        newState.currentUsage = update(action.data.currentUsage, newState.currentUsage);
        newState.updatedAt    = getTime(action.data.updatedAt);
        return newState;
      }
      return state;

    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings.state);
    default:
      return state;
  }
};

let stoneStatisticsReducer = (state = [], action : any = {}) => {
  switch (action.type) {
    default:
      return state;
  }
};


let behaviourReducerOnHomeEnter = (state = toggleState, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeEnter':
      return updateToggleState(state,action);
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, toggleState);
    default:
      return state;
  }
};
let behaviourReducerOnHomeExit = (state = toggleStateAway, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeExit':
      return updateToggleState(state,action);
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, toggleStateAway);
    default:
      return state;
  }
};
let behaviourReducerOnRoomEnter = (state = toggleState, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomEnter':
      return updateToggleState(state,action);
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, toggleState);
    default:
      return state;
  }
};
let behaviourReducerOnRoomExit = (state = toggleStateAway, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomExit':
      return updateToggleState(state,action);
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, toggleStateAway);
    default:
      return state;
  }
};
let behaviourReducerOnNear = (state = toggleState, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onNear':
      return updateToggleState(state,action);
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, toggleState);
    default:
      return state;
  }
};
let behaviourReducerOnAway = (state = toggleStateAway, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onAway':
      return updateToggleState(state,action);
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, toggleStateAway);
    default:
      return state;
  }
};


let stoneErrorsReducer = (state = defaultSettings.errors, action: any = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_ERRORS':
      if (action.data) {
        let newState = {...state};
        newState.advertisementError = update(action.data.advertisementError, newState.advertisementError);
        newState.obtainedErrors     = update(action.data.obtainedErrors, newState.obtainedErrors);
        newState.overCurrent        = update(action.data.overCurrent,       newState.overCurrent);
        newState.overCurrentDimmer  = update(action.data.overCurrentDimmer, newState.overCurrentDimmer);
        newState.temperatureChip    = update(action.data.temperatureChip,   newState.temperatureChip);
        newState.temperatureDimmer  = update(action.data.temperatureDimmer, newState.temperatureDimmer);
        newState.hasError = newState.overCurrent || newState.overCurrentDimmer || newState.temperatureChip || newState.temperatureDimmer;
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
        newState.obtainedErrors    = false;

        newState.hasError = newState.overCurrent || newState.overCurrentDimmer || newState.temperatureChip || newState.temperatureDimmer;
        return newState;
      }
      return state;
    case 'CLEAR_STONE_ERRORS':
      let newState = {...state};
      newState.advertisementError = false;
      newState.overCurrent        = false;
      newState.overCurrentDimmer  = false;
      newState.temperatureChip    = false;
      newState.temperatureDimmer  = false;
      newState.hasError           = false;
      newState.obtainedErrors     = false;
      return newState;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings.errors);
    default:
      return state;
  }
};


let stoneBehavioursReducer = combineReducers({
  onHomeEnter: behaviourReducerOnHomeEnter,
  onHomeExit:  behaviourReducerOnHomeExit,
  onRoomEnter: behaviourReducerOnRoomEnter,
  onRoomExit:  behaviourReducerOnRoomExit,
  onNear:      behaviourReducerOnNear,
  onAway:      behaviourReducerOnAway,
});


let combinedStoneReducer = combineReducers({
  config: stoneConfigReducer,
  state: stoneStateReducer,
  behaviour: stoneBehavioursReducer,
  schedules: scheduleReducer,
  statistics: stoneStatisticsReducer,
  errors: stoneErrorsReducer,
  powerUsage: powerUsageReducer
});

// stonesReducer
export default (state = {}, action : any = {}) => {
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