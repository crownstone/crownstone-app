import { update, refreshDefaults } from './reducerUtil'

let dataState : EncryptionKeyData = {
  id: undefined,
  key: null,
  keyType: null,
  createdAt: 0,
  ttl: 0
};

let keyReducer = (state = dataState, action : any = {}) => {
  switch (action.type) {
    case 'INJECT_IDS':
      let newState = {...state};
      newState.id = action.keyId;
      return newState;
    case 'ADD_SPHERE_KEY':
    case 'UPDATE_SPHERE_KEY':
      if (action.data) {
        let newState = {...state};
        if (action.type === 'ADD_SPHERE_KEY') {
          newState.id = action.keyId;
        }
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

