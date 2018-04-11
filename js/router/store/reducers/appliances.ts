import { combineReducers } from 'redux'
import { update, getTime, refreshDefaults } from './reducerUtil'
import { updateToggleState, toggleState, toggleStateAway } from './shared'

let defaultSettings = {
  config: {
    name: undefined,
    icon: undefined,
    cloudId: null,
    dimmable: false,
    onlyOnWhenDark: false,
    hidden: false,
    locked: false,
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

let applianceConfigReducer = (state = defaultSettings.config, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_APPLIANCE_CLOUD_ID':
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'ADD_APPLIANCE':
    case 'UPDATE_APPLIANCE_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.name      = update(action.data.name,     newState.name);
        newState.icon      = update(action.data.icon,     newState.icon);
        newState.cloudId   = update(action.data.cloudId, newState.cloudId);
        newState.dimmable  = update(action.data.dimmable, newState.dimmable);
        newState.hidden    = update(action.data.hidden, newState.hidden);
        newState.locked    = update(action.data.locked, newState.locked);
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



let behaviourReducerOnHomeEnter = (state = toggleState, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeEnter':
      return updateToggleState(state,action);
    default:
      return state;
  }
};
let behaviourReducerOnHomeExit = (state = toggleStateAway, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeExit':
      return updateToggleState(state,action);
    default:
      return state;
  }
};
let behaviourReducerOnRoomEnter = (state = toggleState, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomEnter':
      return updateToggleState(state,action);
    default:
      return state;
  }
};
let behaviourReducerOnRoomExit = (state = toggleStateAway, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomExit':
      return updateToggleState(state,action);
    default:
      return state;
  }
};
let behaviourReducerOnNear = (state = toggleState, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onNear':
      return updateToggleState(state,action);
    default:
      return state;
  }
};
let behaviourReducerOnAway = (state = toggleStateAway, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onAway':
      return updateToggleState(state,action);
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
});

// stonesReducer
export default (state = {}, action : any = {}) => {
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