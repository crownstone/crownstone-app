import { eventBus } from '../../util/eventBus'
import { BATCH } from './storeManager'
import { LOG, LOGDebug } from '../../logging/Log'

export function EventEnhancer({ getState }) {
  return (next) => (action) => {
    let sendEvents = false;


    // Call the next dispatch method in the middleware chain.
    let returnValue = next(action);

    if (action.type === BATCH && action.payload && Array.isArray(action.payload)) {
      action.payload.forEach((action) => {
        sendEvents = checkAction(action) || sendEvents;
      })
    }
    else {
      sendEvents = checkAction(action) || sendEvents
    }

    if (sendEvents === true) {

    }

    // This will likely be the action itself, unless
    // a middleware further in chain changed it.
    return returnValue
  }
}

function checkAction(action) {
  switch (action.type) {
    case 'ADD_STONE':
    case 'REMOVE_STONE':
      return true;
    default:
      return false;
      break;
  }
}