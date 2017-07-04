import { createStore, combineReducers } from 'redux'
import { update, getTime, refreshDefaults } from './reducerUtil'
import { LOG } from '../../../logging/Log'
import { updateToggleState, toggleState, toggleStateAway } from './shared'
import {Util} from "../../../util/Util";


let defaultState = [];

let dayState  ={
  power: null,
  applianceId: null,
  timestamp: 0,
};


let powerUsageDayReducer = (state = defaultState, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_STATE_DUPLICATE': // this does not sort since the incoming data is brand new.
    case 'UPDATE_STONE_STATE': // this does not sort since the incoming data is brand new.
      if (action.data && action.data.currentUsage !== null && action.data.currentUsage !== undefined && action.data.applianceId !== undefined) {
        let newState = [...state];

        let data : any = {};
        data.timestamp = getTime(action.data.timestamp || action.updatedAt);
        data.applianceId = action.data.applianceId || null;
        data.power = action.data.currentUsage;

        newState.push(data);
        return newState;
      }
      return state;
    case 'ADD_POWER_USAGE':
      if (action.data && action.data.power !== null && action.data.power !== undefined) {
        let newState = [...state];
        let data = {...action.data};
        data.timestamp = getTime(action.data.timestamp);
        data.applianceId = action.data.applianceId || null;
        newState.push(action.data);

        newState.sort((a,b) => {return a.timestamp - b.timestamp});
        return newState;
      }
      return state;
    default:
      return state;
  }
};

// powerUsageReducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_ALL_POWER_USAGE':
      return {};
    case 'REMOVE_POWER_USAGE_DAY':
      let stateCopy = {...state};
      delete stateCopy[action.dateId];
      return stateCopy;
    case 'UPDATE_STONE_STATE':           // this action is only used for measurement from advertisements
    case 'UPDATE_STONE_STATE_DUPLICATE': // this action is only used for measurement from advertisements if the data does not change.
      if (action.data && action.data.currentUsage !== undefined && action.updatedAt) {
        let dateId = Util.getDateFormat(action.updatedAt);
        if (dateId !== 'unknown') {
          return {
            ...state,
            ...{[dateId]: powerUsageDayReducer(state[dateId], action)}
          };
        }
      }
      return state;
    default:
      if (action.dateId !== undefined) {
        return {
          ...state,
          ...{[action.dayId]: powerUsageDayReducer(state[action.dateId], action)}
        };
      }
      return state;
  }
};