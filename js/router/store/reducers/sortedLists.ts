import { getTime, refreshDefaults, update } from "./reducerUtil";

let defaultSettings : SortedListData = {
  id:'',
  viewKey: null,
  referenceId: null,
  sortedList: [],
  cloudId: null,
  updatedAt: 0,
};

let sortedListReducer = (state = defaultSettings, action : any = {}) => {
  switch (action.type) {
    case 'INJECT_IDS':
      let newState = {...state};
      newState.id = action.sortedListId;
      return newState;
    case 'UPDATE_SORTED_LIST_CLOUD_ID':
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'ADD_SORTED_LIST':
    case 'UPDATE_SORTED_LIST':
      if (action.data) {
        let newState = {...state};
        if (action.type === 'ADD_SORTED_LIST') {
          newState.id = action.sortedListId;
        }

        newState.viewKey     = update(action.data.viewKey,    newState.viewKey);
        newState.referenceId = update(action.data.picture,    newState.referenceId);
        if (newState.sortedList) {
          let newList = [...newState.sortedList];
          newState.sortedList  = update(action.data.sortedList, newList);
        }
        newState.updatedAt   = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings);
    default:
      return state;
  }
};


// sortedListReducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_SORTED_LIST':
      let stateCopy = {...state};
      delete stateCopy[action.sortedListId];
      return stateCopy;
    default:
      if (action.sortedListId !== undefined) {
        if (state[action.sortedListId] !== undefined || action.type === "ADD_SORTED_LIST") {
          return {
            ...state,
            ...{[action.sortedListId]: sortedListReducer(state[action.sortedListId], action)}
          };
        }
      }
      return state;
  }
};

