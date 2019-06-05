import { update, getTime, refreshDefaults } from './reducerUtil'

let dataState = {
  key: null,
  keyType: null,
  createdAt: 0,
  ttl: 0
};

let keyReducer = (state = dataState, action : any = {}) => {
  switch (action.type) {
    case 'ADD_SPHERE_KEY':
    case 'UPDATE_SPHERE_KEY':
      if (action.data) {
        let newState = {...state};
        newState.key       = update( action.data.key,       newState.key);
        newState.keyType   = update( action.data.keyType,   newState.keyType);
        newState.createdAt = update( action.data.createdAt, newState.createdAt);
        newState.ttl       = update( action.data.ttl,       newState.ttl);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, dataState);
    default:
      return state;
  }
};

// stoneKeyReducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case "REMOVE_SPHERE_KEY":
      let stateCopy = {...state};
      delete stateCopy[action.keyId];
      return stateCopy;
    default:
      if (action.keyId !== undefined) {
        if (state[action.keyId] !== undefined || action.type === "ADD_SPHERE_KEY") {
          return {
            ...state,
            ...{[action.keyId]: keyReducer(state[action.keyId], action)}
          };
        }
      }
      return state;
  }
};

