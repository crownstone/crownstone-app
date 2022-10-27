import { update, refreshDefaults } from '../reducerUtil'



let defaultReachability = {
  lastSeen: null,
};

export default (state = defaultReachability, action : DatabaseAction = {}) => {
  switch (action.type) {
    case 'UPDATE_STONE_REACHABILITY':
      if (action.data) {
        let newState = {...state};
        newState.lastSeen            = update(action.data.lastSeen,            newState.lastSeen);
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultReachability);
    default:
      return state;
  }
}
