import userReducer         from './reducers/user'
import transformReducer    from './reducers/transform'
import eventReducer        from './reducers/events'
import devicesReducer      from './reducers/devices'
import spheresReducer      from './reducers/spheres'
import installationReducer from './reducers/installation'
import appReducer          from './reducers/app'
import developmentReducer  from './reducers/development'
import devAppReducer       from './reducers/devApp'
import { AnyAction } from "redux";
// import preferencesReducer  from "./reducers/preferences";
// crownstoneReducer

export default (state : any = {}, action : DatabaseAction = {}) => {
  // clearing should only happen once we logged out through the store manager. The state of the old user
  // will be persisted.
  if (action.type === 'USER_LOGGED_OUT_CLEAR_STORE' || action.type === 'TESTS_CLEAR_STORE') {
    state = {};
  }
  else if (action.type === 'HYDRATE') {
    state = action.data?.state;
  }

  return {
    app:           appReducer(state.app, action),
    devices:       devicesReducer(state.devices, action),
    development:   developmentReducer(state.development, action),
    events:        eventReducer(state.events, action as AnyAction),
    installations: installationReducer(state.installations, action),
    spheres:       spheresReducer(state.spheres, action),
    user:          userReducer(state.user, action),
    transforms:    transformReducer(state.transforms, action),
    devApp:        devAppReducer(state.devApp, action),
  }
};
