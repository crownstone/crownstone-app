import { combineReducers } from 'redux'

import userReducer    from './reducers/user'
import spheresReducer  from './reducers/spheres'
import settingReducer from './reducers/settings'
import appReducer     from './reducers/app'

// crownstoneReducer
export default (state = {}, action = {}) => {
  // clearing should only happen once we logged out through the store manager. The state of the old user
  // will be persisted.
  if (action.type === 'USER_LOGGED_OUT_CLEAR_STORE') {
    state = {};
  }
  else if (action.type === 'HYDRATE') {
    state = action.state;
  }

  return {
    user: userReducer(state.user, action),
    spheres: spheresReducer(state.spheres, action),
    settings: settingReducer(state.settings, action),
    app: appReducer(state.app, action)
  }
};
