/*
This Crownstone must always be on
 */

import { ACTIONS} from "./enums";

let rule = {
  start: [],
  end:   [],
  action: {
    type: ACTIONS.TURN_ON,
    value: 0.5
  }
};

