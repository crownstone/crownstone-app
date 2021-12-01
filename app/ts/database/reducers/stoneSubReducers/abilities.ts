import { getTime, refreshDefaults, update } from "../reducerUtil";

export const ABILITY_TYPE_ID = {
  dimming:     'dimming',
  switchcraft: 'switchcraft',
  tapToToggle: 'tapToToggle'
}
export const ABILITY_PROPERTY_TYPE_ID = {
  softOnSpeed: 'softOnSpeed',
  rssiOffset:  'rssiOffset',
}

let abilityFormat : AbilityData = {
  type: null,
  enabled: false,
  enabledTarget: false,
  cloudId: null,
  syncedToCrownstone: true,
  updatedAt: 0,
  properties: {
    // softOnSpeed: 8,
    // rssiOffset = 0
  }
};

let abilityPropertyFormat : AbilityPropertyData = {
  type:        null,
  value:       0,
  valueTarget: 0,
  syncedToCrownstone: true,
  cloudId:     null,
  updatedAt:   0,
};


let abilityReducer = (state = abilityFormat, action) => {
  switch (action.type) {
    case 'UPDATE_ABILITY_AS_SYNCED_FROM_CLOUD':
      if (action.data) {
        let newState = {...state};
        newState.enabled            = update(action.data.enabled,       newState.enabled);
        newState.enabledTarget      = update(action.data.enabledTarget, newState.enabledTarget);
        newState.cloudId            = update(action.data.cloudId,       newState.cloudId);
        newState.syncedToCrownstone = true;
        newState.updatedAt          = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'ADD_STONE':
      if (action.data) {
        let newState = {...state};
        newState.updatedAt          = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'ADD_ABILITY':
      if (action.data) {
        let newState = {...state};
        newState.type               = update(action.data.type,               newState.type);
        newState.enabled            = update(action.data.enabled,            newState.enabled);
        newState.enabledTarget      = update(action.data.enabledTarget,      newState.enabledTarget);
        newState.cloudId            = update(action.data.cloudId,            newState.cloudId);
        newState.syncedToCrownstone = update(action.data.syncedToCrownstone, newState.syncedToCrownstone);
        newState.updatedAt          = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'UPDATE_ABILITY':
      if (action.data) {
        let newState = {...state};
        newState.type               = update(action.data.type,          newState.type);
        newState.enabled            = update(action.data.enabled,       newState.enabled);
        newState.enabledTarget      = update(action.data.enabledTarget, newState.enabledTarget);
        newState.cloudId            = update(action.data.cloudId,       newState.cloudId);
        newState.syncedToCrownstone = false;
        newState.updatedAt          = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case "MARK_ABILITY_AS_SYNCED":
      let newState = {...state};
      newState.syncedToCrownstone = true;
      return newState;
    case "UPDATE_ABILITY_CLOUD_ID":
      newState = {...state};
      newState.cloudId = update(action.data.cloudId, newState.cloudId);
      return newState;
    case "REMOVE_ABILITY_CLOUD_ID":
      newState = {...state};
      newState.cloudId = null;
      return newState;
    case "REFRESH_ABILITIES":
      newState = {...state};
      newState.syncedToCrownstone = false;
      return newState;
    case 'REFRESH_DEFAULTS':
      if (state.properties === undefined) {
        state.properties = {};
      }
      return refreshDefaults(state, abilityFormat);
    default:
      return state;
  }
};


let abilityPropertyReducer = (state = abilityPropertyFormat, action) => {
  switch (action.type) {
    case 'ADD_STONE':
      if (action.data) {
        let newState = {...state};
        newState.updatedAt = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'UPDATE_ABILITY_PROPERTY_AS_SYNCED_FROM_CLOUD':
      if (action.data) {
        let newState = {...state};
        newState.value              = update(action.data.enabled,       newState.value);
        newState.valueTarget        = update(action.data.enabledTarget, newState.valueTarget);
        newState.cloudId            = update(action.data.cloudId,       newState.cloudId);
        newState.syncedToCrownstone = true;
        newState.updatedAt          = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'ADD_ABILITY_PROPERTY':
      if (action.data) {
        let newState = {...state};
        newState.type        = update(action.data.type,        newState.type);
        newState.value       = update(action.data.value,       newState.value);
        newState.valueTarget = update(action.data.valueTarget, newState.valueTarget);
        newState.syncedToCrownstone = update(action.data.syncedToCrownstone, newState.syncedToCrownstone);
        newState.cloudId     = update(action.data.cloudId,     newState.cloudId);
        newState.updatedAt   = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'UPDATE_ABILITY_PROPERTY':
      if (action.data) {
        let newState = {...state};
        newState.type        = update(action.data.type,        newState.type);
        newState.value       = update(action.data.value,       newState.value);
        newState.valueTarget = update(action.data.valueTarget, newState.valueTarget);
        newState.syncedToCrownstone = false;
        newState.cloudId     = update(action.data.cloudId,     newState.cloudId);
        newState.updatedAt   = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case "UPDATE_ABILITY_PROPERTY_CLOUD_ID":
      let newState = {...state};
      newState.cloudId = update(action.data.cloudId,       newState.cloudId);
      return newState;
    case "REMOVE_ABILITY_PROPERTY_CLOUD_ID":
      newState = {...state};
      newState.cloudId = null;
      return newState;
    case "MARK_ABILITY_PROPERTY_AS_SYNCED":
      newState = {...state};
      newState.syncedToCrownstone = true;
      return newState;
    case "REFRESH_ABILITIES":
      newState = {...state};
      newState.syncedToCrownstone = false;
      return newState;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, abilityPropertyFormat);
    default:
      return state;
  }
};

const abilityPropertyReducerHandler = (state = abilityPropertyFormat, action: any = {}) => {
  switch (action.type) {
    case 'REMOVE_ALL_ABILITY_PROPERTIES':
      return {};
    default:
      if (action.propertyId !== undefined) {
        if (state[action.propertyId] !== undefined || action.type === "ADD_ABILITY_PROPERTY") {
          return {
            ...state,
            ...{[action.propertyId]: abilityPropertyReducer(state[action.propertyId], action)}
          };
        }
      }
      return state;
  }
}
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'ADD_STONE':
      let newAbilityState = {
        'dimming':     abilityReducer({...abilityFormat, type: 'dimming'    }, action),
        'switchcraft': abilityReducer({...abilityFormat, type: 'switchcraft'}, action),
        'tapToToggle': abilityReducer({...abilityFormat, type: 'tapToToggle'}, action),
      }

      newAbilityState.dimming.properties     = {softOnSpeed: abilityPropertyReducer({...abilityPropertyFormat, type: 'softOnSpeed', value:8, valueTarget:8}, action)}
      newAbilityState.tapToToggle.properties = {rssiOffset:  abilityPropertyReducer({...abilityPropertyFormat, type: 'rssiOffset'}, action)}

      return newAbilityState;
    case 'REMOVE_ALL_ABILITIES':
      return {};
    default:
      if (action.abilityId !== undefined) {
        if (state[action.abilityId] !== undefined || action.type === "ADD_ABILITY") {
          let abilityState        = abilityReducer(state[action.abilityId], action);

          abilityState.properties = abilityPropertyReducerHandler(abilityState.properties, action);

          return {
            ...state,
            ...{[action.abilityId]: abilityState}
          };
        }
      }
      return state;
  }
};
