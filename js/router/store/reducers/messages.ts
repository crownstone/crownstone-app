import { update, getTime, refreshDefaults } from './reducerUtil'
import { Util } from '../../../util/Util'

let defaultSettings = {
  messageContent    : null,
  messageSender     : null,
  messageRecipients : null,
  triggerLocation   : null,
  sphereId          : null,
  sent : false,
  received: false,
  read: false
};

// messageReducer
export default (state = defaultSettings, action : any = {}) => {
  switch (action.type) {
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings);
    default:
      return state;
  }
};
