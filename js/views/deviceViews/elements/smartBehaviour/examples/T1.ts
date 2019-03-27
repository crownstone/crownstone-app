// I WILL BE ON:

// An hour before sundown (+- 15 min), regardless if someone is home until 22:00. I will stay on as long as there are people in the room.

// An hour before sundown (+- 15 min), until 22:00.
// If there is someone in the living room when it's dark outside.

// required blocks:
/*
- time condition START
- time conditon END
- presence condition END
 */

import { ACTIONS, CONDITIONS, OFFSET_TYPES, PRESENCE_TYPES, TIME_TYPES } from "./enums";

let timeConditionStart = {
  type: CONDITIONS.TIME,
  data: {
    type: TIME_TYPES.SUNSET,
    value: null,
    offset: [
      {type: OFFSET_TYPES.BEFORE, value: 60*60},
      {type: OFFSET_TYPES.RANDOM, value: 15*60},
    ],
  }
};

let timeConditionEnd = {
  type: CONDITIONS.TIME,
  data: {
    type: TIME_TYPES.SPECIFIC,
    value: "22:00",
    offset: null,
  }
};

let presenceCondition = {
  type: CONDITIONS.PRESENCE,
  data: {
    type: PRESENCE_TYPES.ANYBODY,
    users: [],
    locations: ["idOfLivingRoom"]
  }
};

let rule = {
  start: [timeConditionStart],
  end:   [timeConditionEnd, presenceCondition],

  action: {
    type: ACTIONS.TURN_ON,
    value: 1
  },
};
