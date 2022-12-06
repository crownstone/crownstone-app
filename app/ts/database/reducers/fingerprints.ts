import { combineReducers } from 'redux'
import { update, getTime, refreshDefaults, idReducerGenerator } from "./reducerUtil";


let defaultFingerprintData: FingerprintData = {
  id:                    null,
  cloudId:               null,
  type:                  null,
  createdOnDeviceType:   null, // ${device type string}
  exclusive:             false, // ${device type string}
  createdByUser:         null, // ${userId who collected it}
  crownstonesAtCreation: {}, // maj_min as id representing the Crownstone.
  data:                  [],
  updatedAt:             0,
  createdAt:             0,
}



const fingerprintDataReducer = (state = defaultFingerprintData, action : DatabaseAction = {}) => {
  switch (action.type) {
    case "UPDATE_FINGERPRINT_V2_CLOUD_ID":
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'ADD_FINGERPRINT_V2':
    case 'UPDATE_FINGERPRINT_V2':
      if (action.data) {
        let newState = {...state};
        if (newState.id === null) { newState.id = action.fingerprintId; }

        newState.cloudId               = update(action.data.cloudId, newState.cloudId);
        newState.type                  = update(action.data.type, newState.type);
        newState.exclusive             = update(action.data.exclusive, newState.exclusive);
        newState.createdOnDeviceType   = update(action.data.createdOnDeviceType, newState.createdOnDeviceType);
        newState.createdByUser         = update(action.data.createdByUser, newState.createdByUser);
        newState.crownstonesAtCreation = update(action.data.crownstonesAtCreation, newState.crownstonesAtCreation);
        newState.data                  = update(action.data.data, newState.data);

        newState.updatedAt             = getTime(action.data.updatedAt);

        if (action.type === 'ADD_FINGERPRINT_V2') {
          newState.createdAt = getTime(action.data.createdAt);
        }
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultFingerprintData);
    default:
      return state;
  }
}



let fingerprintReducer = (state = {}, action : DatabaseAction = {}) => {
  switch (action.type) {
    case 'REMOVE_ALL_FINGERPRINTS_V2':
      return {};
    case 'REMOVE_FINGERPRINT_V2':
      if (action.fingerprintId) {
        let newState = {...state};
        delete newState[action.fingerprintId];
        return newState;
      }
      return state;
    default:
      // create a new fingerprint if it doesn't exist
      if (action.fingerprintId !== undefined && action.fingerprintId !== null) {
        if (state[action.fingerprintId] !== undefined || action.type === "ADD_FINGERPRINT_V2") {
          return {
            ...state,
            ...{[action.fingerprintId]: fingerprintDataReducer(state[action.fingerprintId], action)}
          };
        }
      }
      return state;
  }
};


let defaultProcessedFingerprintData: FingerprintProcessedData = {
  id:                      null,
  fingerprintId:           null, // processed based on parent id
  type:                    null,
  transformState:          null,
  createdOnDeviceType:     null, // ${device type string}
  createdByUser:           null, // ${userId who collected it}
  crownstonesAtCreation:   {}, // maj_min as id representing the Crownstone.
  data:                    [],
  processingParameterHash: null, // this contains the parameters used to process the data. (sigmoid)
  transformedAt:           0,  // if the transform data has changed since the last time it was transformed, repeat the transform.
  processedAt:             0,  // if the base fingerprint has changed since the processing time, update the processed fingerprint.
  createdAt:               0,
}


const fingerprintProcessedDataReducer = (state = defaultProcessedFingerprintData, action : DatabaseAction = {}) => {
  switch (action.type) {
    case 'ADD_PROCESSED_FINGERPRINT':
    case 'UPDATE_PROCESSED_FINGERPRINT':
      if (action.data) {
        let newState = {...state};
        if (newState.id === null) { newState.id = action.fingerprintProcessedId; }
        newState.fingerprintId           = update(action.data.fingerprintId,           newState.fingerprintId);
        newState.type                    = update(action.data.type,                    newState.type);
        newState.transformState          = update(action.data.transformState,          newState.transformState);
        newState.crownstonesAtCreation   = update(action.data.crownstonesAtCreation,   newState.crownstonesAtCreation);
        newState.data                    = update(action.data.data,                    newState.data);
        newState.processingParameterHash = update(action.data.processingParameterHash, newState.processingParameterHash);

        newState.createdOnDeviceType   = update(action.data.createdOnDeviceType, newState.createdOnDeviceType);
        newState.createdByUser         = update(action.data.createdByUser, newState.createdByUser);

        newState.transformedAt           = getTime(action.data.transformedAt);
        newState.processedAt             = getTime(action.data.processedAt);

        if (action.type === 'ADD_PROCESSED_FINGERPRINT') {
          newState.createdAt = getTime(action.data.createdAt);
        }
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultFingerprintData);
    default:
      return state;
  }
}



const fingerprintProcessedReducer = (state = {}, action : DatabaseAction = {}) => {
  switch (action.type) {
    case 'REMOVE_ALL_FINGERPRINTS_V2':
      return {};
    case 'REMOVE_ALL_PROCESSED_FINGERPRINTS':
      return {};
    case 'REMOVE_PROCESSED_FINGERPRINT':
      if (action.fingerprintProcessedId) {
        let newState = {...state};
        delete newState[action.fingerprintProcessedId];
        return newState;
      }
    case 'REMOVE_FINGERPRINT_V2':
      if (action.fingerprintId) {
        for (let fingerprintProcessedId in state) {
          if (state[fingerprintProcessedId].fingerprintId === action.fingerprintId) {
            let newState = {...state};
            delete newState[fingerprintProcessedId];
            return newState;
          }
        }
      }
      return state;
    default:
      // create a new fingerprint if it doesn't exist
      if (action.fingerprintProcessedId !== undefined && action.fingerprintProcessedId !== null) {
        if (state[action.fingerprintProcessedId] !== undefined || action.type === "ADD_PROCESSED_FINGERPRINT") {
          return {
            ...state,
            ...{[action.fingerprintProcessedId]: fingerprintProcessedDataReducer(state[action.fingerprintProcessedId], action)}
          };
        }
      }
      return state;
  }
};



export default combineReducers({
  raw:       fingerprintReducer,
  processed: fingerprintProcessedReducer
});


