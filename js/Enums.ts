export let BEHAVIOUR_TYPES = {
  NEAR:       'onNear',
  AWAY:       'onAway',
  HOME_ENTER: 'onHomeEnter',
  HOME_EXIT:  'onHomeExit',
  ROOM_ENTER: 'onRoomEnter',
  ROOM_EXIT:  'onRoomExit',
};

export let STONE_TYPES = {
  plug:          "PLUG",
  builtin:       "BUILTIN",
  guidestone:    "GUIDESTONE",
  crownstoneUSB: "CROWNSTONE_USB"
};

export const BCH_ERROR_CODES = {
  NO_STONES_FOUND: "NO_STONES_FOUND",
  STONE_IS_LOCKED: "STONE_IS_LOCKED",
  TASK_HAS_BEEN_SUPERSEDED: "TASK_HAS_BEEN_SUPERSEDED",
};

export const SMART_BEHAVIOUR_TYPES = {
  PRESENCE:      "PRESENCE",
  WAKE_UP_LIGHT: "WAKE_UP_LIGHT",
  SMART_TIMER:   "SMART_TIMER",
  TWILIGHT_MODE: "TWILIGHT_MODE",
  CHILD_SAFETY:  "CHILD_SAFETY",
  CUSTOM:        "CUSTOM",
}

export const ACTIONS = {
  TURN_ON:            "TURN_ON",
  DIM_WHEN_TURNED_ON: "DIM_WHEN_TURNED_ON"
};

export const TIME_TYPES = {
  ALWAYS:   "ALWAYS",
  FROM_TO:  "FROM_TO",
};

export const TIME_DATA_TYPE = {
  SUNSET:   "SUNSET",
  SUNRISE:  "SUNRISE",
  SPECIFIC: "SPECIFIC"
};

export const PRESENCE_TYPES = {
  SOMEBODY:       "SOMEBODY",
  NOBODY:         "NOBODY",
  IGNORE:         "IGNORE",
  SPECIFIC_USERS: "SPECIFIC_USERS"
};

export const LOCATION_TYPES = {
  SPHERE:             "SPHERE",
  SPECIFIC_LOCATIONS: "SPECIFIC_LOCATIONS",
};

export const SELECTABLE_TYPE = {
  ACTION:      "ACTION",
  PRESENCE:    "PRESENCE",
  LOCATION:    "LOCATION",
  TIME:        "TIME",
};
