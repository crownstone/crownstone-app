import { update, getTime, refreshDefaults } from './reducerUtil'
import {Platform} from "react-native";

let defaultState : appData = {
  activeSphere: null,
  notificationToken: null,

  showEnergyData: false,

  tapToToggleEnabled: false,
  indoorLocalizationEnabled: true,

  hasSeenDeviceSettings: false,
  hasZoomedOutForSphereOverview: false,
  hasSeenSwitchView: false,

  hasSeenEditLocationIcon: false,
  hasSeenDimmingButton: false,

  migratedDataToVersion: null,

  dimViewEnabled: false,

  localization_temporalSmoothingMethod: Platform.OS === 'ios' ? 'NONE' : 'SEQUENTIAL_2',
  localization_onlyOwnFingerprints: false,

  updatedAt: 1
};

// appReducer
export default (state = defaultState, action : DatabaseAction = {}) => {
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
    case 'TOGGLE_DIM_VIEW':
      if (action.data) {
        newState = {...state};
        newState.dimViewEnabled = update(action.data.dimViewEnabled, newState.dimViewEnabled);;
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
    case 'UPDATE_APP_LOCALIZATION_SETTINGS':
      if (action.data) {
        newState = {...state};
        newState.localization_temporalSmoothingMethod = update(action.data.localization_temporalSmoothingMethod, newState.localization_temporalSmoothingMethod);
        newState.localization_onlyOwnFingerprints     = update(action.data.localization_onlyOwnFingerprints,     newState.localization_onlyOwnFingerprints);
        newState.updatedAt                            = getTime(action.data.updatedAt);
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
        newState.hasSeenEditLocationIcon      = update(action.data.hasSeenEditLocationIcon,      newState.hasSeenEditLocationIcon);
        newState.hasSeenDimmingButton         = update(action.data.hasSeenDimmingButton,         newState.hasSeenDimmingButton);

        newState.hasSeenDeviceSettings         = update(action.data.hasSeenDeviceSettings,          newState.hasSeenDeviceSettings);
        newState.hasZoomedOutForSphereOverview = update(action.data.hasZoomedOutForSphereOverview,  newState.hasZoomedOutForSphereOverview);

        newState.showEnergyData              = update(action.data.showEnergyData,                 newState.showEnergyData);

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
