import { update, getTime, refreshDefaults } from '../reducerUtil'

let defaultSettings = {
  label: '',
  time: 0,                // this is a UTC timestamp.
  scheduleEntryIndex: 0,
  cloudId: null,
  linkedSchedule: null,
  switchState: 1,
  fadeDuration: 0,
  intervalInMinutes: 0,
  ignoreLocationTriggers: false,
  active: true,
  repeatMode: '24h', // 24h / minute / none
  activeDays: {
    Mon: true,
    Tue: true,
    Wed: true,
    Thu: true,
    Fri: true,
    Sat: true,
    Sun: true,
  },
  updatedAt: 1
};

let scheduleReducer = (state = defaultSettings, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_SCHEDULE_CLOUD_ID':
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'ADD_STONE_SCHEDULE':
    case 'UPDATE_STONE_SCHEDULE':
      if (action.data) {
        let newState = {...state};
        newState.activeDays = {...state.activeDays};

        newState.label                  = update(action.data.label,        newState.label);
        newState.time                   = update(action.data.time,         newState.time);
        newState.scheduleEntryIndex     = update(action.data.scheduleEntryIndex,   newState.scheduleEntryIndex);
        newState.cloudId                = update(action.data.cloudId,      newState.cloudId);
        newState.switchState            = update(action.data.switchState,  newState.switchState);
        newState.linkedSchedule         = update(action.data.linkedSchedule,  newState.linkedSchedule);
        newState.fadeDuration           = update(action.data.fadeDuration, newState.fadeDuration);
        newState.intervalInMinutes      = update(action.data.intervalInMinutes, newState.intervalInMinutes);
        newState.ignoreLocationTriggers = update(action.data.ignoreLocationTriggers, newState.ignoreLocationTriggers);
        newState.repeatMode             = update(action.data.repeatMode,   newState.repeatMode);
        newState.active                 = update(action.data.active,       newState.active);

        newState.activeDays.Mon         = update(action.data.activeDays && action.data.activeDays.Mon, newState.activeDays.Mon);
        newState.activeDays.Tue         = update(action.data.activeDays && action.data.activeDays.Tue, newState.activeDays.Tue);
        newState.activeDays.Wed         = update(action.data.activeDays && action.data.activeDays.Wed, newState.activeDays.Wed);
        newState.activeDays.Thu         = update(action.data.activeDays && action.data.activeDays.Thu, newState.activeDays.Thu);
        newState.activeDays.Fri         = update(action.data.activeDays && action.data.activeDays.Fri, newState.activeDays.Fri);
        newState.activeDays.Sat         = update(action.data.activeDays && action.data.activeDays.Sat, newState.activeDays.Sat);
        newState.activeDays.Sun         = update(action.data.activeDays && action.data.activeDays.Sun, newState.activeDays.Sun);

        newState.updatedAt              = getTime(action.data.updatedAt);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings);
    default:
      return state;
  }
};


// schedule Reducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_ALL_SCHEDULES_OF_STONE':
      return {};
    case 'REMOVE_STONE_SCHEDULE':
      if (state[action.scheduleId]) {
        let newState = {...state};
        delete newState[action.scheduleId];
        return newState;
      }
      return state;
    default:
      if (action.scheduleId !== undefined) {
        if (state[action.scheduleId] !== undefined || action.type === "ADD_STONE_SCHEDULE") {
          return {
            ...state,
            ...{[action.scheduleId]: scheduleReducer(state[action.scheduleId], action)}
          };
        }
      }
      return state;
  }
};
