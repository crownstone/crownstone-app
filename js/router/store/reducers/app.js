let defaultState = {
  app: {
    activeGroup: 'Home',
  }
}

// appReducer
export default (state = defaultState.app, action = {}) => {
  switch (action.type) {
    default:
      return state;
  }
};
