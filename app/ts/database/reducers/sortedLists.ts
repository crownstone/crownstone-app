import { refreshDefaults, update } from "./reducerUtil";

let defaultSettings : SortedListData = {
  id:'',
  viewKey: null,
  referenceId: null,
  sortedList: [],
};

let sortedListReducer = (state = defaultSettings, action : DatabaseAction = {}) => {
  switch (action.type) {
    case 'INJECT_IDS':
      let newState = {...state};
      newState.id = action.sortedListId;
      return newState;
    case 'ADD_SORTED_LIST':
    case 'UPDATE_SORTED_LIST':
      if (action.data) {
        let newState = {...state};
        if (action.type === 'ADD_SORTED_LIST') {
          newState.id = action.sortedListId;
        }

        newState.viewKey     = update(action.data.viewKey,     newState.viewKey);
        newState.referenceId = update(action.data.referenceId, newState.referenceId);
        if (newState.sortedList) {
          let newList = [...newState.sortedList];
          newState.sortedList  = update(action.data.sortedList, newList);
        }
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
export default (state = {}, action : DatabaseAction = {}) => {
  switch (action.type) {
    case 'REMOVE_SORTED_LISTS':
      return {};
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

