import { update, getTime, refreshDefaults } from '../reducerUtil'

let defaultSettings = {
  data: null,
  cloudId: null,
  activeDays: {
    Mon: true,
    Tue: true,
    Wed: true,
    Thu: true,
    Fri: true,
    Sat: true,
    Sun: true
  },
  version: 1,
  syncedToCrownstone: false,
  updatedAt: 1
};

let ruleReducer = (state = defaultSettings, action : any = {}) => {
  switch (action.type) {
    case "UPDATE_RULE_CLOUD_ID":
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'ADD_STONE_RULE':
    case 'UPDATE_STONE_RULE':
      if (action.data) {
        let newState = {...state};
        newState.activeDays = {...state.activeDays};

        newState.data               = update(action.data.data,        newState.data);
        newState.cloudId            = update(action.data.cloudId,      newState.cloudId);
        newState.version            = update(action.data.version,  newState.version);
        newState.syncedToCrownstone = update(action.data.syncedToCrownstone,  newState.syncedToCrownstone);

        newState.activeDays.Mon     = update(action.data.activeDays && action.data.activeDays.Mon, newState.activeDays.Mon);
        newState.activeDays.Tue     = update(action.data.activeDays && action.data.activeDays.Tue, newState.activeDays.Tue);
        newState.activeDays.Wed     = update(action.data.activeDays && action.data.activeDays.Wed, newState.activeDays.Wed);
        newState.activeDays.Thu     = update(action.data.activeDays && action.data.activeDays.Thu, newState.activeDays.Thu);
        newState.activeDays.Fri     = update(action.data.activeDays && action.data.activeDays.Fri, newState.activeDays.Fri);
        newState.activeDays.Sat     = update(action.data.activeDays && action.data.activeDays.Sat, newState.activeDays.Sat);
        newState.activeDays.Sun     = update(action.data.activeDays && action.data.activeDays.Sun, newState.activeDays.Sun);

        newState.updatedAt          = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings);
    default:
      return state;
  }
};


// rule Reducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_ALL_RULES_OF_STONE':
      return {};
    case 'REMOVE_STONE_RULE':
      if (state[action.ruleId]) {
        let newState = {...state};
        delete newState[action.ruleId];
        return newState;
      }
      return state;
    default:
      if (action.ruleId !== undefined) {
        if (state[action.ruleId] !== undefined || action.type === "ADD_STONE_RULE") {
          return {
            ...state,
            ...{[action.ruleId]: ruleReducer(state[action.ruleId], action)}
          };
        }
      }
      return state;
  }
};
