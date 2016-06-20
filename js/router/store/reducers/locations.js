import { createStore, combineReducers } from 'redux'
import { update, getTime } from './reducerUtil'


let defaultSettings = {
  config: {
    name:'Untitled Room',
    icon:'missingIcon',
    updatedAt: 1,
    fingerprintRaw: '',
    fingerprintParsed: ''
  },
};

let userPresenceReducer = (state = [], action = {}) => {
  switch (action.type) {
    case 'USER_ENTER':
      return [...state, action.data.userId];
    case 'USER_EXIT':
      let userIndex = state.indexOf(action.data.userId);
      if (userIndex !== -1) {
        return [...state.slice(0,userIndex).concat(state.slice(userIndex+1))]
      }
    case 'CLEAR_USERS':
      return [];
    default:
      return state;
  }
};

let locationConfigReducer = (state = defaultSettings.config, action = {}) => {
  switch (action.type) {
    case 'UPDATE_LOCATION_FINGERPRINT':
      if (action.data) {
        let newState = {...state};
        newState.fingerprintRaw = update(action.data.fingerprintRaw, newState.fingerprintRaw);
        newState.fingerprintParsed = update(action.data.fingerprintParsed, newState.fingerprintParsed);
        return newState;
      }
      return state;
    case 'ADD_LOCATION':
    case 'UPDATE_LOCATION_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.name = update(action.data.name, newState.name);
        newState.icon = update(action.data.icon, newState.icon);
        newState.fingerprintRaw = update(action.data.fingerprintRaw, newState.fingerprintRaw);
        newState.fingerprintParsed = update(action.data.fingerprintParsed, newState.fingerprintParsed);
        newState.updatedAt = getTime();
        return newState;
      }
      return state;
    default:
      return state;
  }
};

let combinedLocationReducer = combineReducers({
  config:       locationConfigReducer,
  presentUsers: userPresenceReducer,
});


// locationsReducer
export default (state = {}, action = {}) => {
  switch (action.type) {
    case 'REMOVE_LOCATION':
      let stateCopy = {...state};
      delete stateCopy[action.locationId];
      return stateCopy;
    default:
      if (action.locationId !== undefined) {
        return {
          ...state,
          ...{[action.locationId]:combinedLocationReducer(state[action.locationId], action)}
        };
      }
      return state;
  }
};