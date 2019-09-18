import { combineReducers } from "redux";
import { getTime, update } from "../reducerUtil";

let defaultAbilityFormat = {
  enabled: false,
  targetState: false,
  synced: true,
  updatedAt: 0
};
let tapToToggleAbilityFormat = {
  enabled: false,
  targetState: false,
  rssiOffset: 0,
  synced: true,
  updatedAt: 0
};

let dimmingReducer = (state = defaultAbilityFormat, action) => {
  switch (action.type) {
    case 'UPDATE_DIMMER':
      if (action.data) {
        let newState = {...state};
        newState.enabled     = update(action.data.enabled,     newState.enabled);
        newState.targetState = update(action.data.targetState, newState.targetState);
        newState.synced      = update(action.data.synced,      newState.synced);
        newState.updatedAt   = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    default:
      return state;
  }
};

let switchcraftReducer = (state = defaultAbilityFormat, action) => {
  switch (action.type) {
    case 'UPDATE_SWITCHCRAFT':
      if (action.data) {
        let newState = {...state};
        newState.enabled     = update(action.data.enabled,     newState.enabled);
        newState.targetState = update(action.data.targetState, newState.targetState);
        newState.synced      = update(action.data.synced,      newState.synced);
        newState.updatedAt   = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    default:
      return state;
  }
};

let tapToToggleReducer = (state = tapToToggleAbilityFormat, action) => {
  switch (action.type) {
    case 'UPDATE_TAP_TO_TOGGLE':
      if (action.data) {
        let newState = {...state};
        newState.enabled        = update(action.data.enabled,     newState.enabled);
        newState.targetState    = update(action.data.targetState, newState.targetState);
        newState.rssiOffset     = update(action.data.rssiOffset,  newState.rssiOffset);
        newState.synced         = update(action.data.synced,      newState.synced);
        newState.updatedAt      = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    default:
      return state;
  }
};



export default combineReducers({
  dimming:     dimmingReducer,
  switchcraft: switchcraftReducer,
  tapToToggle: tapToToggleReducer,
});
