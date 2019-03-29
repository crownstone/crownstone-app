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
  TASK_HAS_BEEN_SUPERSEDED: "TASK_HAS_BEEN_SUPERSEDED"
};