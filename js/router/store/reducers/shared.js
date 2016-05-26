
let toggleState = {
  state:    1,  // [0 .. 1] for state, undefined for ignore
  delay:    0,  // delay in seconds
  fadeTime: 0,  // delay in seconds
  active: false  // if not active the crownstone will not react to the event.
};

export const updateToggleState = function (state, action) {
  if (action.data) {
    let newState = {...state};
    newState.state     = update(action.data.state,    newState.active);
    newState.delay     = update(action.data.delay,    newState.delay);
    newState.fadeTime  = update(action.data.fadeTime, newState.fadeTime);
    newState.active    = update(action.data.active,   newState.active);
    return newState;
  }
  return state;
};


export const behaviourReducerOnHomeEnter = (state = toggleState, action = {}) => {
  switch (action.type) {
    case 'UPDATE_BEHAVIOUR_FOR_onHomeEnter':
      return updateToggleState(state,action);
    default:
      return state;
  }
};
export const behaviourReducerOnHomeExit = (state = toggleState, action = {}) => {
  switch (action.type) {
    case 'UPDATE_BEHAVIOUR_FOR_onHomeExit':
      return updateToggleState(state,action);
    default:
      return state;
  }
};
export const behaviourReducerOnRoomEnter = (state = toggleState, action = {}) => {
  switch (action.type) {
    case 'UPDATE_BEHAVIOUR_FOR_onRoomEnter':
      return updateToggleState(state,action);
    default:
      return state;
  }
};
export const behaviourReducerOnRoomExit = (state = toggleState, action = {}) => {
  switch (action.type) {
    case 'UPDATE_BEHAVIOUR_FOR_onRoomExit':
      return updateToggleState(state,action);
    default:
      return state;
  }
};

export const scheduleReducer = (state = {}, action = {}) => {
  switch (action.type) {
    case 'ADD_SCHEDULE':
    case 'UPDATE_SCHEDULE':
    case 'REMOVE_SCHEDULE':
      return {...state, ...action.data};
    default:
      return state;
  }
};