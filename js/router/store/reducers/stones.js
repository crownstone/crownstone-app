import { createStore, combineReducers } from 'redux'
import { update } from './util'

let defaultSettings = {
  config: {
    name: undefined,
    icon: undefined,
    dimmable: false
  },
  state: {
    state: 1.0,
    currentUsage: 0
  },
  linkedDevices: {
    onOn: {},
    onOff: {}
  },
  deviceState:{
    state:    undefined, // [0 .. 1] for state, undefined for ignore
    timeout:  0,        // timeout in seconds
    fadeTime: 0        // timeout in seconds
  },
  behaviourConfig:{
    onlyOnAfterDusk: false,
    onlyOffWhenEmpty: false
  }
};

let updateDeviceState = function (state, action) {
  if (action.data) {
    let newState = {...state};
    newState.state     = action.data.state; // undefined is a valid answer.
    newState.timeout   = update(action.data.timeout, newState.timeout);
    newState.fadeTime  = update(action.data.fadeTime, newState.fadeTime);
    return newState;
  }
  return state;
};


let stoneConfigReducer = (state = defaultSettings.config, action = {}) => {
  switch (action.type) {
    case 'ADD_STONE':
    case 'UPDATE_STONE_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.name     = update(action.data.name,     newState.name);
        newState.icon     = update(action.data.icon,     newState.icon);
        newState.dimmable = update(action.data.dimmable, newState.dimmable);
        return newState;
      }
      return state;
    default:
      return state;
  }
};

let stoneStateReducer = (state = defaultSettings.state, action = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_STATE':
      if (action.data) {
        let newState = {...state};
        newState.state        = update(action.data.state,        newState.state);
        newState.currentUsage = update(action.data.currentUsage, newState.currentUsage);
        return newState;
      }
      return state;
    default:
      return state;
  }
};

let behaviourConfigReducer = (state = defaultSettings.behaviourConfig, action = {}) => {
  switch (action.type) {
    case 'UPDATE_BEHAVIOUR_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.onlyOnAfterDusk  = update(action.data.onlyOnAfterDusk,  newState.onlyOnAfterDusk);
        newState.onlyOffWhenEmpty = update(action.data.onlyOffWhenEmpty, newState.onlyOffWhenEmpty);
        return newState;
      }
      return state;
    default:
      return state;
  }
};

let behaviourReducerOnHomeEnter = (state = defaultSettings.deviceState, action = {}) => {
  switch (action.type) {
    case 'UPDATE_BEHAVIOUR_ON_HOME_ENTER':
      return updateDeviceState(state,action);
    default:
      return state;
  }
};
let behaviourReducerOnHomeExit = (state = defaultSettings.deviceState, action = {}) => {
  switch (action.type) {
    case 'UPDATE_BEHAVIOUR_ON_HOME_EXIT':
      return updateDeviceState(state,action);
    default:
      return state;
  }
};
let behaviourReducerOnRoomEnter = (state = defaultSettings.deviceState, action = {}) => {
  switch (action.type) {
    case 'UPDATE_BEHAVIOUR_ON_ROOM_ENTER':
      return updateDeviceState(state,action);
    default:
      return state;
  }
};
let behaviourReducerOnRoomExit = (state = defaultSettings.deviceState, action = {}) => {
  switch (action.type) {
    case 'UPDATE_BEHAVIOUR_ON_ROOM_EXIT':
      return updateDeviceState(state,action);
    default:
      return state;
  }
};

let stoneLinkedDevicesReducer = (state = defaultSettings.linkedDevices, action = {}) => {
  switch (action.type) {
    case 'ADD_LINKED_DEVICES':
    case 'UPDATE_LINKED_DEVICES':
    case 'REMOVE_LINKED_DEVICES':
      return {...state, ...action.data};
    default:
      return state;
  }
};

let stoneScheduleReducer = (state = {}, action = {}) => {
  switch (action.type) {
    case 'ADD_STONE_SCHEDULE':
    case 'UPDATE_STONE_SCHEDULE':
    case 'REMOVE_STONE_SCHEDULE':
      return {...state, ...action.data};
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

let stoneBehavioursReducer = combineReducers({
  onHomeEnter: behaviourReducerOnHomeEnter,
  onHomeExit: behaviourReducerOnHomeExit,
  onRoomEnter: behaviourReducerOnRoomEnter,
  onRoomExit: behaviourReducerOnRoomExit,
  config: behaviourConfigReducer
});


let combinedStoneReducer = combineReducers({
  config: stoneConfigReducer,
  state: stoneStateReducer,
  behaviour: stoneBehavioursReducer,
  linkedDevices: stoneLinkedDevicesReducer,
  schedule: stoneScheduleReducer,
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
        return {
          ...state,
          ...{[action.stoneId]:combinedStoneReducer(state[action.stoneId], action)}
        };
      }
      return state;
  }
};