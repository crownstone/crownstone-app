import { createStore, combineReducers } from 'redux'
import { update, getTime } from './reducerUtil'
import { updateToggleState, toggleState } from './shared'

let defaultSettings = {
  config: {
    name: undefined,
    icon: 'ios-outlet',
    applianceId: undefined,
    locationId: undefined,
    macAddress: undefined,
    iBeaconMajor: undefined,
    iBeaconMinor: undefined,
    bluetoothId: undefined,
    crownstoneId: undefined,
    initializedSuccessfully: false,
    updatedAt: 1
  },
  state: {
    state: 1.0,
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
    onRoomExit:  { /* toggleState */ }
  }
};


let stoneConfigReducer = (state = defaultSettings.config, action = {}) => {
  switch (action.type) {
    case 'ADD_STONE':
    case 'UPDATE_STONE_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.name         = update(action.data.name,     newState.name);
        newState.locationId   = update(action.data.locationId, newState.locationId);
        newState.applianceId  = update(action.data.applianceId, newState.applianceId);
        newState.macAddress   = update(action.data.macAddress, newState.macAddress);
        newState.iBeaconMajor = update(action.data.iBeaconMajor, newState.iBeaconMajor);
        newState.iBeaconMinor = update(action.data.iBeaconMinor, newState.iBeaconMinor);
        newState.bluetoothId  = update(action.data.bluetoothId, newState.bluetoothId);
        newState.crownstoneId = update(action.data.crownstoneId, newState.crownstoneId);
        newState.initializedSuccessfully = update(action.data.initializedSuccessfully, newState.initializedSuccessfully);
        newState.updatedAt    = getTime();
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
        newState.updatedAt   = getTime();
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
let behaviourReducerOnHomeExit = (state = toggleState, action = {}) => {
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
let behaviourReducerOnRoomExit = (state = toggleState, action = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomExit':
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
  onHomeExit: behaviourReducerOnHomeExit,
  onRoomEnter: behaviourReducerOnRoomEnter,
  onRoomExit: behaviourReducerOnRoomExit,
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
        return {
          ...state,
          ...{[action.stoneId]:combinedStoneReducer(state[action.stoneId], action)}
        };
      }
      return state;
  }
};