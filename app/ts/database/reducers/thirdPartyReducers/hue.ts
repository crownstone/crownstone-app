import {getTime, refreshDefaults, update} from "../reducerUtil";
import { combineReducers } from "redux";

let defaultBridgeSettings = {
  id: undefined,
  name: 'Philips Hue Bridge',
  type: null,
  hueId: null,
  hueName: 'Philips Hue Bridge',
  cloudId: null,
  reachable: false,
  macAddress: null,
  ipAddress: null,
  updatedAt: 0,
};

// hueReducer
let hueBridgeReducer = (state = defaultBridgeSettings, action : any = {}) => {
  switch (action.type) {
    case 'INJECT_IDS':
      let newState = {...state};
      newState.id = action.hueBridgeId;
      return newState;
    case "UPDATE_HUE_BRIDGE_CLOUD_ID":
      if (action.data) {
        let newState = {...state};
        return newState;
      }
      return state;
    case 'ADD_HUE_BRIDGE':
    case 'UPDATE_HUE_BRIDGE':
      if (action.data) {
        let newState = {...state};
        if (action.type === 'ADD_HUE_BRIDGE') {
          newState.id = action.hueBridgeId;
        }
        newState.name       = update(action.data.name,          newState.name);
        newState.hueName    = update(action.data.hueName,       newState.hueName);
        newState.cloudId    = update(action.data.cloudId,       newState.cloudId);
        newState.reachable  = update(action.data.reachable,     newState.reachable);
        newState.macAddress = update(action.data.macAddress,    newState.macAddress);
        newState.ipAddress  = update(action.data.ipAddress,     newState.ipAddress);

        newState.updatedAt  = getTime(action.data.timestamp || action.updatedAt);

        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultBridgeSettings);
    default:
      return state;
  }
};


let defaultLightSettings = {
  id: undefined,
  name: null,
  type: null,
  hueId: null,
  hueName: null,
  hasWhiteTemperature: false,
  hasRGB: false,
  cloudId: null,
  reachable: false,
  colorMode: false,
  colorTemperature: 0,
  locationId: null,
  hue: 0,
  saturation: 0,
  brightness: 0,
  updatedAt: 0,
};


// hue lights Reducer
let hueLightReducer = (state = defaultLightSettings, action : any = {}) => {
  switch (action.type) {
    case 'INJECT_IDS':
      let newState = {...state};
      newState.id = action.hueLightId;
      return newState;
    case "UPDATE_HUE_LIGHT_CLOUD_ID":
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'ADD_HUE_LIGHT':
    case 'UPDATE_HUE_LIGHT':
      if (action.data) {
        let newState = {...state};
        if (action.type === 'ADD_HUE_LIGHT') {
          newState.id = action.hueLightId;
        }

        newState.name                = update(action.data.name,                newState.name);
        newState.hueName             = update(action.data.hueName,             newState.hueName);
        newState.hasWhiteTemperature = update(action.data.hasWhiteTemperature, newState.hasWhiteTemperature);
        newState.hasRGB              = update(action.data.hasRGB,              newState.hasRGB);
        newState.reachable           = update(action.data.reachable,           newState.reachable);
        newState.cloudId             = update(action.data.cloudId,             newState.cloudId);
        newState.colorMode           = update(action.data.colorMode,           newState.colorMode);
        newState.colorTemperature    = update(action.data.colorTemperature,    newState.colorTemperature);
        newState.hue                 = update(action.data.hue,                 newState.hue);
        newState.saturation          = update(action.data.saturation,          newState.saturation);
        newState.brightness          = update(action.data.brightness,          newState.brightness);
        newState.updatedAt           = getTime(action.data.timestamp || action.updatedAt);

        return newState;
      }
      return state;
    case 'UPDATE_HUE_LIGHT_STATE':
      if (action.data) {
        let newState = {...state};
        newState.colorMode           = update(action.data.colorMode,          newState.colorMode);
        newState.colorTemperature    = update(action.data.colorTemperature,   newState.colorTemperature);
        newState.hue                 = update(action.data.hue,                newState.hue);
        newState.saturation          = update(action.data.saturation,         newState.saturation);
        newState.brightness          = update(action.data.brightness,         newState.brightness);
        newState.updatedAt           = getTime(action.data.timestamp || action.updatedAt);

        return newState;
      }
      return state;
    case 'UPDATE_HUE_LIGHT_AVAILABILITY':
      if (action.data) {
        let newState = {...state};
        newState.reachable           = update(action.data.available, newState.reachable);

        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultBridgeSettings);
    default:
      return state;
  }
};


// hue reducer
function hueLightCollectionReducer(state = {}, action : any = {}) {
  switch (action.type) {
    case 'REMOVE_HUE_LIGHT':
      let stateCopy = {...state};
      delete stateCopy[action.hueLightId];
      return stateCopy;
    case 'REMOVE_ALL_HUE_LIGHTS':
      return {};
    default:
      if (action.hueLightId !== undefined) {
        if (state[action.hueLightId] !== undefined || action.type === "ADD_HUE_LIGHT") {
          return {
            ...state,
            ...{[action.hueLightId]: hueLightReducer(state[action.hueLightId], action)}
          };
        }
      }
      return state;
  }
}


let combinedSphereReducer = combineReducers({
  bridge: hueBridgeReducer,
  lights: hueLightCollectionReducer,
});


// hue reducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_HUE_BRIDGE':
      let stateCopy = {...state};
      delete stateCopy[action.hueBridgeId];
      return stateCopy;
    case 'REMOVE_ALL_HUE_BRIDGES':
      return {};
    default:
      if (action.hueBridgeId !== undefined) {
        if (state[action.hueBridgeId] !== undefined || action.type === "ADD_HUE_BRIDGE") {
          return {
            ...state,
            ...{[action.hueBridgeId]: combinedSphereReducer(state[action.hueBridgeId], action)}
          };
        }
      }
      return state;
  }
};



