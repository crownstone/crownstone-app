import { combineReducers } from 'redux'
import { update, getTime, refreshDefaults } from './reducerUtil'
import { updateToggleState, toggleState, toggleStateAway } from './shared'

let defaultSettings = {
  config: {
    name: undefined,
    icon: undefined,
    dimmable: false,
    onlyOnWhenDark: null,
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
    onRoomExit:  { /* toggleState */ },
    onNear:      { /* toggleState */ },
    onAway:      { /* toggleState */ },
  },
};

let applianceConfigReducer = (state = defaultSettings.config, action = {}) => {
  switch (action.type) {
    case 'ADD_APPLIANCE':
    case 'UPDATE_APPLIANCE_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.name      = update(action.data.name,     newState.name);
        newState.icon      = update(action.data.icon,     newState.icon);
        newState.dimmable  = update(action.data.dimmable, newState.dimmable);
        newState.onlyOnWhenDark  = update(action.data.onlyOnWhenDark, newState.onlyOnWhenDark);
        newState.updatedAt = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings.config);
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
let behaviourReducerOnHomeExit = (state = toggleStateAway, action = {}) => {
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
let behaviourReducerOnRoomExit = (state = toggleStateAway, action = {}) => {
  switch (action.type) {
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomExit':
      return updateToggleState(state,action);
    default:
      return state;
  }
};
let behaviourReducerOnNear = (state = toggleState, action = {}) => {
  switch (action.type) {
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onNear':
      return updateToggleState(state,action);
    default:
      return state;
  }
};
let behaviourReducerOnAway = (state = toggleStateAway, action = {}) => {
  switch (action.type) {
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onAway':
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
  onNear: behaviourReducerOnNear,
  onAway: behaviourReducerOnAway,
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
      if (action.applianceId !== undefined && action.applianceId !== null) {
        if (state[action.applianceId] !== undefined || action.type === "ADD_APPLIANCE") {
          return {
            ...state,
            ...{[action.applianceId]: combinedApplianceReducer(state[action.applianceId], action)}
          };
        }
      }
      return state;
  }
};