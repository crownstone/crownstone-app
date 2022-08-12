import { update, getTime, refreshDefaults, idReducerGenerator } from "./reducerUtil";
import { combineReducers } from 'redux'

// total picture of a thread data structure.
let defaultState: MessageData = {
  id: null,
  cloudId: null,

  triggerLocationId: null,
  triggerEvent: null,
  everyoneInSphere: false,
  everyoneInSphereIncludingOwner: false,
  recipients: {},

  content:    null,

  visible:    false,
  notified:   false,
  read:       false,
  deleted:    false,

  sendFailed: false,
  senderId:   null,
  sent:       false,
  sentAt:     0,
  updatedAt:  0,
};

// messageReducer
const messageReducer = (state = defaultState, action : any = {}) => {
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
      if (action.data) {
        let newState = {...state};

        if (!newState.id) { newState.id = action.data.messageId; }

        newState.cloudId                        = update(action.data.cloudId,                        newState.cloudId);
        newState.triggerLocationId              = update(action.data.triggerLocationId,              newState.triggerLocationId);
        newState.triggerEvent                   = update(action.data.triggerEvent,                   newState.triggerEvent);
        newState.everyoneInSphere               = update(action.data.everyoneInSphere,               newState.everyoneInSphere);
        newState.everyoneInSphereIncludingOwner = update(action.data.everyoneInSphereIncludingOwner, newState.everyoneInSphereIncludingOwner);
        newState.recipients                     = update(action.data.recipients,                     newState.recipients);
        newState.content                        = update(action.data.content,                        newState.content);
        newState.visible                        = update(action.data.visible,                        newState.visible);
        newState.notified                       = update(action.data.notified,                       newState.notified);
        newState.read                           = update(action.data.read,                           newState.read);
        newState.deleted                        = update(action.data.deleted,                        newState.deleted);
        newState.sendFailed                     = update(action.data.sendFailed,                     newState.sendFailed);
        newState.senderId                       = update(action.data.senderId,                       newState.senderId);
        newState.sent                           = update(action.data.sent,                           newState.sent);
        newState.sentAt                         = update(action.data.sentAt,                         newState.sentAt);
        newState.updatedAt                      = update(action.data.updatedAt,                      newState.updatedAt);

        return newState;
      }
      return state;
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
        if (state[action.messageId] !== undefined || action.type === "ADD_MESSAGE" || action.type === "ADD_CLOUD_MESSAGE") {
          return {
            ...state,
            ...{[action.messageId]: messageReducer(state[action.messageId], action)}
          };
        }
      }
      return state;
  }
};
