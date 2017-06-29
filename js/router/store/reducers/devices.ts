import { update, getTime, refreshDefaults } from './reducerUtil'

let defaultSettings = {
  name: null,
  address: null,
  description: null,
  os: null,
  userAgent: null,
  deviceType: null,
  model: null,
  locale: null,
  hubFunction: false,
  location: null,
  tapToToggleCalibration: null,
  installationId: null,
  updatedAt: 1
};

let deviceConfigReducer = (state = defaultSettings, action : any = {}) => {
  switch (action.type) {
    case 'SET_TAP_TO_TOGGLE_CALIBRATION':
      if (action.data) {
        let newState = {...state};
        newState.tapToToggleCalibration = update(action.data.tapToToggleCalibration, newState.tapToToggleCalibration);
        return newState;
      }
      return state;
    case 'ADD_DEVICE':
    case 'CLEAR_DEVICE_DETAILS':
    case 'UPDATE_DEVICE_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.name           = update(action.data.name,           newState.name);
        newState.address        = update(action.data.address,        newState.address);
        newState.description    = update(action.data.description,    newState.description);
        newState.location       = update(action.data.location,       newState.location);
        newState.os             = update(action.data.os,             newState.os);
        newState.userAgent      = update(action.data.userAgent,      newState.userAgent);
        newState.model          = update(action.data.model,          newState.model);
        newState.deviceType     = update(action.data.deviceType,     newState.deviceType);
        newState.locale         = update(action.data.locale,         newState.locale);
        newState.hubFunction    = update(action.data.hubFunction,    newState.hubFunction);
        newState.installationId = update(action.data.installationId, newState.installationId);
        newState.tapToToggleCalibration = update(action.data.tapToToggleCalibration, newState.tapToToggleCalibration);
        newState.updatedAt      = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings);
    default:
      return state;
  }
};


// devices Reducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_DEVICE':
      let newState = {...state};
      delete newState[action.deviceId];
      return newState;
    default:
      if (action.deviceId !== undefined) {
        if (state[action.deviceId] !== undefined || action.type === "ADD_DEVICE") {
          return {
            ...state,
            ...{[action.deviceId]: deviceConfigReducer(state[action.deviceId], action)}
          };
        }
      }
      return state;
  }
};
