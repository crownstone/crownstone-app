import { combineReducers } from "redux";

let defaultAbilityFormat = {
  enabled: false,
  synced: true,
};

let dimmingReducer = (state = defaultAbilityFormat, action) => {
  switch (action.type) {
    case 'UPDATE_DIMMER':
      if (action.data) {
        let newState = {...state};
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
        return newState;
      }
      return state;
    default:
      return state;
  }
};

let tapToToggleReducer = (state = defaultAbilityFormat, action) => {
  switch (action.type) {
    case 'UPDATE_TAP_TO_TOGGLE':
      if (action.data) {
        let newState = {...state};
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
