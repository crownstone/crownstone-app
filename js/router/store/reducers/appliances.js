import { combineReducers } from 'redux'
import { update, getTime } from './reducerUtil'

import {
  behaviourReducerOnHomeEnter,
  behaviourReducerOnHomeExit,
  behaviourReducerOnRoomEnter,
  behaviourReducerOnRoomExit,
  scheduleReducer,
} from './shared'

let defaultSettings = {
  config: {
    name: undefined,
    icon: undefined,
    dimmable: false,
    updatedAt: getTime()
  },
  linkedAppliances: { 
    onOn:  {},
    onOff: {},
    updatedAt: getTime()
  },
  schedule: { // this schedule will be overruled by the appliance if applianceId is not undefined.
    updatedAt: getTime()
  },
  behaviour: { // this behaviour will be overruled by the appliance if applianceId is not undefined.
    behaviourConfig:{
      onlyOnAfterDusk: false,
      onlyOffWhenEmpty: false,
      updatedAt: getTime()
    },
    onHomeEnter: { /* toggleState */ },
    onHomeExit:  { /* toggleState */ },
    onRoomEnter: { /* toggleState */ },
    onRoomExit:  { /* toggleState */ }
  },
};

let applianceConfigReducer = (state = defaultSettings.config, action = {}) => {
  switch (action.type) {
    case 'ADD_APPLIANCE':
    case 'UPDATE_APPLIANCE_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.name     = update(action.data.name,     newState.name);
        newState.icon     = update(action.data.icon,     newState.icon);
        newState.dimmable = update(action.data.dimmable, newState.dimmable);
        newState.updatedAt = getTime();
        return newState;
      }
      return state;
    default:
      return state;
  }
};


let linkedAppliancesReducer = (state = defaultSettings.linkedDevices, action = {}) => {
  switch (action.type) {
    case 'ADD_LINKED_DEVICES':
    case 'UPDATE_LINKED_DEVICES':
    case 'REMOVE_LINKED_DEVICES':
      return {...state, ...action.data};
    default:
      return state;
  }
};

let applianceBehavioursReducer = combineReducers({
  onHomeEnter: behaviourReducerOnHomeEnter,
  onHomeExit: behaviourReducerOnHomeExit,
  onRoomEnter: behaviourReducerOnRoomEnter,
  onRoomExit: behaviourReducerOnRoomExit,
  config: applianceConfigReducer
});


let combinedApplianceReducer = combineReducers({
  config: applianceConfigReducer,
  behaviour: applianceBehavioursReducer,
  linkedDevices: linkedAppliancesReducer,
  schedule: scheduleReducer,
});

// stonesReducer
export default (state = {}, action = {}) => {
  switch (action.type) {
    case 'REMOVE_APPLIANCE':
      let stateCopy = {...state};
      delete stateCopy[action.applianceId];
      return stateCopy;
    default:
      if (action.applianceId !== undefined) {
        return {
          ...state,
          ...{[action.applianceId]:combinedApplianceReducer(state[action.applianceId], action)}
        };
      }
      return state;
  }
};