import { createStore, combineReducers } from 'redux'
import { update, getTime, refreshDefaults } from './reducerUtil'
import {LOG} from "../../../logging/Log";


let defaultSettings = {
  config: {
    name:'Untitled Room',
    icon: undefined,
    cloudId: null,
    updatedAt: 1,
    fingerprintRaw: null,
    fingerprintParsed: null
  },
  presentUsers: []
};

let userPresenceReducer = (state = [], action : any = {}) => {
  switch (action.type) {
    case 'USER_ENTER_LOCATION':
      if (action.data && action.data.userId) {
        return [...state, action.data.userId];
      }
    case 'USER_EXIT_LOCATION':
      if (action.data && action.data.userId) {
        let userIndex = state.indexOf(action.data.userId);
        if (userIndex !== -1) {
          return [...state.slice(0, userIndex).concat(state.slice(userIndex + 1))]
        }
      }
    case 'CLEAR_USERS_IN_LOCATION':
      return [];
    default:
      return state;
  }
};

let locationConfigReducer = (state = defaultSettings.config, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_LOCATION_CLOUD_ID':
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'REMOVE_LOCATION_FINGERPRINT':
      let newState = {...state};
      newState.fingerprintRaw = null;
      newState.fingerprintParsed = null;
      return newState;
    case 'UPDATE_LOCATION_FINGERPRINT':
      if (action.data) {
        let newState = {...state};
        newState.fingerprintRaw    = update(action.data.fingerprintRaw, newState.fingerprintRaw);
        newState.fingerprintParsed = update(action.data.fingerprintParsed, newState.fingerprintParsed);
        return newState;
      }
      return state;
    case 'ADD_LOCATION':
    case 'UPDATE_LOCATION_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.name               = update(action.data.name, newState.name);
        newState.icon               = update(action.data.icon, newState.icon);
        newState.cloudId            = update(action.data.cloudId,        newState.cloudId);
        newState.fingerprintRaw     = update(action.data.fingerprintRaw, newState.fingerprintRaw);
        newState.fingerprintParsed  = update(action.data.fingerprintParsed, newState.fingerprintParsed);
        newState.updatedAt          = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings.config);
    default:
      return state;
  }
};

let combinedLocationReducer = combineReducers({
  config:       locationConfigReducer,
  presentUsers: userPresenceReducer,
});


// locationsReducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_SPHERE_USER':
      if (action.userId) {
        // we need to remove the user from all locations before removing him from sphere.
        let locationIds = Object.keys(state);
        locationIds.forEach((locationId) => {
          let location = state[locationId];
          if (location.presentUsers.indexOf(action.userId) !== -1) {
            return {
              ...state,
              ...{[locationId]: combinedLocationReducer(state[locationId],
                {type:'USER_EXIT_LOCATION', sphereId: action.sphereId, locationId: locationId, data: {userId: action.userId}})}
            };
          }
        });

        return state;
      }
    case 'REMOVE_LOCATION':
      let stateCopy = {...state};
      delete stateCopy[action.locationId];
      return stateCopy;
    default:
      if (action.locationId !== undefined && action.locationId !== null) {
        if (state[action.locationId] !== undefined || action.type === "ADD_LOCATION") {
          return {
            ...state,
            ...{[action.locationId]: combinedLocationReducer(state[action.locationId], action)}
          };
        }
      }
      return state;
  }
};