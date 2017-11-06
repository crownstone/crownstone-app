import { combineReducers } from 'redux'

import userReducer         from './reducers/user'
import eventReducer        from './reducers/events'
import devicesReducer      from './reducers/devices'
import spheresReducer      from './reducers/spheres'
import installationReducer from './reducers/installation'
import appReducer          from './reducers/app'
import developmentReducer  from './reducers/development'

// crownstoneReducer
export default (state : any = {}, action : any = {}) => {
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
    devices: devicesReducer(state.devices, action),
    spheres: spheresReducer(state.spheres, action),
    events: eventReducer(state.events, action),
    installations: installationReducer(state.installations, action),
    app: appReducer(state.app, action),
    development: developmentReducer(state.development, action)
  }
};
