import { update, getTime, refreshDefaults } from '../reducerUtil'
import { combineReducers } from 'redux'

export const ALL_MEMBER_ENTRY = "__ALL__";

// let state = {
//   received: { at : 1 },
//   read:     { at : 1 },
// }

let defaultState = {
  state: false,
  at: 1
};

const receivedReducer = (state = {}, action : any = {}) => {
  switch (action.type) {
    case "REMOVE_MESSAGE":
    case "READ_MESSAGE":
      let newState = {...state};
      delete newState[action.messageId];
      return newState;
    default:
      if (action.messageId !== undefined) {
        if (state[action.messageId] !== undefined || action.type === 'ADD_THREAD' || action.type === 'ADD_MESSAGE') {
          return {
            ...state,
            ...{[action.messageId]: receivedDataReducer(state[action.memberId], action)}
          };
        }
      }
      return state;
  }
};

const readReducer = (state = {}, action : any = {}) => {
  switch (action.type) {
    case "REMOVE_MESSAGE":
      let newState = {...state};
      delete newState[action.messageId];
      return newState;
    default:
      if (action.messageId !== undefined) {
        if (state[action.messageId] !== undefined || action.type === 'ADD_THREAD' || action.type === 'ADD_MESSAGE') {
          return {
            ...state,
            ...{[action.messageId]: readDataReducer(state[action.memberId], action)}
          };
        }
      }
      return state;
  }
};


const receivedDataReducer = (state = defaultState, action : any = {}) => {
  switch (action.type) {
    case 'RECEIVED_MESSAGE':
      let newState = {...state};
      newState.at = getTime(action.data.at);
      return newState;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultState);
    default:
      return state;
  }
};


// readReducer
const readDataReducer = (state = defaultState, action : any = {}) => {
  switch (action.type) {
    case 'READ_MESSAGE':
      let newState = {...state};
      newState.at = getTime(action.data.at);
      return newState;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultState);
    default:
      return state;
  }
};


const combinedMemberReducer = combineReducers({
  received: receivedReducer,
  read:     readReducer,
});



export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case "REMOVE_MEMBER":
      let newState = {...state};
      delete newState[action.memberId];
      return newState;
    case "ADD_THREAD":
      let memberIds = action.data.memberIds;
      if (memberIds.length > 0) {
        let newState = {...state};
        memberIds.forEach((memberId) => {
          newState[memberId] = combinedMemberReducer({}, action);
        });

        return newState;
      }
      else {
        return state;
      }
    default:
      if (action.memberId !== undefined) {
        if (state[action.memberId] !== undefined || action.type === 'ADD_MEMBER') {
          return {
            ...state,
            ...{[action.memberId]: combinedMemberReducer(state[action.memberId], action)}
          };
        }
      }
      return state;
  }
};



