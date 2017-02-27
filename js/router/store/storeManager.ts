import { AsyncStorage }                    from 'react-native'
import { createStore, applyMiddleware }    from 'redux'
import CrownstoneReducer                   from './reducer'
import { NativeEnhancer }                  from './nativeEnhancer'
import { CloudEnhancer }                   from './cloudEnhancer'
import { EventEnhancer }                   from './eventEnhancer'
import { eventBus }                        from '../../util/eventBus'
import { LOG }         from '../../logging/Log'

// from https://github.com/tshelburne/redux-batched-actions
// included due to conflict with newer RN version
export const BATCH = 'BATCHING_REDUCER.BATCH';

// modified for application
function batchActions(actions) {
  return this.dispatch({ type: BATCH, payload: actions });
}

function enableBatching(reducer) {
  return function batchingReducer(state, action) {
    switch (action.type) {
      case BATCH:
        return action.payload.reduce(batchingReducer, state); // uses Array.reduce.
      default:
        return reducer(state, action);
    }
  };
}
// ---------------

class StoreManagerClass {
  store : any;
  storeInitialized : any;
  storageKey : any;
  storageKeyBase : string;
  userIdentificationStorageKey : string;
  writeToDiskTimeout : any;
  unsubscribe : any;


  constructor() {
    this.store = {};
    this.storeInitialized = false;

    this.storageKey = null;
    this.storageKeyBase = 'CrownstoneStore_';
    this.userIdentificationStorageKey = 'CrownstoneLoggedInUser';

    this.writeToDiskTimeout = null;
    this.unsubscribe = null;

    this._init();
  }

  _init() {
    AsyncStorage.getItem(this.userIdentificationStorageKey) // this will just contain a string of the logged in user.
      .then((userId) => {
        this._initializeStore(userId);
      });
  }

  _initializeStore(userId) {
    if (userId === null) {
      this._setupStore({}, false);
    }
    else {
      this._setUserStorageKey(userId);
      AsyncStorage.getItem(this.storageKey)
        .then((data) => {
          this._setupStore(data, true);
        });
    }
  }

  _setUserStorageKey(userId) {
    this.storageKey = this._createUserStorageKey(userId);
  }

  _createUserStorageKey(userId) {
    return this.storageKeyBase + userId;
  }


  _handleDEBUG(initialState) {
    // if (initialState) {
    //   let data = JSON.parse(initialState);
    //   if (data.user && data.user.firstName === null) {
    //     if (OVERRIDE_DATABASE === true) {
    //       LOG.info("INJECTING FAKE DATA");
    //       this.store = createStore(CrownstoneReducer, fakeStore);
    //     }
    //   }
    // }
    // else {
    //   if (OVERRIDE_DATABASE === true) {
    //     LOG.info("INJECTING FAKE DATA");
    //     this.store = createStore(CrownstoneReducer, fakeStore);
    //   }
    // }
    // // used for DEBUG
    //
  }

  /**
   * actually create the store, either filled with an initial state or empty.
   * @param initialState
   * @param enableWriteToDisk
   * @returns {{}|*}
   * @private
   */
  _setupStore(initialState, enableWriteToDisk) {
    if (initialState && typeof initialState === 'string') {
      let data = JSON.parse(initialState);
      LOG.debug("CURRENT DATA:", data);
      this.store = createStore(enableBatching(CrownstoneReducer), data, applyMiddleware(CloudEnhancer, EventEnhancer, NativeEnhancer));
      this.store.batchDispatch = batchActions;
    }
    else {
      LOG.info("Creating an empty database");
      this.store = createStore(enableBatching(CrownstoneReducer), {}, applyMiddleware(CloudEnhancer, EventEnhancer, NativeEnhancer));
      this.store.batchDispatch = batchActions;
    }

    // we now have a functional store!
    this.storeInitialized = true;

    // if we are not logged in, the database lives only in memory.
    if (enableWriteToDisk === true) {
      this._setupWritingToDisk();
    }

    // we emit the storeInitialized event just in case of race conditions.
    eventBus.emit('storeInitialized');
  }


  /**
   * Setting up persistence including overflow protection.
   * @private
   */
  _setupWritingToDisk() {
    if (this.unsubscribe !== null) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.unsubscribe = this.store.subscribe(() => {
      // protect against a LOT of writes at the same time, we only write to disk twice a second max.
      if (this.writeToDiskTimeout !== null) {
        clearTimeout(this.writeToDiskTimeout);
        this.writeToDiskTimeout = null;
      }
      this.writeToDiskTimeout = setTimeout(() => {
        this.writeToDiskTimeout = null;
        // only write to disk if we are LOGGED IN.
        AsyncStorage.getItem(this.userIdentificationStorageKey)
          .then((userId) => {
            if (userId) {
              let payload = JSON.stringify(this.store.getState());
              AsyncStorage.setItem(this.storageKey, payload).done();
            }
          })
          .catch((err) => {
            LOG.error("Trouble writing to disk", err)
          });
      }, 500);
    });
  }

  /**
   * This will get the data of this user from the database in case it is available.
   * Once we have received it, we will hydrate the store with it.
   * @param userId
   */
  userLogIn(userId) {
    let storageKey = this._createUserStorageKey(userId);
    return AsyncStorage.getItem(storageKey)
      .then((data) => {
        if (data) {
          let parsedData = JSON.parse(data);
          this.store.dispatch({type:"HYDRATE", state: parsedData})
        }
      })
      .catch((err) => {
        LOG.error("Error during userLogIn", err);
      });
  }


  /**
   * this should be called when the setup procedure has been successful
   * @param userId
   * @returns {*|Promise.<TResult>}
   */
  finalizeLogIn(userId) {
    this._setUserStorageKey(userId);
    // write to database that we are logged in.
    return AsyncStorage.setItem(this.userIdentificationStorageKey, userId)
      .then(() => {
        // we enable persistence.
        this._setupWritingToDisk();

        // write everything downloaded from the cloud at login to disk.
        return this._persistToDisk();
      })
  }


  /**
   * When we log out, we first write all we have to the disk.
   */
  userLogOut() {
    return new Promise((resolve, reject) => {
      // will only do something if we are indeed logged in, denoted by the presence of the user key.
      if (this.storageKey) {
        // write everything to disk
        this._persistToDisk()
          .then(() => {
            // remove the userId from the logged in user list.
            return AsyncStorage.setItem(this.userIdentificationStorageKey, "")
          })
          .then(() => {
            // clear the storage key
            this.storageKey = null;

            // stop writing to disk
            if (this.writeToDiskTimeout !== null) {
              clearTimeout(this.writeToDiskTimeout);
              this.writeToDiskTimeout = null;
            }

            // stop the subscription
            if (this.unsubscribe !== null) {
              this.unsubscribe();
              this.unsubscribe = null;
            }

            // now that the store only lived in memory, clear it
            this.store.dispatch({type: "USER_LOGGED_OUT_CLEAR_STORE"})
          })
          .catch((err) => {
            LOG.error("COULD NOT PERSIST TO DISK", err)
          })
      }
      else {
        resolve();
      }
    })
  }

  _persistToDisk() {
    if (this.storageKey) {
      // write everything to disk
      let payload = JSON.stringify(this.store.getState());
      return AsyncStorage.setItem(this.storageKey, payload)
    }
    else {
      return new Promise((resolve, reject) => {resolve()});
    }
  }

  getStore() {
    return this.store;
  }

  isInitialized() {
    return this.storeInitialized;
  }
}

export const StoreManager = new StoreManagerClass();