export let STONE_TYPES = {
  plug:          "PLUG",
  builtin:       "BUILTIN",
  builtinOne:    "BUILTIN_ONE",
  guidestone:    "GUIDESTONE",
  crownstoneUSB: "CROWNSTONE_USB",
  hub:           "CROWNSTONE_HUB",
};

export const BCH_ERROR_CODES = {
  REMOVED_BECAUSE_IS_DUPLICATE: "REMOVED_BECAUSE_IS_DUPLICATE",
  NO_STONES_FOUND: "NO_STONES_FOUND",
  STONE_IS_LOCKED: "STONE_IS_LOCKED",
  TASK_HAS_BEEN_SUPERSEDED: "TASK_HAS_BEEN_SUPERSEDED",
};


// AiCore types
export const SMART_BEHAVIOUR_TYPES = {
  PRESENCE:      "PRESENCE",
  WAKE_UP_LIGHT: "WAKE_UP_LIGHT",
  SMART_TIMER:   "SMART_TIMER",
  TWILIGHT_MODE: "TWILIGHT_MODE",
  CHILD_SAFETY:  "CHILD_SAFETY",
  CUSTOM:        "CUSTOM",
};

export const AICORE_TIME_TYPES = {
  ALL_DAY:"ALL_DAY",
  RANGE:  "RANGE",
};

export const AICORE_TIME_DETAIL_TYPES = {
  SUNSET:  "SUNSET",
  SUNRISE: "SUNRISE",
  CLOCK:   "CLOCK"
};

export const AICORE_PRESENCE_TYPES = {
  SOMEBODY:       "SOMEBODY",
  NOBODY:         "NOBODY",
  IGNORE:         "IGNORE",
  SPECIFIC_USERS: "SPECIFIC_USERS"
};

export const AICORE_LOCATIONS_TYPES = {
  SPHERE:   "SPHERE",
  LOCATION: "LOCATION",
};

export const SELECTABLE_TYPE = {
  ACTION:      "ACTION",
  PRESENCE:    "PRESENCE",
  LOCATION:    "LOCATION",
  TIME:        "TIME",
  OPTION:      "OPTION",
};

export const KEY_TYPES = {
  ADMIN_KEY:            "ADMIN_KEY",
  MEMBER_KEY:           "MEMBER_KEY",
  BASIC_KEY:            "BASIC_KEY",
  LOCALIZATION_KEY:     "LOCALIZATION_KEY",
  SERVICE_DATA_KEY:     "SERVICE_DATA_KEY",
  MESH_NETWORK_KEY:     "MESH_NETWORK_KEY",
  MESH_APPLICATION_KEY: "MESH_APPLICATION_KEY",
  MESH_DEVICE_KEY:      "MESH_DEVICE_KEY",
  SPHERE_AUTHORIZATION_TOKEN: "SPHERE_AUTHORIZATION_TOKEN",
};

export const BEHAVIOUR_TYPES = {
  twilight: "TWILIGHT",
  behaviour:"BEHAVIOUR",
}

export const HubDataType : HubDataType = {
  SETUP:         0,
  COMMAND:       1,
  FACTORY_RESET: 2,
  REQUEST_DATA:  10,
}

export const HubReplyError : HubReplyError = {
  NOT_IN_SETUP_MODE: 0,
  IN_SETUP_MODE:     1,
  INVALID_TOKEN:     2,
  UNKNOWN:           60000,
}

export const HubReplyCode : HubReplyCode = {
  SUCCESS:    0,
  DATA_REPLY: 10,
  ERROR:      4000
}

export const HubRequestDataType : HubRequestDataType = {
  CLOUD_ID: 0
}


export const CONDITION_MAP = {
  SWITCH_STATE: 'switchState',
};