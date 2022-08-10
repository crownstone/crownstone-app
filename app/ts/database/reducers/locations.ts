import { combineReducers } from 'redux'
import { update, getTime, refreshDefaults, idReducerGenerator } from "./reducerUtil";
import fingerprintReducer from './fingerprints'

let defaultSettings : LocationData = {
  id: undefined,
  config: {
    name:'Untitled Room',
    icon: undefined,
    uid: null,
    picture: null,
    pictureTaken: null,
    pictureId: null,
    pictureSource: null,

    cloudId: null,
    updatedAt: 1,

    fingerprintCloudId: null,
    fingerprintRaw: null,
    fingerprintParsed: null,
    fingerprintUpdatedAt: 1,
  },
  fingerprints: {
    raw: {},
    processed: {},
  },
  presentUsers: [],
  layout: {
    x: null,
    y: null,
  }
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
        newState.uid     = update(action.data.uid, newState.uid);
        return newState;
      }
      return state;
    case 'REMOVE_LOCATION_FINGERPRINT':
      let newState = {...state};
      newState.fingerprintRaw = null;
      newState.fingerprintParsed = null;
      newState.fingerprintCloudId = null;
      newState.fingerprintUpdatedAt = null;
      return newState;
    case 'UPDATE_LOCATION_FINGERPRINT':
      if (action.data) {
        let newState = {...state};
        newState.fingerprintRaw    = update(action.data.fingerprintRaw,      newState.fingerprintRaw);
        newState.fingerprintParsed = update(action.data.fingerprintParsed,   newState.fingerprintParsed);
        newState.fingerprintCloudId = update(action.data.fingerprintCloudId, newState.fingerprintCloudId);
        newState.fingerprintUpdatedAt = getTime(action.data.fingerprintUpdatedAt);
        return newState;
      }
      return state;
    case 'UPDATE_NEW_LOCATION_FINGERPRINT':
      if (action.data) {
        let newState = {...state};
        newState.fingerprintRaw    = update(action.data.fingerprintRaw,      newState.fingerprintRaw);
        newState.fingerprintParsed = update(action.data.fingerprintParsed,   newState.fingerprintParsed);
        newState.fingerprintCloudId = null;
        newState.fingerprintUpdatedAt = getTime(action.data.fingerprintUpdatedAt);
        return newState;
      }
      return state;
    case 'UPDATE_LOCATION_FINGERPRINT_CLOUD_ID':
      if (action.data) {
        let newState = {...state};
        newState.fingerprintCloudId = update(action.data.fingerprintCloudId, newState.fingerprintCloudId);
        return newState;
      }
      return state;
    case 'ADD_LOCATION':
    case 'UPDATE_LOCATION_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.name               = update(action.data.name,              newState.name);
        newState.uid                = update(action.data.uid,               newState.uid);
        newState.icon               = update(action.data.icon,              newState.icon);
        newState.cloudId            = update(action.data.cloudId,           newState.cloudId);
        newState.picture            = update(action.data.picture,           newState.picture);
        newState.pictureTaken       = update(action.data.pictureTaken,      newState.pictureTaken);
        newState.pictureSource      = update(action.data.pictureSource,     newState.pictureSource);
        newState.pictureId          = update(action.data.pictureId,         newState.pictureId);
        newState.fingerprintRaw     = update(action.data.fingerprintRaw,    newState.fingerprintRaw);
        newState.fingerprintParsed  = update(action.data.fingerprintParsed, newState.fingerprintParsed);
        newState.updatedAt          = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'LOCATION_UPDATE_PICTURE':
      if (action.data) {
        let newState = {...state};
        newState.picture       = update(action.data.picture,       newState.picture);
        newState.pictureId     = update(action.data.pictureId,     newState.pictureId);
        newState.pictureSource = update(action.data.pictureSource, newState.pictureSource);
        return newState;
      }
      return state;
    case 'LOCATION_REPAIR_PICTURE':
      newState = {...state};
      if (newState.pictureSource !== "STOCK") {
        newState.picture = null;
        newState.pictureId = null;
        newState.updatedAt = 0;
      }
      return newState;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings.config);
    default:
      return state;
  }
};


let layoutReducer = (state = defaultSettings.layout, action : any = {}) => {
  switch (action.type) {
    case 'SET_LOCATION_POSITIONS':
      if (action.data) {
        let newState = {...state};
        newState.x = update(action.data.x, newState.x);
        newState.y = update(action.data.y, newState.y);
        return newState;
      }
      return state;
    case 'CLEAR_LOCATION_POSITIONS':
      let newState = {...state};
      newState.x = null;
      newState.y = null;
      return newState;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings.layout);
    default:
      return state;
  }
};

let combinedLocationReducer = combineReducers({
  id:           idReducerGenerator("ADD_LOCATION", "locationId"),
  config:       locationConfigReducer,
  presentUsers: userPresenceReducer,
  fingerprints: fingerprintReducer,
  layout:       layoutReducer
});


// locationsReducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_SPHERE_USER':
    case 'USER_EXIT_SPHERE':
      if (action.userId) {
        // we need to remove the user from all locations before removing him from sphere.
        let locationIds = Object.keys(state);
        locationIds.forEach((locationId) => {
          let location = state[locationId];
          if (location.presentUsers.includes(action.userId)) {
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
