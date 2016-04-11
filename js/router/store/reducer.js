import { combineReducers } from 'redux'

import userReducer    from './reducers/user'
import groupsReducer  from './reducers/groups'
import settingReducer from './reducers/settings'
import appReducer     from './reducers/app'

// crownstoneReducer
export default (state = {}, action = {}) => {
  if (action.type === 'USER_LOG_OUT') {
    state = {};
  }


  return {
    user: userReducer(state.user, action),
    groups: groupsReducer(state.groups, action),
    settings: settingReducer(state.settings, action),
    app: appReducer(state.app, action)
  }
};
