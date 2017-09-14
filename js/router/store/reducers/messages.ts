import { update, getTime, refreshDefaults } from './reducerUtil'
import { combineReducers } from 'redux'

/**
 *  this is a list of all actions regarding the thread system.
 *
 *  ADD_MESSAGE      { sphereId, threadId, messageId, data: { sender, content }}
 *  READ_MESSAGE     { sphereId, threadId, messageId, messageId }
 *  RECEIVED_MESSAGE { sphereId, threadId, messageId, messageId }
 *  REMOVE_MESSAGE   { sphereId, threadId, messageId }
 *
 */


// total picture of a thread data structure.
let defaultState = {
  config: {
    triggerLocationId: null,
    triggerEvent: null,
    content: null,
    sender: null,
    sent: false,
    sentAt: 1,
  },
  recipients: { memberId: true },
  received:   { memberId: true },
  read:       { memberId: true },
};


// messageReducer
const configReducer = (state = defaultState.config, action : any = {}) => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      let newState = {...state};
      newState.triggerLocationId = update(action.data.triggerLocationId, newState.triggerLocationId);
      newState.triggerEvent      = update(action.data.triggerEvent,      newState.triggerEvent);
      newState.content           = update(action.data.content,           newState.content);
      newState.sender            = update(action.data.sender,            newState.sender);
      newState.sent              = update(action.data.sent,              newState.sent);
      newState.sentAt            = getTime(action.data.sentAt);
      return newState;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultState);
    default:
      return state;
  }
};

// messageReducer
const recipientsReducer = (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      if (action.data && action.data.memberIds) {
        let memberIds = action.data.memberIds;
        if (memberIds.length > 0) {
          let newState = {...state};
          memberIds.forEach((memberId) => {
            newState[memberId] = true
          });
          return newState;
        }
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultState);
    default:
      return state;
  }
};

// messageReducer
const receivedReducer = (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'RECEIVED_MESSAGE':
      if (action.memberId !== undefined) {
        let newState = {...state};
        newState[action.memberId] = true;
        return newState;
      }
      return state;
    default:
      return state;
  }
};

// messageReducer
const readReducer = (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'READ_MESSAGE':
      if (action.memberId !== undefined) {
        let newState = {...state};
        newState[action.memberId] = true;
        return newState;
      }
      return state;
    default:
      return state;
  }
};


const combinedMessageReducer = combineReducers({
  config:     configReducer,
  recipients: recipientsReducer,
  received:   receivedReducer,
  read:       readReducer,
});



// messageReducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_MESSAGE':
      let newState = {...state};
      delete newState[action.messageId];
      return newState;
    default:
      if (action.messageId !== undefined) {
        if (state[action.messageId] !== undefined || action.type === "ADD_MESSAGE") {
          return {
            ...state,
            ...{[action.messageId]: combinedMessageReducer(state[action.messageId], action)}
          };
        }
      }
      return state;
  }
};