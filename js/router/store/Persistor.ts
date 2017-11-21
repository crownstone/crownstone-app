import { AsyncStorage } from 'react-native'
import {LOG, LOGd, LOGe, LOGi, LOGv} from '../../logging/Log'
import {LOG_LEVEL} from "../../logging/LogLevels";
import {PersistorUtil} from "./PersistorUtil";

const LEGACY_BASE_STORAGE_KEY = 'CrownstoneStore_';
export const HISTORY_PREFIX = '_@$:';
export const HISTORY_CYCLE_SIZE = 10;

interface persistOptions {
  idContainers: { [propName: string]: boolean },
  unpackKeys:   { [propName: string]: boolean },
  fullPersist? : boolean,
  handlers: {
    difference(a: any, b: any, path: string, storageKey: string) : void,
    undefinedInB(a: any, b: any, path: string, storageKey: string) : void,
  }
}


/**
 */
export class Persistor {
  userId : string;
  store : any;
  initialized : boolean = false;
  userKeys = {};
  processPending = false;
  executeOnFinish: any = null;

  keyHistory = {};


  initialize(userId, store) : Promise<void> {
    this.userKeys = {};
    this.userId = userId;
    this.store = store;
    return this.hydrate()
      .then(() => {
        this.initialized = true;
      })
  }

  endSession() : Promise<void> {
    return new Promise((resolve, reject) => {
      this.initialized = false;
      this.userId = null;
      this.store = null;
      this.userKeys = {};
      if (this.processPending === true) {
        this.executeOnFinish = resolve;
      }
      else {
        resolve();
      }
    })
  }

  indicateProcessEnded() {
    this.processPending = false;
    if (typeof this.executeOnFinish === 'function') {
      this.executeOnFinish();
      this.executeOnFinish = null;
    }
  }

  hydrate() {
    this.processPending = true;
    LOGi.store("Persistor: Starting Hydration...");
    let migrationRequired = false;
    return this._checkHydrateMode()
      .then((result) => {
        LOGi.store("Persistor: hydration mode determined: ", result);
        switch (result) {
          case 'classic':
            migrationRequired = true;
            return this._hydrateClassic();
          case 'v2':
            return this._hydrateV2()
        }
      })
      .then((initialState) => {
        LOGd.store("Persistor: Initial state obtained for hydration:", initialState);
        this.store.dispatch({type:"HYDRATE", state: initialState, __logLevel: LOG_LEVEL.verbose });
        // update the store based on new fields in the database (changes to the reducers: new fields in the default values)
        // also add the app identifier if we don't already have one.
        this._refreshDatabase();
      })
      .then(() => {
        if (migrationRequired) {
          LOGi.store("Persistor: Initializing migration to move to the new persisting method");
          return this._migrate();
        }
      })
      .then(() => {
        LOGi.store("Persistor: Hydration Complete!");
        this.indicateProcessEnded();
      })
      .catch((err) => {
        LOGe.store("Persistor: Error during hydration", err);
        this.indicateProcessEnded();
        throw err;
      })
  }

  _checkHydrateMode() {
    return AsyncStorage.getItem(LEGACY_BASE_STORAGE_KEY + this.userId)
      .then((data) => {
        if (data) {
          return "classic";
        }
        return "v2";
      })
  }

  _hydrateClassic() {
    LOGi.store("Persistor: Starting classic hydration.");
    return AsyncStorage.getItem(LEGACY_BASE_STORAGE_KEY + this.userId)
      .then((data) => {
        if (data) {
          return JSON.parse(data);
        }
      })
  }


  /**
   * Called after hydrateClassic
   * @private
   */
  _migrate() {
    return this.persistFull()
      .then(() => {
        return AsyncStorage.removeItem(LEGACY_BASE_STORAGE_KEY + this.userId)
      })
  }

  _hydrateV2() {
    LOGi.store("Persistor: Starting new v2 hydration.");

    let pointerTreeReference = {};
    let baseData = {};

    return AsyncStorage.getAllKeys()
      .then((allKeys) => {
        LOGi.store("Persistor: all keys found:", allKeys);

        // get the keys for this user from the list of all keys.
        let userKeys = PersistorUtil.extractUserKeys(allKeys, this.userId);

        // get latest entries from the userKey list
        let latestData = PersistorUtil.extractLatestEntries(userKeys);
        let latestUserKeys = latestData.latestKeys;
        this.keyHistory = latestData.historyReference;

        // sort the userKeysList by length
        latestUserKeys.sort((a,b) => { return a.key.length - b.key.length; });
        LOGd.store("Persistor: userKeys found during hydration:", latestUserKeys);

        // filter out the legal and illegal keys. Illegal keys are parent keys that also have children.
        let { filteredUserKeys, illegalKeys } = PersistorUtil.filterParentEntries(latestUserKeys);

        if (illegalKeys.length > 0) {
          this._batchRemove(illegalKeys).catch((err) => { LOGe.store("Persistor: could not remove illegal keys", err); })
        }

        // construct pointer tree to fill user fields.
        let { pointerTree, keyListForRetrieval } = PersistorUtil.constructPointerTree(filteredUserKeys, baseData);
        pointerTreeReference = pointerTree;

        LOGd.store("Persistor: dataStructure found during hydration:", baseData);
        return AsyncStorage.multiGet(keyListForRetrieval);
      })
      .catch((err) => {
        // TODO: get older keys for the failed gets
        throw err;
      })
      .then((keyValuePairArray) => {
        for (let i = 0; i < keyValuePairArray.length; i++) {
          let pair = keyValuePairArray[i];
          if (pointerTreeReference[pair[0]]) {
            pointerTreeReference[pair[0]].pointer[pointerTreeReference[pair[0]].assignmentKey] = JSON.parse(pair[1]);
          }
        }
        return baseData;
      })
      .catch((err) => {
        LOGe.store("Persistor: Error during hydrate v2", err);
        throw err;
      })
  }




  /**
   * If we change the reducer default values, this adds any new fields to the redux database
   * so we don't have to error catch everywhere.
   *
   * Finally we create the app identifier
   */
  _refreshDatabase() {
    LOGd.store("Persistor: Refreshing database");
    let state = this.store.getState();
    let refreshActions = [];
    let sphereIds = Object.keys(state.spheres);

    // refresh all fields that do not have an ID requirement
    refreshActions.push({type:'REFRESH_DEFAULTS'});
    for (let i = 0; i < sphereIds.length; i++) {
      let sphereId = sphereIds[i];
      let stoneIds = Object.keys(state.spheres[sphereId].stones);
      let locationIds = Object.keys(state.spheres[sphereId].locations);
      let applianceIds = Object.keys(state.spheres[sphereId].appliances);
      let userIds = Object.keys(state.spheres[sphereId].users);

      refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, sphereOnly: true});
      stoneIds.forEach(    (stoneId)     => { refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, stoneId:     stoneId});});
      locationIds.forEach( (locationId)  => { refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, locationId:  locationId});});
      applianceIds.forEach((applianceId) => { refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, applianceId: applianceId});});
      userIds.forEach(     (userId)      => { refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, userId:      userId});});
    }

    // create an app identifier if we do not already have one.
    refreshActions.push({type:'CREATE_APP_IDENTIFIER'});

    this.store.batchDispatch(refreshActions);
  }


  persistFull() {
    LOGi.store("Persistor: Starting full persist.");
    let state = this.store.getState();
    return this._persist(state, state, true);
  }

  persistChanges(oldState, newState) : Promise<void> {
    LOGd.store("Persistor: Starting partial persist.");
    return this._persist(oldState, newState, false);
  }

  _persist(oldState, newState, fullPersist = false) : Promise<void> {
    this.processPending = true;
    // outline
    /*
    {
      user: DIRECT
      devices: DIRECT,
      spheres: {
        ID: {
          config:     DIRECT,
          users:      DIRECT,
          presets:    DIRECT,
          locations:  {ID}, <-- per ID
          stones:  {
            ID: {
              config: DIRECT,
              state: DIRECT,
              behaviour: DIRECT,
              schedules: PER ID,
              errors: DIRECT,
              powerUsage: PER ID
            },
          }
          messages:   DIRECT,
          appliances: {ID}  <-- per ID
        }
      }
      events: DIRECT,
      installations: DIRECT,
      app: DIRECT,
      development: DIRECT
    }
    */


    // The idContainers indicate which parts of the tree consist of arrays.
    // These allow for wildcard-ish references for the path (uuid string replaced by {id})
    const idContainers = {
      'spheres': true,
      'spheres.{id}.stones':true
    };

    // unpack keys are keys in the path that will not just be stringified and stored, but rather stepped into and stored in pieces.
    const unpackKeys = {
      'spheres'                  : true,
      'spheres.{id}'             : true,
      'spheres.{id}.locations'   : true,
      'spheres.{id}.appliances'  : true,
      'spheres.{id}.stones'      : true,
      'spheres.{id}.stones.{id}' : true,
      'spheres.{id}.stones.{id}.powerUsage': true,
    };

    let keyValueWrites = [] as [string[]];
    let keysToRemove = [] as string[];

    let options : persistOptions = {
      idContainers: idContainers,
      unpackKeys: unpackKeys,
      fullPersist: fullPersist,
      handlers: {
        difference: (a,b,path,storageKey) => {
          // Store B
          this._parseForStorage(b, path, storageKey, options, keyValueWrites, keysToRemove);
        },
        undefinedInB: (a,b,path,storageKey) => {
          PersistorUtil.insertAllHistoryKeyPossibilities(storageKey, keysToRemove);
        },
      }
    };


    // to look for changes, we compare the old and new state. Given that everything is immutable, this should be very fast.
    // --> iterate over the oldState
    let oldKeys = Object.keys(oldState);
    for (let i = 0; i < oldKeys.length; i++) {
      let field = oldKeys[i];
      compare(oldState[field], newState[field], field, this.userId + '.' + field, options);
    }


    // for things that have been added, we should check if the newState has new fields
    // --> iterate over the newState
    options.handlers = {
      difference:   (a,b,path,storageKey) => { /* do nothing */ },
      undefinedInB: (a,b,path,storageKey) => {
        // Store A
        this._parseForStorage(a, path, storageKey, options, keyValueWrites, keysToRemove);
      },
    };

    let newKeys = Object.keys(newState);
    for (let i = 0; i < newKeys.length; i++) {
      let field = newKeys[i];
      compare(newState[field], oldState[field], field, this.userId + '.' + field, options);
    }

    // handle all changes in batches.
    return this._batchPersist(keyValueWrites)
      .then(() => {
        return this._batchRemove(keysToRemove);
      })
      .then(() => {
        this.indicateProcessEnded();
      })
      .catch((err) => {
        this.indicateProcessEnded();
        throw err;
    })
  }

  _parseForStorage(data, path, storageKey, options, resultArray, keysToRemove) {
    let storeAndManageHistory = () => {
      // if this key has no history, create a new index.
      if (this.keyHistory[storageKey] === undefined) {
        this.keyHistory[storageKey] = 0;
      }

      // remove ancient history for this entry (we store the current one and the new one. The one before gets removed).
      let previousIndex = (this.keyHistory[storageKey] + (HISTORY_CYCLE_SIZE-1)) % HISTORY_CYCLE_SIZE;
      let historyKey = storageKey + HISTORY_PREFIX + previousIndex;
      keysToRemove.push(historyKey);

      // move the index one forward
      this.keyHistory[storageKey] = (this.keyHistory[storageKey] + 1) % HISTORY_CYCLE_SIZE;

      // update the key and add it the the store
      let newKey = storageKey + HISTORY_PREFIX + this.keyHistory[storageKey];
      resultArray.push([newKey, JSON.stringify(data)]);
    };

    if (!isObject(data)) {
      return storeAndManageHistory()
    }

    if (options.unpackKeys && options.unpackKeys[path]) {
      // unpack
      let keys = Object.keys(data);
      for (let i = 0; i < keys.length; i++) {
        let field = keys[i];
        let nextPath = path;
        let nextStorageKey = storageKey + '.' + field;
        if (options.idContainers && options.idContainers[path]) {
          nextPath += '.{id}'
        }
        else {
          nextPath += '.' + field;
        }
        this._parseForStorage(data[field], nextPath, nextStorageKey, options, resultArray, keysToRemove);
      }
    }
    else {
      storeAndManageHistory();
    }
  }


  _batchPersist(keyValueWrites : [string[]]) : Promise<void> {
    return new Promise((resolve, reject) => {
      if (keyValueWrites.length > 0) {
        let updatedKeys = [];
        for (let i = 0; i < keyValueWrites.length; i++) {
          updatedKeys.push(keyValueWrites[i][0]);
        }

        AsyncStorage.multiSet(keyValueWrites)
          .then(() => {
            this._updateUserKeyCache(updatedKeys);
            LOGd.store('Persistor: batch persisted', keyValueWrites);
          })
          .then( ()    => { resolve(); })
          .catch((err) => { reject(err); })
      }
      else {
        resolve();
      }
    })
  }

  _batchRemove(keyRemovals : string[]) : Promise<void> {
    return new Promise((resolve, reject) => {
      if (keyRemovals.length > 0) {
          this._cascadeRemovals(keyRemovals)
            .then((allKeyRemovals : string[] ) => {
              return AsyncStorage.multiRemove(allKeyRemovals)
                .then(() => { this._removeFromUserKeyCache(allKeyRemovals); })
            })
            .then(() => { LOGd.store('Persistor: Batch removed', keyRemovals)})
            .then(() => { resolve(); })
            .catch(      (err) => { reject(err); })
      }
      else {
        resolve();
      }
    });
  }


  /**
   * If a key is deleted, all of it's children keys should ALSO be deleted. This cascade is handled here.
   * @param {string[]} keyRemovals
   * @returns {Promise<string[]>}
   * @private
   */
  _cascadeRemovals(keyRemovals : string[]) : Promise<string[]> {
    return new Promise((resolve, reject) => {
      // we require a userKey reference, either get it or we already have it.
      let userKeys = Object.keys(this.userKeys);
      if (userKeys.length === 0) {
        return this._createUserKeyCache()
          .catch((err) => { reject(err); });
      }
      else {
        resolve();
      }
    })
      .then(() => {
        // create keyRemovalMap for quick lookup.
        let keyRemovalMap = {};
        for (let i = 0; i < keyRemovals.length; i++) {
          keyRemovalMap[keyRemovals[i]] = true;
        }

        // cache exists
        let userKeys = Object.keys(this.userKeys);
        for (let i = 0; i < keyRemovals.length; i++) {
          let candidateWithHistoryTag = keyRemovals[i];

          // since we match the candidate key as a part of a longer key, the history tag has to be stripped.
          let candidate = PersistorUtil.stripHistoryTag(candidateWithHistoryTag);
          let keyLength = candidate.length;

          for (let j = 0; j < userKeys.length; j++) {
            let checkKey = userKeys[j];
            // we check length without history tag for a fair comparison.
            let checkKeyWithoutHistoryTag = PersistorUtil.stripHistoryTag(checkKey);

            // if this key is not already scheduled to be removed.
            if (!keyRemovalMap[checkKey]) {
              // if the key is larger than the parent key and the parentKey prefixes this key
              if (checkKeyWithoutHistoryTag.length > keyLength && checkKey.substr(0, keyLength) === candidate) {
                keyRemovals.push(checkKey);
                keyRemovalMap[checkKey] = true;
                LOGd.store("Persistor: Added field to be removed due to cascade.", checkKey);
              }
            }
          }
        }

        // all cascaded removals have been added to this list.
        return keyRemovals;
      })
  }


  /**
   * This creates the cache for all userKeys including their history tags.
   * @private
   */
  _createUserKeyCache() {
    this.userKeys = {};
    return AsyncStorage.getAllKeys()
      .then((keys) => {
        for (let i = 0; i < keys.length; i++) {
          let key = keys[i];
          let keyArray = key.split('.');
          if (keyArray[0] === this.userId) {
            this.userKeys[key] = true;
          }
        }
      })
  }



  _updateUserKeyCache(updatedKeys : string[]) {
    for (let i = 0; i < updatedKeys.length; i++) {
      this.userKeys[updatedKeys[i]] = true;
    }
  }

  _removeFromUserKeyCache(keyRemovals : string[]) {
    for (let i = 0; i < keyRemovals.length; i++) {
      let key = keyRemovals[i];
      if (this.userKeys[key] !== undefined) {
        this.userKeys[key] = false;
        delete this.userKeys[key];
      }
    }
  }
}


function compareObjects(a, b, path, storageKey, options: persistOptions) {
  let keys = Object.keys(a);
  for (let i = 0; i < keys.length; i++) {
    let field = keys[i];
    let nextPath = path;
    let nextStorageKey = storageKey + '.' + field;
    if (options.idContainers && options.idContainers[path]) {
      nextPath += '.{id}'
    }
    else {
      nextPath += '.' + field;
    }
    compare(a[field] ,b[field], nextPath, nextStorageKey, options);
  }
}

function checkObjects(a, b, path, storageKey, options : persistOptions) {
  if (a === b && options.fullPersist !== true) {
    //  no need to store --> no changes
  }
  else {
    // CHANGE!

    // check if this field is stored as-is or if we step in.
    if (options.unpackKeys && options.unpackKeys[path]) {
      compareObjects(a, b, path, storageKey, options);
    }
    else {
      options.handlers.difference(a,b,path,storageKey);
    }
  }
}

function compare(a, b, path, storageKey, options: persistOptions) {
  if (b === undefined) {
    options.handlers.undefinedInB(a,b,path,storageKey);
  }
  else if (b === null) {
    console.warn("Persistor: B is null!", a,b,path,storageKey);
  }
  else if (Array.isArray(a) === true && Array.isArray(b) === true) {
    // todo: compare arrays
    console.warn("Persistor: Comparing arrays is required!", a,b,path,storageKey);
  }
  else if (isObject(a) && isObject(b)) {
    checkObjects(a, b, path, storageKey, options);
  }
}


function isObject(data) {
  return (
    data !== undefined &&
    data !== null &&
    Array.isArray(data) !== true &&
    typeof data === 'object'
  );
}



