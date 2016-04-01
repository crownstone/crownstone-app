import { combineReducers } from 'redux'

import userReducer    from './reducers/user'
import groupsReducer  from './reducers/groups'
import settingReducer from './reducers/settings'
import appReducer     from './reducers/app'

// crownstoneReducer
export default combineReducers({
  user: userReducer,
  groups: groupsReducer,
  settings: settingReducer,
  app: appReducer
});
