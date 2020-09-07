import { update, getTime, refreshDefaults } from './reducerUtil'

let defaultState = {
  activeSphere: null,
  notificationToken: null,

  tapToToggleEnabled: false,
  indoorLocalizationEnabled: true,

  hasSeenDeviceSettings: false,
  hasZoomedOutForSphereOverview: false,
  hasSeenSwitchView: false,

  // langauge: null,

  migratedDataToVersion: null,
  updatedAt: 1
};

// appReducer
export default (state = defaultState, action : any = {}) => {
  let newState;
  switch (action.type) {
    case 'RESET_APP_SETTINGS':
      return {...defaultState};

    case 'SET_NOTIFICATION_TOKEN':
      if (action.data) {
        newState = {...state};
        newState.notificationToken   = update(action.data.notificationToken, newState.notificationToken);
        newState.updatedAt           = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'SET_ACTIVE_SPHERE':
      if (action.data) {
        newState = {...state};
        newState.activeSphere        = update(action.data.activeSphere, newState.activeSphere);
        newState.updatedAt           = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'CLEAR_ACTIVE_SPHERE':
      newState = {...state};
      newState.activeSphere = null;
      newState.updatedAt = getTime();
      return newState;
    case 'UPDATE_APP_STATE':
      if (action.data) {
        newState = {...state};
        newState.activeSphere        = update(action.data.activeSphere, newState.activeSphere);
        newState.updatedAt           = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'UPDATE_APP_SETTINGS':
      if (action.data) {
        newState = {...state};
        newState.indoorLocalizationEnabled    = update(action.data.indoorLocalizationEnabled,    newState.indoorLocalizationEnabled);
        newState.tapToToggleEnabled           = update(action.data.tapToToggleEnabled,           newState.tapToToggleEnabled);
        newState.hasSeenSwitchView            = update(action.data.hasSeenSwitchView,            newState.hasSeenSwitchView);
        newState.migratedDataToVersion        = update(action.data.migratedDataToVersion,        newState.migratedDataToVersion);

        newState.hasSeenDeviceSettings         = update(action.data.hasSeenDeviceSettings,          newState.hasSeenDeviceSettings);
        newState.hasZoomedOutForSphereOverview = update(action.data.hasZoomedOutForSphereOverview,  newState.hasZoomedOutForSphereOverview);

        newState.updatedAt                   = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultState);
    default:
      return state;
  }
};
