import { update, getTime, refreshDefaults } from './reducerUtil'

let defaultSettings = {
  config: {
    name: null,
    address: null,
    description: null,
    location: null,
    updatedAt: 1
  },
};

let deviceConfigReducer = (state = defaultSettings.config, action = {}) => {
  switch (action.type) {
    case 'ADD_DEVICE':
    case 'UPDATE_DEVICE_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.name        = update(action.data.name,        newState.name);
        newState.address     = update(action.data.address,     newState.address);
        newState.description = update(action.data.description, newState.description);
        newState.location    = update(action.data.location,    newState.location);
        newState.updatedAt   = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings.config);
    default:
      return state;
  }
};


// devices Reducer
export default (state = {}, action = {}) => {
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

