import { update, getTime, refreshDefaults } from '../reducerUtil'

export const BEHAVIOUR_TYPES = {
  twilight: "TWILIGHT",
  behaviour:"BEHAVIOUR",
}

let defaultSettings : behaviourWrapper = {
  type: null,
  data: null, // this is the stringified rule
  activeDays: {
    Mon: false,
    Tue: false,
    Wed: false,
    Thu: false,
    Fri: false,
    Sat: false,
    Sun: false
  },
  idOnCrownstone: null,
  cloudId: null,
  profileIndex: null,
  deleted: false,
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

        newState.type               = update(action.data.type,         newState.type);
        newState.data               = update(action.data.data,         newState.data);
        newState.profileIndex       = update(action.data.profileIndex, newState.profileIndex);
        newState.cloudId            = update(action.data.cloudId,      newState.cloudId);

        newState.activeDays.Mon     = update(action.data.activeDays && action.data.activeDays.Mon, newState.activeDays.Mon);
        newState.activeDays.Tue     = update(action.data.activeDays && action.data.activeDays.Tue, newState.activeDays.Tue);
        newState.activeDays.Wed     = update(action.data.activeDays && action.data.activeDays.Wed, newState.activeDays.Wed);
        newState.activeDays.Thu     = update(action.data.activeDays && action.data.activeDays.Thu, newState.activeDays.Thu);
        newState.activeDays.Fri     = update(action.data.activeDays && action.data.activeDays.Fri, newState.activeDays.Fri);
        newState.activeDays.Sat     = update(action.data.activeDays && action.data.activeDays.Sat, newState.activeDays.Sat);
        newState.activeDays.Sun     = update(action.data.activeDays && action.data.activeDays.Sun, newState.activeDays.Sun);

        newState.syncedToCrownstone = update(action.data.syncedToCrownstone, newState.syncedToCrownstone);
        newState.updatedAt          = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'MARK_STONE_RULE_FOR_DELETION':
      let newState = {...state};
      newState.deleted = true;
      newState.syncedToCrownstone = false;
      return newState;
    case "MARK_STONE_RULE_AS_SYNCED":
      newState = {...state};
      newState.syncedToCrownstone = true;
      return newState;
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
