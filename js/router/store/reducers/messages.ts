import { update, getTime, refreshDefaults } from './reducerUtil'
import { combineReducers } from 'redux'

/**
 *  this is a list of all actions regarding the thread system.
 *
 *  ADD_MESSAGE      { sphereId, threadId, messageId, data: {
 *                                                            senderId,
 *                                                            content,
 *                                                            triggerLocationId,
 *                                                            triggerEvent,
 *                                                            sent
 *                                                          }}
 *  READ_MESSAGE     { sphereId, threadId, messageId, messageId }
 *  RECEIVED_MESSAGE { sphereId, threadId, messageId, messageId }
 *  REMOVE_MESSAGE   { sphereId, threadId, messageId }
 *
 */


// total picture of a thread data structure.
let defaultState = {
  config: {
    cloudId: null,
    triggerLocationId: null,
    triggerEvent: null,
    everyoneInSphere: false,
    everyoneInSphereIncludingOwner: false,
    content: null,
    senderId: null,
    sendFailed: false,
    sent: false,
    sentAt: 1,
    updatedAt: 1,
  },
  recipients: { recipientId: true },
  received:   { userId: 1 },
  read:       { userId: 1 },
};


// messageReducer
const configReducer = (state = defaultState.config, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_MESSAGE_CLOUD_ID':
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'ADD_MESSAGE':
    case 'APPEND_MESSAGE':
    case 'ADD_CLOUD_MESSAGE':
      let newState = {...state};
      newState.triggerLocationId              = update(action.data.triggerLocationId, newState.triggerLocationId);
      newState.triggerEvent                   = update(action.data.triggerEvent,      newState.triggerEvent);
      newState.cloudId                        = update(action.data.cloudId,           newState.cloudId);
      newState.content                        = update(action.data.content,           newState.content);
      newState.everyoneInSphere               = update(action.data.everyoneInSphere,  newState.everyoneInSphere);
      newState.everyoneInSphereIncludingOwner = update(action.data.everyoneInSphereIncludingOwner,  newState.everyoneInSphereIncludingOwner);
      newState.senderId                       = update(action.data.senderId,          newState.senderId);
      newState.sendFailed                     = update(action.data.sendFailed,        newState.sendFailed);
      newState.sent                           = update(action.data.sent,              newState.sent);
      newState.sentAt                         = update(action.data.sentAt,            newState.sentAt);
      newState.updatedAt                      = getTime(action.data.updatedAt);
      return newState;
    case 'I_RECEIVED_MESSAGE':
      newState = {...state};
      newState.updatedAt         = getTime(action.data.updatedAt);
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
    case 'ADD_CLOUD_MESSAGE':
    case 'ADD_MESSAGE':
      if (action.data && action.data.recipientIds) {
        let recipientIds = action.data.recipientIds;
        if (recipientIds.length > 0) {
          let newState = {...state};
          recipientIds.forEach((recipientId) => {
            newState[recipientId] = true
          });
          return newState;
        }
      }
      return state;
    default:
      return state;
  }
};

// messageReducer
const receivedReducer = (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'I_RECEIVED_MESSAGE':
    case 'RECEIVED_MESSAGE':
      if (action.data.userId !== undefined) {
        let newState = {...state};
        newState[action.data.userId] = getTime(action.data.at);
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
    case 'I_READ_MESSAGE':
    case 'READ_MESSAGE':
      if (action.data.userId !== undefined) {
        let newState = {...state};
        newState[action.data.userId] = getTime(action.data.at);
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
        if (state[action.messageId] !== undefined || action.type === "ADD_MESSAGE" || action.type === "ADD_CLOUD_MESSAGE") {
          return {
            ...state,
            ...{[action.messageId]: combinedMessageReducer(state[action.messageId], action)}
          };
        }
      }
      return state;
  }
};