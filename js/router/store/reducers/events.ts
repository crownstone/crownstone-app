import { update, getTime, refreshDefaults } from './reducerUtil'
import { combineReducers } from 'redux'

let itemSettings = {
  sphereId: null,
  cloudId: null,
  specialType: null,
};

let getReducer = (changeType) => {
  let itemReducerCreator = (itemType) => {
    let itemReducer = (state = itemSettings, action : any = {}) => {
      switch (action.type) {
        case 'CLOUD_EVENT_' + changeType + '_' + itemType:
          if (action.sphereId && action.cloudId) {
            let newState = {...state};
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


    return (state = itemSettings, action : any = {}) => {
      switch (action.type) {
        case 'FINISHED_' + changeType + '_' + itemType:
          let stateCopy = {...state};
          delete stateCopy[action.stoneId];
          return stateCopy;
        default:
          if (action.id !== undefined) {
            if (state[action.id] !== undefined) {
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
 * FINISHED_EVENT_CREATE_APPLIANCES
 * FINISHED_EVENT_CREATE_LOCATIONS
 * FINISHED_EVENT_CREATE_STONES
 * FINISHED_EVENT_CREATE_SCHEDULES
 * FINISHED_EVENT_CREATE_INSTALLATIONS
 * FINISHED_EVENT_CREATE_DEVICES
 * FINISHED_EVENT_CREATE_MESSAGES
 *
 * FINISHED_EVENT_UPDATE_APPLIANCES
 * FINISHED_EVENT_UPDATE_LOCATIONS
 * FINISHED_EVENT_UPDATE_STONES
 * FINISHED_EVENT_UPDATE_SCHEDULES
 * FINISHED_EVENT_UPDATE_INSTALLATIONS
 * FINISHED_EVENT_UPDATE_DEVICES
 * FINISHED_EVENT_UPDATE_MESSAGES
 *
 * FINISHED_EVENT_REMOVE_APPLIANCES
 * FINISHED_EVENT_REMOVE_LOCATIONS
 * FINISHED_EVENT_REMOVE_STONES
 * FINISHED_EVENT_REMOVE_SCHEDULES
 * FINISHED_EVENT_REMOVE_INSTALLATIONS
 * FINISHED_EVENT_REMOVE_DEVICES
 * FINISHED_EVENT_REMOVE_MESSAGES
 */

