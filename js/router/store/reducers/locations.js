import { createStore, combineReducers } from 'redux'
import stonesReducer from './stones'
import { update } from './util'


let defaultSettings = {
  config: {
    name:'Untitled Room',
    icon:'missingIcon'
  },
  picture: {
    fullURI: undefined,
    barURI: undefined,
    squareURI: undefined
  },
};

let pictureLocationReducer = (state = defaultSettings.picture, action = {}) => {
  switch (action.type) {
    case 'ADD_LOCATION_PICTURE':
      return {
        fullURI: action.data.fullURI,
        barURI: action.data.barURI,
        squareURI: action.data.squareURI
      };
    case 'REMOVE_LOCATION_PICTURE':
      return defaultSettings.locationPicture;
    default:
      return state;
  }
};

let userPresenceReducer = (state = [], action = {}) => {
  switch (action.type) {
    default:
      return state;
  }
};

let locationConfigReducer = (state = defaultSettings.config, action = {}) => {
  switch (action.type) {
    case 'ADD_LOCATION':
    case 'UPDATE_LOCATION_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.name = update(action.data.name, newState.name);
        newState.icon = update(action.data.icon, newState.icon);
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
  picture:      pictureLocationReducer,
  stones:       stonesReducer
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