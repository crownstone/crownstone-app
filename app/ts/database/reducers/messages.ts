import { update, getTime, refreshDefaults } from "./reducerUtil";

// total picture of a thread data structure.
let defaultState: MessageData = {
  id: null,
  cloudId: null,

  triggerLocationId: null,
  triggerEvent: null,
  everyoneInSphere: false,
  includeSenderInEveryone: false,
  recipients: {},

  content:    null,

  visible:    false,
  notified:   false,
  read:       {},
  deleted:    {},

  sendFailed: false,
  senderId:   null,
  sent:       false,
  sentAt:     0,
  updatedAt:  0,
};

const defaultMessageState : MessageStateData = {
  id: null,
  value: false,
  cloudId: null,
  updatedAt:0,
}

// messageReducer
const messageReducer = (state = defaultState, action : any = {}) => {
  let newState;
  switch (action.type) {
    case 'UPDATE_MESSAGE_CLOUD_ID':
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'READ_MESSAGE':
      newState = {...state};
      newState.read = { cloudId: action.data?.cloudId ?? null, updatedAt: getTime(action.data?.updatedAt), value: true };
      return newState
    case 'DELETE_MESSAGE':
      newState = {...state};
      newState.deleted = { cloudId: action.data?.cloudId ?? null, updatedAt: getTime(action.data?.updatedAt), value: true };
      return newState
    case 'ADD_MESSAGE':
    case 'APPEND_MESSAGE':
    case 'ADD_CLOUD_MESSAGE':
      if (action.data) {
        let newState = {...state};
        newState.updatedAt                      = update(action.data.updatedAt,                      newState.updatedAt);

        if (!newState.id) {
          newState.id = action.messageId;
          newState.updatedAt = getTime(action.data.updatedAt);
        }

        newState.cloudId                        = update(action.data.cloudId,                 newState.cloudId);
        newState.triggerLocationId              = update(action.data.triggerLocationId,       newState.triggerLocationId);
        newState.triggerEvent                   = update(action.data.triggerEvent,            newState.triggerEvent);
        newState.everyoneInSphere               = update(action.data.everyoneInSphere,        newState.everyoneInSphere);
        newState.includeSenderInEveryone        = update(action.data.includeSenderInEveryone, newState.includeSenderInEveryone);
        newState.recipients                     = update(action.data.recipients,              newState.recipients);
        newState.content                        = update(action.data.content,                 newState.content);
        newState.visible                        = update(action.data.visible,                 newState.visible);
        newState.notified                       = update(action.data.notified,                newState.notified);
        newState.read                           = update(action.data.read,                    newState.read);
        newState.deleted                        = update(action.data.deleted,                 newState.deleted);
        newState.sendFailed                     = update(action.data.sendFailed,              newState.sendFailed);
        newState.senderId                       = update(action.data.senderId,                newState.senderId);
        newState.sent                           = update(action.data.sent,                    newState.sent);
        newState.sentAt                         = update(action.data.sentAt,                  newState.sentAt);

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
        if (state[action.messageId] !== undefined || action.type === "ADD_MESSAGE") {
          let message     = messageReducer(state[action.messageId], action);
          message.read    = messageReadReducerBase(message.read, action);
          message.deleted = messageDeletedReducerBase(message.deleted, action);

          return {
            ...state,
            ...{[action.messageId]: messageReducer(state[action.messageId], action)}
          };
        }


      }
      return state;
  }
};


const messageReadReducer = (state = defaultMessageState, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_READ_MESSAGE_CLOUD_ID':
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'MARK_AS_READ':
    case 'UPDATE_READ_MESSAGE':
      if (action.data) {
        let newState = {...state};
        newState.updatedAt = update(action.data.updatedAt, newState.updatedAt);

        if (!newState.id) {
          newState.id = action.messageStateId;
          newState.updatedAt = getTime(action.data.updatedAt);
        }

        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        newState.value   = update(action.data.value,   newState.value);

        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultMessageState);
    default:
      return state;
  }
};

// messageReducer
const messageReadReducerBase = (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_MESSAGE_READ':
      let newState = {...state};
      delete newState[action.messageStateId];
      return newState;
    default:
      if (action.messageStateId !== undefined) {
        if (state[action.messageStateId] !== undefined || action.type === "MARK_AS_READ" ) {
          return {
            ...state,
            ...{[action.messageStateId]: messageReadReducer(state[action.messageStateId], action)}
          };
        }


      }
      return state;
  }
};

const messageDeletedReducer = (state = defaultMessageState, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_DELETE_MESSAGE_CLOUD_ID':
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'MARK_AS_DELETED':
    case 'UPDATE_DELETE_MESSAGE':
      if (action.data) {
        let newState = {...state};
        newState.updatedAt = update(action.data.updatedAt, newState.updatedAt);

        if (!newState.id) {
          newState.id = action.messageStateId;
          newState.updatedAt = getTime(action.data.updatedAt);
        }

        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        newState.value   = update(action.data.value,   newState.value);

        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultMessageState);
    default:
      return state;
  }
};

// messageReducer
const messageDeletedReducerBase = (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_MESSAGE_DELETED':
      let newState = {...state};
      delete newState[action.messageStateId];
      return newState;
    default:
      if (action.messageStateId !== undefined) {
        if (state[action.messageStateId] !== undefined || action.type === "MARK_AS_DELETED" ) {
          return {
            ...state,
            ...{[action.messageStateId]: messageDeletedReducer(state[action.messageStateId], action)}
          };
        }
      }
      return state;
  }
};
