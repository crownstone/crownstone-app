import { update} from './reducerUtil'

export const toggleState = {
  state:    1,  // [0 .. 1] for state, undefined for ignore
  delay:    0,  // delay in seconds
  fadeTime: 0,  // delay in seconds
  active: false,  // if not active the crownstone will not react to the event.
};
export const toggleStateAway = {
  state:    0,  // [0 .. 1] for state, undefined for ignore
  delay:    120,  // delay in seconds
  fadeTime: 0,  // delay in seconds
  active: false,  // if not active the crownstone will not react to the event.
};

export const updateToggleState = function (state, action) {
  if (action.data) {
    let newState = {...state};
    newState.state     = update(action.data.state,    newState.state);
    newState.delay     = update(action.data.delay,    newState.delay);
    newState.fadeTime  = update(action.data.fadeTime, newState.fadeTime);
    newState.active    = update(action.data.active,   newState.active);
    return newState;
  }
  return state;
};

let ruleDb = {
  rules: {
    12324: {
      data: {
        action: {
          type: "DIM_WHEN_TURNED_ON",
          data: 0.4,
        },
        time: {
          from: {
            type: "CLOCK", data: {
              minutes: 1,
              hours: 1,
            }
          }, to: {
            type: "SUNSET", offsetMinutes:1
          }
        },
      },
      activeDays: {
        Mon: true,
        Tue: true,
        Wed: true,
        Thu: true,
        Fri: true,
        Sat: true,
        Sun: true
      },
      version: 1
    }
  }
}