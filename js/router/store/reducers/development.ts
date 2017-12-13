import { update, refreshDefaults } from './reducerUtil'

let defaultState = {
  log_info:      true,
  log_native:    true,
  log_warnings:  true,
  log_errors:    true,
  log_mesh:      true,
  log_scheduler: false,
  log_verbose:   false,
  log_ble:       false,
  log_events:    false,
  log_store:     false,
  log_cloud:     false,
  log_debug:     false,
};

// developmentReducer
export default (state = defaultState, action : any = {}) => {
  let newState;
  switch (action.type) {
    case 'DEFINE_LOGGING_DETAILS':
      if (action.data) {
        newState = {...state};
        newState.log_info =      update(action.data.log_info,       newState.log_info);
        newState.log_warnings =  update(action.data.log_warnings,   newState.log_warnings);
        newState.log_errors =    update(action.data.log_errors,     newState.log_errors);
        newState.log_mesh =      update(action.data.log_mesh,       newState.log_mesh);
        newState.log_native =    update(action.data.log_native,     newState.log_native);
        newState.log_scheduler = update(action.data.log_scheduler,  newState.log_scheduler);
        newState.log_verbose =   update(action.data.log_verbose,    newState.log_verbose);
        newState.log_ble =       update(action.data.log_ble,        newState.log_ble);
        newState.log_events =    update(action.data.log_events,     newState.log_events);
        newState.log_store =     update(action.data.log_store,      newState.log_store);
        newState.log_cloud =     update(action.data.log_cloud,      newState.log_cloud);
        newState.log_debug =     update(action.data.log_debug,      newState.log_debug);
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
