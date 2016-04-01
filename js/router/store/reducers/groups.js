import { createStore, combineReducers } from 'redux'
import locationsReducer from './locations'
import { update } from './util'

let defaultSettings = {
  config: {
    name: 'Home',
    latitude: undefined,
    longitude: undefined
  }
};

let groupConfigReducer = (state = defaultSettings.config, action = {}) => {
  switch (action.type) {
    case 'ADD_GROUP':
    case 'UPDATE_GROUP':
      if (action.data) {
        let newState = {...state};
        newState.name = update(action.data.name, newState.name);
        newState.latitude = update(action.data.latitude, newState.latitude);
        newState.longitude = update(action.data.longitude, newState.longitude);
        return newState;
      }
      return state;
    default:
      return state;
  }
};

let presetsReducer = (state = [], action = {}) => {
  switch (action.type) {
    default:
      return state;
  }
};

let combinedGroupReducer = combineReducers({
  config:    groupConfigReducer,
  presets:   presetsReducer,
  locations: locationsReducer
});

// groupsReducer
export default (state = {}, action = {}) => {
  switch (action.type) {
    case 'REMOVE_GROUP':
      let stateCopy = {...state};
      delete stateCopy[action.groupId];
      return stateCopy;
    default:
      if (action.groupId !== undefined) {
        return {
          ...state,
          ...{[action.groupId]:combinedGroupReducer(state[action.groupId], action)}
        };
      }
      return state;
  }
};

