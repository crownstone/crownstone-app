import { combineReducers } from 'redux'
import { update, getTime } from './reducerUtil'
import { updateToggleState, toggleState } from './shared'

let defaultSettings = {
  config: {
    name: undefined,
    icon: undefined,
    dimmable: false,
    updatedAt: 1
  },
  linkedAppliances: { 
    onOn:  {},
    onOff: {},
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


let linkedAppliancesReducer = (state = defaultSettings.linkedAppliances, action = {}) => {
  switch (action.type) {
    case 'ADD_LINKED_DEVICES':
    case 'UPDATE_LINKED_DEVICES':
    case 'REMOVE_LINKED_DEVICES':
      return {...state, ...action.data};
    default:
      return state;
  }
};


let behaviourReducerOnHomeEnter = (state = toggleState, action = {}) => {
  switch (action.type) {
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeEnter':
      return updateToggleState(state,action);
    default:
      return state;
  }
};
let behaviourReducerOnHomeExit = (state = toggleState, action = {}) => {
  switch (action.type) {
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeExit':
      return updateToggleState(state,action);
    default:
      return state;
  }
};
let behaviourReducerOnRoomEnter = (state = toggleState, action = {}) => {
  switch (action.type) {
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomEnter':
      return updateToggleState(state,action);
    default:
      return state;
  }
};
let behaviourReducerOnRoomExit = (state = toggleState, action = {}) => {
  switch (action.type) {
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomExit':
      return updateToggleState(state,action);
    default:
      return state;
  }
};

let scheduleReducer = (state = {}, action = {}) => {
  switch (action.type) {
    case 'ADD_APPLIANCE_SCHEDULE':
    case 'UPDATE_APPLIANCE_SCHEDULE':
    case 'REMOVE_APPLIANCE_SCHEDULE':
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
});


let combinedApplianceReducer = combineReducers({
  config: applianceConfigReducer,
  behaviour: applianceBehavioursReducer,
  linkedAppliances: linkedAppliancesReducer,
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