import { update, getTime, refreshDefaults } from '../reducerUtil'

let defaultSettings = {
  label: 'Timer',
  time: 0,
  switchState: 0,
  fadeDuration: 0,
  ignoreLocationTriggers: false,
  active: true,
  repeatMode: '24h', // 24h / minute
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
    case 'ADD_SCHEDULE':
    case 'UPDATE_SCHEDULE_CONFIG':
      if (action.data) {
        let newState = {...state};
        newState.activeDays = {...state.activeDays};

        newState.label                  = update(action.data.label, newState.label);
        newState.time                   = update(action.data.time, newState.time);
        newState.switchState            = update(action.data.switchState, newState.switchState);
        newState.fadeDuration           = update(action.data.fadeDuration, newState.fadeDuration);
        newState.ignoreLocationTriggers = update(action.data.ignoreLocationTriggers, newState.ignoreLocationTriggers);
        newState.repeatMode             = update(action.data.repeatMode, newState.repeatMode);
        newState.active                 = update(action.data.active, newState.active);

        newState.activeDays.Mon         = update(action.data.activeDays && action.data.activeDays.Mon || undefined, newState.activeDays.Mon);
        newState.activeDays.Tue         = update(action.data.activeDays && action.data.activeDays.Tue || undefined, newState.activeDays.Tue);
        newState.activeDays.Wed         = update(action.data.activeDays && action.data.activeDays.Wed || undefined, newState.activeDays.Wed);
        newState.activeDays.Thu         = update(action.data.activeDays && action.data.activeDays.Thu || undefined, newState.activeDays.Thu);
        newState.activeDays.Fri         = update(action.data.activeDays && action.data.activeDays.Fri || undefined, newState.activeDays.Fri);
        newState.activeDays.Sat         = update(action.data.activeDays && action.data.activeDays.Sat || undefined, newState.activeDays.Sat);
        newState.activeDays.Sun         = update(action.data.activeDays && action.data.activeDays.Sun || undefined, newState.activeDays.Sun);

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
    case 'REMOVE_SCHEDULE':
      let newState = {...state};
      delete newState[action.scheduleId];
      return newState;
    default:
      if (action.scheduleId !== undefined) {
        if (state[action.scheduleId] !== undefined || action.type === "ADD_SCHEDULE") {
          return {
            ...state,
            ...{[action.scheduleId]: scheduleReducer(state[action.scheduleId], action)}
          };
        }
      }
      return state;
  }
};
