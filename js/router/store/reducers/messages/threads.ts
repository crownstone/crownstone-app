import { update, getTime, refreshDefaults } from '../reducerUtil'
import { combineReducers } from 'redux'
import messageReducer from './messages'
import memberReducer from './members'



/**
 *  this is a list of all actions regarding the thread system.
 *
 *  Add Thread can be used to instantly create a thread, with a message (if [messageId,sender,content] is added) and to add members to the thread (if memberIds is added);
 *  ADD_THREAD       { sphereId, threadId, data: { triggerLocationId } }
 *  ADD_THREAD       { sphereId, threadId, data: { triggerLocationId, memberIds: [] }}
 *  ADD_THREAD       { sphereId, threadId, messageId, data: { triggerLocationId, sender, content }}
 *  ADD_THREAD       { sphereId, threadId, messageId, data: { triggerLocationId, sender, content, memberIds: [] }}
 *  UPDATE_THREAD    { sphereId, threadId, data: { triggerLocationId, updatedAt } }
 *  REMOVE_THREAD    { sphereId, threadId }

 *  ADD_MESSAGE      { sphereId, threadId, messageId, data: { sender, content }}
 *  READ_MESSAGE     { sphereId, threadId, messageId, messageId }
 *  RECEIVED_MESSAGE { sphereId, threadId, messageId, messageId }
 *  REMOVE_MESSAGE   { sphereId, threadId, messageId }
 *  UPDATE_MESSAGE   { sphereId, threadId, messageId, data: { content }}

 *  ADD_MEMBER       { sphereId, threadId, memberId }
 *  REMOVE_MEMBER    { sphereId, threadId, memberId }
 *
 */


export const ALL_MEMBER_ENTRY = "__ALL__";

// total picture of a thread data structure.
let defaultState = {
  config: {
    triggerLocationId: null,
    updatedAt: 1
  },
  messages: {
    messageId: {
      messageContent: null,
      messageSender: null,
      sent: false,
    }
  },
  members: {
    memberId: {
      received: { at: null },
      read:     { at: null },
    },
  },
};



// messageReducer
const messageThreadConfigReducer = (state = defaultState.config, action : any = {}) => {
  switch (action.type) {
    case 'ADD_THREAD':
    case 'UPDATE_THREAD':
      let newState = {...state};
      newState.triggerLocationId = update(action.data.triggerLocationId, newState.triggerLocationId);
      newState.updatedAt = getTime(action && action.data && action.data.lastSeen);
      return newState;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultState.config);
    default:
      return state;
  }
};

let combinedMessageThreadReducer = combineReducers({
  config:   messageThreadConfigReducer,
  messages: messageReducer,
  members:  memberReducer,
});


// threadReducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_THREAD':
      let newState = {...state};
      delete newState[action.threadId];
      return newState;
    default:
      if (action.threadId !== undefined) {
        if (state[action.threadId] !== undefined || action.type === "ADD_THREAD") {
          return {
            ...state,
            ...{[action.threadId]: combinedMessageThreadReducer(state[action.threadId], action)}
          };
        }
      }
      return state;
  }
};
