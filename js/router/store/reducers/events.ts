import { update, getTime, refreshDefaults } from './reducerUtil'
import { Util } from '../../../util/Util'

let defaultSettings = {

};

// userReducer
export default (state = defaultSettings, action : any = {}) => {
  switch (action.type) {
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings);
    default:
      return state;
  }
};
