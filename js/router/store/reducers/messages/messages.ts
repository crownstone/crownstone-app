import { update, getTime, refreshDefaults } from '../reducerUtil'
import { combineReducers } from 'redux'

let defaultState = {
  content : null,
  sender  : null,
  sent    : false,
  sentAt  : 1,
};

// messageReducer
const messageDataReducer = (state = defaultState, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_MESSAGE':
      let newState = {...state};
      newState.content = update(action.data.content, newState.content);
      newState.sent    = update(action.data.sent, newState.sent);
      return newState;
    case 'ADD_MESSAGE':
    case 'ADD_THREAD':
      newState = {...state};
      newState.content = update(action.data.content, newState.content);
      newState.sender  = update(action.data.sender, newState.sender);
      newState.sent    = update(action.data.sent, newState.sent);
      newState.sentAt  = getTime(action.data.sentAt);
      return newState;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultState);
    default:
      return state;
  }
};


// messageReducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_MESSAGE':
      let newState = {...state};
      delete newState[action.messageId];
      return newState;
    default:
      if (action.messageId !== undefined) {
        if (state[action.messageId] !== undefined || action.type === "ADD_MESSAGE" || action.type === "ADD_THREAD") {
          return {
            ...state,
            ...{[action.messageId]: messageDataReducer(state[action.messageId], action)}
          };
        }
      }
      return state;
  }
};