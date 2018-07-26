import { update, getTime, refreshDefaults } from '../reducerUtil'



let defaultReachability = {
  disabled: true,
  lastSeen: null,
  lastSeenViaMesh: null,
  lastSeenTemperature: null,
  rssi: -1000,
};

export default (state = defaultReachability, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_STATE': // this is a duplicate action. If the state is updated, the stone is not disabled by definition
      if (action.data) {
        let newState = {...state};
        newState.disabled = false;
        newState.lastSeenTemperature = update(action.data.lastSeenTemperature, newState.lastSeenTemperature);;
        return newState;
      }
      return state;
    case 'UPDATE_STONE_RSSI':
      if (action.data) {
        let newState = {...state};
        newState.rssi            = update(action.data.rssi, newState.rssi);
        return newState;
      }
      return state;
    case 'UPDATE_STONE_DIAGNOSTICS':
      if (action.data) {
        let newState = {...state};
        newState.lastSeen            = update(action.data.lastSeen,            newState.lastSeen);
        newState.lastSeenViaMesh     = update(action.data.lastSeenViaMesh,     newState.lastSeenViaMesh);
        newState.lastSeenTemperature = update(action.data.lastSeenTemperature, newState.lastSeenTemperature);
        return newState;
      }
      return state;
    case 'UPDATE_STONE_DISABILITY': // used for crownstones that are not heard from for a while.
      if (action.data) {
        let newState = {...state};
        newState.disabled        = update(action.data.disabled, newState.disabled);
        newState.rssi            = update(action.data.rssi, newState.rssi);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultReachability);
    default:
      return state;
  }
}