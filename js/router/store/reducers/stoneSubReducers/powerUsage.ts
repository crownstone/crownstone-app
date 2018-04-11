import { combineReducers } from 'redux'
import { update, getTime, refreshDefaults } from '../reducerUtil'
import {Util} from "../../../../util/Util";


let defaultState = {
  cloud: { synced: false },
  data: []
};

let dataState  ={
  power: null,
  powerFactor: null,
  applianceId: null,
  timestamp: 0,
  synced: false,
};


let powerUsageDataReducer = (state = defaultState.data, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_STATE': // this does not sort since the incoming data is brand new.
      if (action.data && action.data.currentUsage !== null && action.data.currentUsage !== undefined && action.data.applianceId !== undefined) {
        let newState = [...state];

        let data : any = {...dataState};
        data.timestamp = getTime(action.data.timestamp || action.updatedAt);
        data.applianceId = action.data.applianceId || null;
        data.power = action.data.currentUsage;
        if (action.data.powerFactor !== undefined && action.data.powerFactor !== null) {
          data.powerFactor = action.data.powerFactor;
        }

        // By setting the synced to null, we tell the system not to sync this point to the cloud
        //   data.synced = null;

        newState.push(data);
        return newState;
      }
      return state;
    case 'ADD_BATCH_POWER_USAGE':
      if (Array.isArray(action.data)) {
        let newState = [...state];

        for ( let i = 0; i < action.data.length; i++) {
          let data : any = { ...dataState };
          data.timestamp = getTime(action.data[i].timestamp || action.updatedAt);
          data.applianceId = action.data[i].applianceId || null;
          data.power = action.data[i].power;
          if (action.data[i].powerFactor !== undefined && action.data[i].powerFactor !== null) {
            data.powerFactor = action.data[i].powerFactor;
          }

          newState.push(data);
        }

        newState.sort((a,b) => {return a.timestamp - b.timestamp});
        return newState;
      }
      return state;
    case 'ADD_POWER_USAGE':
      if (action.data && action.data.power !== null && action.data.power !== undefined) {
        let newState = [...state];

        let data : any = {...dataState};
        data.timestamp = getTime(action.data.timestamp || action.updatedAt);
        data.applianceId = action.data.applianceId || null;
        data.synced = update(action.data.synced, data.synced);
        data.power = action.data.power;
        if (action.data.powerFactor !== undefined && action.data.powerFactor !== null) {
          data.powerFactor = action.data.powerFactor;
        }

        newState.push(data);

        newState.sort((a,b) => {return a.timestamp - b.timestamp});
        return newState;
      }
      return state;
    case 'SET_BATCH_SYNC_POWER_USAGE': {
      if (action.data && action.data.indices) {
        let newState = [...state];

        let syncState = action.data.sync;
        if (syncState === undefined) {
          syncState = true;
        }

        for (let i = 0; i < action.data.indices.length; i++) {
          newState[action.data.indices[i]].synced = syncState;
        }

        return newState;
      }
    }
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, dataState);
    default:
      return state;
  }
};

let powerUsageCloudReducer = (state = defaultState.cloud, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_STATE': // this action is only used for measurement from advertisements
      let newState = {...state};
      newState.synced = false;
      return newState;
    case 'SET_DAY_SYNC_POWER_USAGE': {
      if (action.data) {
        let newState = {...state};
        newState.synced = update(action.data.synced, newState.synced);
        return newState;
      }
    }
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultState.cloud);
    default:
      return state;
  }
};



let combinedPowerUsageReducer = combineReducers({
  cloud: powerUsageCloudReducer,
  data: powerUsageDataReducer,
});


// powerUsageReducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_ALL_POWER_USAGE':
      return {};
    case 'REMOVE_POWER_USAGE_DATE':
      if (action.dateId) {
        let newState = {...state};
        delete newState[action.dateId];
        return newState;
      }
      return state;
    case 'UPDATE_STONE_STATE': // this action is only used for measurement from advertisements
      if (action.data && action.data.currentUsage !== undefined && action.updatedAt) {
        let dateId = Util.getDateHourId(action.updatedAt);
        if (dateId !== 'unknown') {
          return {
            ...state,
            ...{[dateId]: combinedPowerUsageReducer(state[dateId], action)}
          };
        }
      }
      return state;
    case 'SET_BATCH_SYNC_POWER_USAGE':
      if (action.dateId !== undefined) {
        let newState = {
          ...state,
          ...{[action.dateId]: combinedPowerUsageReducer(state[action.dateId], action)}
        };

        // check hour sync state:
        if (action.dateId !== Util.getDateHourId(new Date().valueOf())) {
          let allSynced = true;
          // we can't really binary search this since due to crashes or quits, this set can have an un-synced gap.
          for (let i = 0; i < newState[action.dateId].data.length; i++) {
            if (newState[action.dateId].data[i].synced === false) {
              allSynced = false;
              break;
            }
          }

          if (allSynced) {
            newState[action.dateId] = combinedPowerUsageReducer(newState[action.dateId], {
              type: "SET_DAY_SYNC_POWER_USAGE",
              data: {synced: true}
            });
          }
        }

        return newState;
      }
      return state;
    default:
      if (action.dateId !== undefined) {
        return {
          ...state,
          ...{[action.dateId]: combinedPowerUsageReducer(state[action.dateId], action)}
        };
      }
      return state;
  }
};
