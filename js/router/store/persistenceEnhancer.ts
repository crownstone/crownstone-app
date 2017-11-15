import { LOG } from '../../logging/Log'
import {StoreManager} from "./storeManager";


/**
 * This will ensure that the usage of the classifier will be done according
 * to when the fingerprints of all rooms are ready.
 *
 * @param getState
 * @returns {function(*): function(*=)}
 * @constructor
 */
export function PersistenceEnhancer({ getState }) {
  return (next) => (action) => {
    // required for some of the actions
    let oldState = getState();

    let returnValue = next(action);

    if (action.type === 'HYDRATE') { return returnValue; }

    // state after update
    let newState = getState();

    if (StoreManager.persistor.initialized) {
      StoreManager.persistor.persistChanges(oldState, newState)
        .then(() => { })
        .catch((err) => { LOG.error("PersistorEnhancer: Could not persist.", err); })
    }
    // This will likely be the action itself, unless
    // a middleware further in chain changed it.
    return returnValue;
  }
}


