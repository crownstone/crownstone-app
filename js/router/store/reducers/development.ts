import { update, refreshDefaults } from './reducerUtil'
import {LOG_LEVEL} from "../../../logging/LogLevels";

let defaultState = {
  logging_enabled:   false,
  log_info:          LOG_LEVEL.info,
  log_native:        LOG_LEVEL.error,
  log_mesh:          LOG_LEVEL.error,
  log_notifications: LOG_LEVEL.error,
  log_scheduler:     LOG_LEVEL.error,
  log_ble:           LOG_LEVEL.error,
  log_bch:           LOG_LEVEL.error,
  log_events:        LOG_LEVEL.error,
  log_store:         LOG_LEVEL.error,
  log_cloud:         LOG_LEVEL.error,
  use_advertisement_rssi_too: false,
  show_rssi_values_in_mesh:   false,
  show_full_activity_log:     false,
  show_only_own_activity_log: false,
  nativeExtendedLogging:      false,
};

// developmentReducer
export default (state = defaultState, action : any = {}) => {
  let newState;
  switch (action.type) {
    case 'SET_LOGGING':
      if (action.data) {
        let newState = {...state};
        newState.logging_enabled = update(action.data.logging_enabled, newState.logging_enabled);
        return newState;
      }
      return state;
    case 'CHANGE_DEV_SETTINGS':
    case 'DEFINE_LOGGING_DETAILS':
      if (action.data) {
        newState = {...state};
        newState.logging_enabled =   update(action.data.logging_enabled,   newState.logging_enabled);
        newState.log_info =          update(action.data.log_info,          newState.log_info);
        newState.log_mesh =          update(action.data.log_mesh,          newState.log_mesh);
        newState.log_native =        update(action.data.log_native,        newState.log_native);
        newState.log_scheduler =     update(action.data.log_scheduler,     newState.log_scheduler);
        newState.log_notifications = update(action.data.log_notifications, newState.log_notifications);
        newState.log_ble =           update(action.data.log_ble,           newState.log_ble);
        newState.log_bch =           update(action.data.log_bch,           newState.log_bch);
        newState.log_events =        update(action.data.log_events,        newState.log_events);
        newState.log_store =         update(action.data.log_store,         newState.log_store);
        newState.log_cloud =         update(action.data.log_cloud,         newState.log_cloud);
        newState.nativeExtendedLogging =      update(action.data.nativeExtendedLogging,      newState.nativeExtendedLogging);
        newState.use_advertisement_rssi_too = update(action.data.use_advertisement_rssi_too, newState.use_advertisement_rssi_too);
        newState.show_rssi_values_in_mesh =   update(action.data.show_rssi_values_in_mesh,   newState.show_rssi_values_in_mesh);
        newState.show_full_activity_log =     update(action.data.show_full_activity_log,     newState.show_full_activity_log);
        newState.show_only_own_activity_log = update(action.data.show_only_own_activity_log, newState.show_only_own_activity_log);
        return newState;
      }
      return state;
    case 'REVERT_LOGGING_DETAILS':
      return { ...defaultState };
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultState);
    default:
      return state;
  }
};
