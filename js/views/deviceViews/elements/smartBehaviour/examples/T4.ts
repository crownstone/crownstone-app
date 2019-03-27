

// This should be on unless there is someone in the bedroom

// required blocks:
/*
- time condition START
- time conditon END
- presence condition END
 */

import { ACTIONS, CONDITIONS, PRESENCE_TYPES} from "./enums";

let always = {
  type: CONDITIONS.ALWAYS,
};

let presenceCondition = {
  type: CONDITIONS.NOT_PRESENCE,
  data: {
    type: PRESENCE_TYPES.ANYBODY,
    users: [],
    locations: ["idOfBedroom"]
  }
};

let rule = {
  start: [presenceCondition],
  end:   [],

  action: {
    type: ACTIONS.TURN_ON,
    value: 1
  },
};

// interpreter action: