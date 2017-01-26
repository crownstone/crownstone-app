import { createStore, combineReducers } from 'redux'
import { update, getTime } from './reducerUtil'
import { LOG } from '../../../logging/Log'
import { updateToggleState, toggleState, toggleStateAway } from './shared'

export let TYPES = {
  TOUCH: 'touch',
  NEAR: 'onNear',
  AWAY: 'onAway',
  HOME_ENTER: 'onHomeEnter',
  HOME_EXIT: 'onHomeExit',
  ROOM_ENTER: 'onRoomEnter',
  ROOM_EXIT: 'onRoomExit',
};

export let stoneTypes = {
  plug: "PLUG",
  builtin: "BUILTIN",
  guidestone: "GUIDESTONE"
};

let defaultSettings = {
  config: {
    name: 'Crownstone Plug',
    icon: 'c2-pluginFilled',
    type: stoneTypes.plug,
    applianceId: null,
    locationId: null,
    macAddress: undefined,
    iBeaconMajor: undefined,
    iBeaconMinor: undefined,
    handle: undefined,
    crownstoneId: undefined,
    firmwareVersion: 0,
    nearThreshold: -85,
    rssi: -1000,
    touchToToggle: true,
    disabled: true,
    updatedAt: 1,
  },
  state: {
    state: 0.0,
    currentUsage: 0,
    updatedAt: 1
  },
  schedule: { // this schedule will be overruled by the appliance if applianceId is not undefined.
    updatedAt: 1
  },
  behaviour: { // this behaviour will be overruled by the appliance if applianceId is not undefined.
    onHomeEnter: { /* toggleState */ },
    onHomeExit:  { /* toggleState */ },
    onRoomEnter: { /* toggleState */ },
    onRoomExit:  { /* toggleState */ },
    onNear:      { /* toggleState */ },
    onAway:      { /* toggleState */ },
  }
};


let stoneConfigReducer = (state = defaultSettings.config, action = {}) => {
  switch (action.type) {
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
    case 'UPDATE_STONE_STATE': // this is a duplicate action. If the state is updated, the stone is not disabled by definition
      if (action.data) {
        let newState = {...state};
        // todo: remove
        if (state.disabled !== false)
          LOG("CHANGING_DISABILITY ", action.stoneId, false);
        newState.disabled = false;
        return newState;
      }
      return state;
    case 'UPDATE_STONE_RSSI':
      if (action.data) {
        let newState = {...state};
        newState.rssi            = update(action.data.rssi, newState.rssi);
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
    case 'ADD_STONE':
    case 'UPDATE_STONE_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.name            = update(action.data.name,            newState.name);
        newState.icon            = update(action.data.icon,            newState.icon);
        newState.type            = update(action.data.type,            newState.type);
        newState.applianceId     = update(action.data.applianceId,     newState.applianceId);
        newState.locationId      = update(action.data.locationId,      newState.locationId);
        newState.macAddress      = update(action.data.macAddress,      newState.macAddress);
        newState.iBeaconMajor    = update(action.data.iBeaconMajor,    newState.iBeaconMajor);
        newState.iBeaconMinor    = update(action.data.iBeaconMinor,    newState.iBeaconMinor);
        newState.firmwareVersion = update(action.data.firmwareVersion, newState.firmwareVersion);
        newState.handle          = update(action.data.handle,          newState.handle);
        newState.crownstoneId    = update(action.data.crownstoneId,    newState.crownstoneId);
        newState.nearThreshold   = update(action.data.nearThreshold,   newState.nearThreshold);
        newState.disabled        = update(action.data.disabled,        newState.disabled);
        newState.rssi            = update(action.data.rssi,            newState.rssi);
        newState.touchToToggle   = update(action.data.touchToToggle,   newState.touchToToggle);
        newState.updatedAt       = getTime(action.data.updatedAt);
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
    default:
      return state;
  }
};

let stoneStateReducer = (state = defaultSettings.state, action = {}) => {
  switch (action.type) {
    case 'CLEAR_STONE_USAGE':
      let newState          = {...state};
      newState.currentUsage = 0;
      newState.updatedAt   = getTime();
      return newState;
    case 'UPDATE_STONE_STATE':
      if (action.data) {
        let newState          = {...state};
        newState.state        = update(action.data.state,        newState.state);
        newState.currentUsage = update(action.data.currentUsage, newState.currentUsage);
        newState.updatedAt    = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    default:
      return state;
  }
};

let stoneStatisticsReducer = (state = [], action = {}) => {
  switch (action.type) {
    default:
      return state;
  }
};


let behaviourReducerOnHomeEnter = (state = toggleState, action = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeEnter':
      return updateToggleState(state,action);
    default:
      return state;
  }
};
let behaviourReducerOnHomeExit = (state = toggleStateAway, action = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeExit':
      return updateToggleState(state,action);
    default:
      return state;
  }
};
let behaviourReducerOnRoomEnter = (state = toggleState, action = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomEnter':
      return updateToggleState(state,action);
    default:
      return state;
  }
};
let behaviourReducerOnRoomExit = (state = toggleStateAway, action = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomExit':
      return updateToggleState(state,action);
    default:
      return state;
  }
};
let behaviourReducerOnNear = (state = toggleState, action = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onNear':
      return updateToggleState(state,action);
    default:
      return state;
  }
};
let behaviourReducerOnAway = (state = toggleStateAway, action = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onAway':
      return updateToggleState(state,action);
    default:
      return state;
  }
};

let scheduleReducer = (state = {}, action = {}) => {
  switch (action.type) {
    case 'ADD_STONE_SCHEDULE':
    case 'UPDATE_STONE_SCHEDULE':
    case 'REMOVE_STONE_SCHEDULE':
      return {...state, ...action.data};
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
  schedule: scheduleReducer,
  statistics: stoneStatisticsReducer
});

// stonesReducer
export default (state = {}, action = {}) => {
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