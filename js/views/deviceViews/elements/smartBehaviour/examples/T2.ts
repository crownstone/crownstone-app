/*
When this Crownstone turns on and its between 22 and 6, only turn it on for 50%
 */

import { ACTIONS, CONDITIONS, TIME_TYPES } from "./enums";

let timeConditionStart = {
  type: CONDITIONS.TIME,
  data: {
    type: TIME_TYPES.SPECIFIC,
    value: "22:00",
    offset: null,
  }
};

let timeConditionEnd = {
  type: CONDITIONS.TIME,
  data: {
    type: TIME_TYPES.SPECIFIC,
    value: "6:00",
    offset: null,
  }
};

let rule = {
  start: [timeConditionStart],
  end:   [timeConditionEnd],
  action: {
    type: ACTIONS.REACT_TO_TURN_ON,
    value: 0.5
  }
};