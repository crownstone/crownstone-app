import { StoreManager } from "../storeManager";
import { BATCH } from "../reducers/BatchReducer";
import { LOGd, LOGe } from "../../logging/Log";


const TransientTypes = {
  UPDATE_STONE_SWITCH_STATE_TRANSIENT: true
};

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

    // certain types do not need to be persisted
    if (TransientTypes[action.type]) { return returnValue; }


    // allow skipping of the persisting step.
    if (action.__skipPersistence) { return returnValue; }

    if (action.type === BATCH) {
      let skip = true;
      for (let i = 0; i < action.payload.length; i++) {
        if (action.payload[i].__skipPersistence !== true) {
          skip = false;
          break;
        }
      }

      if (skip) { return returnValue; }
    }

    // state after update
    let newState = getState();

    if (StoreManager.persistor.initialized) {
      LOGd.store("PersistorEnhancer: Start persisting store updates.");
      StoreManager.persistor.persistChanges(oldState, newState)
        .then(() => { LOGd.store("PersistorEnhancer: finished persisting store updates."); })
        .catch((err) => { LOGe.store("PersistorEnhancer: Could not persist.", err); })
    }
    // This will likely be the action itself, unless
    // a middleware further in chain changed it.
    return returnValue;
  }
}


