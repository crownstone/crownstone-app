import { update, getTime, refreshDefaults } from './reducerUtil'
import { combineReducers } from 'redux'

let itemSettings = {
  localId: null,
  sphereId: null,
  cloudId: null,
  specialType: null,
};


let getItemReducer = function(changeType, itemType) {
  return (state = {...itemSettings}, action : any = {}) => {
    switch (action.type) {
      case 'CLOUD_EVENT_' + changeType + '_' + itemType:
        if (action.sphereId && action.cloudId) {
          let newState = {...state};
          newState.localId     = update(action.localId,    newState.localId);
          newState.sphereId    = update(action.sphereId,    newState.sphereId);
          newState.cloudId     = update(action.cloudId,     newState.cloudId);
          newState.specialType = update(action.specialType, newState.specialType);
          return newState;
        }
        return state;
      default:
        return state;
    }
  };
};


let getReducer = (changeType) => {
  let itemReducerCreator = (itemType) => {
    let itemReducer = getItemReducer(changeType, itemType);
    

    return (state = {}, action : any = {}) => {
      switch (action.type) {
        case 'REMOVE_ALL_EVENTS':
          return {};
        case 'FINISHED_' + changeType + '_' + itemType:
          if (action.id && state[action.id]) {
            let newState = {...state};
            delete newState[action.id];
            return newState;
          }
          return state;
        default:
          if (action.id !== undefined) {
            if (state[action.id] !== undefined || action.type === 'CLOUD_EVENT_' + changeType + '_' + itemType) {
              return {
                ...state,
                ...{[action.id]: itemReducer(state[action.id], action)}
              };
            }
          }
          return state;
      }
    };
  };

  return combineReducers({
    appliances:    itemReducerCreator('APPLIANCES'),
    locations:     itemReducerCreator('LOCATIONS'),
    stones:        itemReducerCreator('STONES'),
    schedules:     itemReducerCreator('SCHEDULES'),
    installations: itemReducerCreator('INSTALLATIONS'),
    devices:       itemReducerCreator('DEVICES'),
    messages:      itemReducerCreator('MESSAGES'),
  })
};




export default combineReducers({
  create:  getReducer("CREATE"),
  update:  getReducer("UPDATE"),
  remove:  getReducer("REMOVE"),
  special: getReducer("SPECIAL"),
});

/**
 * // to add events to the database:
 *
 * CLOUD_EVENT_CREATE_APPLIANCES
 * CLOUD_EVENT_CREATE_LOCATIONS
 * CLOUD_EVENT_CREATE_STONES
 * CLOUD_EVENT_CREATE_SCHEDULES
 * CLOUD_EVENT_CREATE_INSTALLATIONS
 * CLOUD_EVENT_CREATE_DEVICES
 * CLOUD_EVENT_CREATE_MESSAGES
 *
 * CLOUD_EVENT_UPDATE_APPLIANCES
 * CLOUD_EVENT_UPDATE_LOCATIONS
 * CLOUD_EVENT_UPDATE_STONES
 * CLOUD_EVENT_UPDATE_SCHEDULES
 * CLOUD_EVENT_UPDATE_INSTALLATIONS
 * CLOUD_EVENT_UPDATE_DEVICES
 * CLOUD_EVENT_UPDATE_MESSAGES
 *
 * CLOUD_EVENT_REMOVE_APPLIANCES
 * CLOUD_EVENT_REMOVE_LOCATIONS
 * CLOUD_EVENT_REMOVE_STONES
 * CLOUD_EVENT_REMOVE_SCHEDULES
 * CLOUD_EVENT_REMOVE_INSTALLATIONS
 * CLOUD_EVENT_REMOVE_DEVICES
 * CLOUD_EVENT_REMOVE_MESSAGES
 *
 * // to throw the events out of the database:
 *
 * FINISHED_CREATE_APPLIANCES
 * FINISHED_CREATE_LOCATIONS
 * FINISHED_CREATE_STONES
 * FINISHED_CREATE_SCHEDULES
 * FINISHED_CREATE_INSTALLATIONS
 * FINISHED_CREATE_DEVICES
 * FINISHED_CREATE_MESSAGES
 *
 * FINISHED_UPDATE_APPLIANCES
 * FINISHED_UPDATE_LOCATIONS
 * FINISHED_UPDATE_STONES
 * FINISHED_UPDATE_SCHEDULES
 * FINISHED_UPDATE_INSTALLATIONS
 * FINISHED_UPDATE_DEVICES
 * FINISHED_UPDATE_MESSAGES
 *
 * FINISHED_REMOVE_APPLIANCES
 * FINISHED_REMOVE_LOCATIONS
 * FINISHED_REMOVE_STONES
 * FINISHED_REMOVE_SCHEDULES
 * FINISHED_REMOVE_INSTALLATIONS
 * FINISHED_REMOVE_DEVICES
 * FINISHED_REMOVE_MESSAGES
 */

