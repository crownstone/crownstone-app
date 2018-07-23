export const INTENTS = {
  sphereEnter: 0,
  sphereExit:  1,
  enter:       2,  // these are (will be) tracked for ownership
  exit:        3,  // these are (will be) tracked for ownership
  manual:      4,
};

export const BEHAVIOUR_TYPE_TO_INTENT = {
  onNear : 'enter',
  onAway : 'exit',
  onRoomEnter : 'enter',
  onRoomExit  : 'exit',
  onHomeEnter : 'sphereEnter',
  onHomeExit  : 'sphereExit',
};