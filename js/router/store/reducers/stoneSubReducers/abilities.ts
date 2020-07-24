import { combineReducers } from "redux";
import { getTime, refreshDefaults, update } from "../reducerUtil";

let dimmingAbilityFormat = {
  enabled: false,
  enabledTarget: false,
  softOnSpeed: 8,
  syncedToCrownstone: true,
  updatedAt: 0
};
let switchcraftAbilityFormat = {
  enabled: false,
  enabledTarget: false,
  syncedToCrownstone: true,
  updatedAt: 0
};
let tapToToggleAbilityFormat = {
  enabled: false,
  enabledTarget: false,
  rssiOffset: 0,
  rssiOffsetTarget: 0,
  syncedToCrownstone: true,
  updatedAt: 0
};


let dimmingReducer = (state = dimmingAbilityFormat, action) => {
  switch (action.type) {
    case 'UPDATE_ABILITY_DIMMER_AS_SYNCED_FROM_CLOUD':
      if (action.data) {
        let newState = {...state};
        newState.enabled            = update(action.data.enabled,       newState.enabled);
        newState.enabledTarget      = update(action.data.enabledTarget, newState.enabledTarget);
        newState.softOnSpeed        = update(action.data.softOnSpeed,   newState.softOnSpeed);
        newState.syncedToCrownstone = true;
        newState.updatedAt          = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'UPDATE_ABILITY_DIMMER':
      if (action.data) {
        let newState = {...state};
        newState.enabled            = update(action.data.enabled,       newState.enabled);
        newState.enabledTarget      = update(action.data.enabledTarget, newState.enabledTarget);
        newState.softOnSpeed        = update(action.data.softOnSpeed,   newState.softOnSpeed);
        newState.syncedToCrownstone = false;
        newState.updatedAt          = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case "MARK_ABILITY_DIMMER_AS_SYNCED":
      let newState = {...state};
      newState.syncedToCrownstone = true;
      return newState;
    case "REFRESH_ABILITIES":
      newState = {...state};
      newState.syncedToCrownstone = false;
      return newState;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, dimmingAbilityFormat);
    default:
      return state;
  }
};


let switchcraftReducer = (state = switchcraftAbilityFormat, action) => {
  switch (action.type) {
    case 'UPDATE_ABILITY_SWITCHCRAFT_AS_SYNCED_FROM_CLOUD':
      if (action.data) {
        let newState = {...state};
        newState.enabled            = update(action.data.enabled,     newState.enabled);
        newState.enabledTarget      = update(action.data.enabledTarget, newState.enabledTarget);
        newState.syncedToCrownstone = true;
        newState.updatedAt          = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'UPDATE_ABILITY_SWITCHCRAFT':
      if (action.data) {
        let newState = {...state};
        newState.enabled            = update(action.data.enabled,     newState.enabled);
        newState.enabledTarget      = update(action.data.enabledTarget, newState.enabledTarget);
        newState.syncedToCrownstone = false;
        newState.updatedAt          = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case "MARK_ABILITY_SWITCHCRAFT_AS_SYNCED":
      let newState = {...state};
      newState.syncedToCrownstone = true;
      return newState;
    case "REFRESH_ABILITIES":
      newState = {...state};
      newState.syncedToCrownstone = false;
      return newState;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, switchcraftAbilityFormat);
    default:
      return state;
  }
};


let tapToToggleReducer = (state = tapToToggleAbilityFormat, action) => {
  switch (action.type) {
    case 'UPDATE_ABILITY_TAP_TO_TOGGLE_AS_SYNCED_FROM_CLOUD':
      if (action.data) {
        let newState = {...state};
        newState.enabled            = update(action.data.enabled,           newState.enabled);
        newState.enabledTarget      = update(action.data.enabledTarget,     newState.enabledTarget);
        newState.rssiOffset         = update(action.data.rssiOffset,        newState.rssiOffset);
        newState.rssiOffsetTarget   = update(action.data.rssiOffsetTarget,  newState.rssiOffsetTarget);
        newState.syncedToCrownstone = true;
        newState.updatedAt          = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'UPDATE_ABILITY_TAP_TO_TOGGLE':
      if (action.data) {
        let newState = {...state};
        newState.enabled            = update(action.data.enabled,           newState.enabled);
        newState.enabledTarget      = update(action.data.enabledTarget,     newState.enabledTarget);
        newState.rssiOffset         = update(action.data.rssiOffset,        newState.rssiOffset);
        newState.rssiOffsetTarget   = update(action.data.rssiOffsetTarget,  newState.rssiOffsetTarget);
        newState.syncedToCrownstone = false;
        newState.updatedAt          = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case "MARK_ABILITY_TAP_TO_TOGGLE_AS_SYNCED":
      let newState = {...state};
      newState.syncedToCrownstone = true;
      return newState;
    case "REFRESH_ABILITIES":
      newState = {...state};
      newState.syncedToCrownstone = false;
      return newState;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, tapToToggleAbilityFormat);
    default:
      return state;
  }
};


export default combineReducers({
  dimming:     dimmingReducer,
  switchcraft: switchcraftReducer,
  tapToToggle: tapToToggleReducer,
});
