import { combineReducers } from 'redux'
import { update, getTime, refreshDefaults, idReducerGenerator } from "./reducerUtil";


let defaultFingerprintData: FingerprintData = {
  id:                    null,
  cloudId:               null,
  type:                  null,
  createdOnDeviceType:   null, // ${device type string}_${userId who collected it}
  crownstonesAtCreation: [], // maj_min as id representing the Crownstone.
  data:                  [],
  updatedAt:             0,
  createdAt:             0,
}



const fingerprintDataReducer = (state = defaultFingerprintData, action : any = {}) => {
  switch (action.type) {
    case "UPDATE_FINGERPRINT_V2_CLOUD_ID":
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
    case 'ADD_FINGERPRINT_V2':
    case 'UPDATE_FINGERPRINT_V2':
      if (action.data) {
        let newState = {...state};
        if (newState.id === null) { newState.id = action.fingerprintId; }

        newState.cloudId               = update(action.data.cloudId, newState.cloudId);
        newState.type                  = update(action.data.type, newState.type);
        newState.createdOnDeviceType   = update(action.data.createdOnDeviceType, newState.createdOnDeviceType);
        newState.crownstonesAtCreation = update(action.data.crownstonesAtCreation, newState.crownstonesAtCreation);
        newState.data                  = update(action.data.data, newState.data);

        newState.updatedAt             = getTime(action.data.updatedAt);
        newState.createdAt             = getTime(action.data.createdAt);
        return newState;
      }
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultFingerprintData);
    default:
      return state;
  }
}



let fingerprintReducer = (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_FINGERPRINT_V2':
      if (action.fingerprintId) {
        let newState = {...state};
        delete newState[action.fingerprintId];
        return newState;
      }
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
  crownstonesAtCreation:   [], // maj_min as id representing the Crownstone.
  data:                    [],
  processingParameterHash: null, // this contains the parameters used to process the data. (sigmoid)
  transformedAt:           0,  // if the transform data has changed since the last time it was transformed, repeat the transform.
  processedAt:             0,  // if the base fingerprint has changed since the processing time, update the processed fingerprint.
  createdAt:               0,
}


const fingerprintProcessedDataReducer = (state = defaultProcessedFingerprintData, action : any = {}) => {
  switch (action.type) {
    case 'ADD_PROCESSED_FINGERPRINT':
    case 'UPDATE_PROCESSED_FINGERPRINT':
      if (action.data) {
        let newState = {...state};
        if (newState.id === null) { newState.id = action.fingerprintId; }
        newState.fingerprintId           = update(action.data.fingerprintId, newState.fingerprintId);
        newState.type                    = update(action.data.type, newState.type);
        newState.transformState          = update(action.data.transformState, newState.transformState);
        newState.crownstonesAtCreation   = update(action.data.crownstonesAtCreation, newState.crownstonesAtCreation);
        newState.data                    = update(action.data.data, newState.data);
        newState.processingParameterHash = update(action.data.processingParameterHash, newState.processingParameterHash);

        newState.transformedAt           = getTime(action.data.transformedAt);
        newState.processedAt             = getTime(action.data.processedAt);
        newState.createdAt               = getTime(action.data.createdAt);
      }
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultFingerprintData);
    default:
      return state;
  }
}



const fingerprintProcessedReducer = (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_PROCESSED_FINGERPRINT':
      if (action.fingerprintProcessedId) {
        let newState = {...state};
        delete newState[action.fingerprintProcessedId];
        return newState;
      }
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


