import { Alert } from 'react-native'
import AsyncStorage from "@react-native-async-storage/async-storage";
import {PersistorUtil} from "./PersistorUtil";
import { LOGd, LOGe, LOGi, LOGw } from "../../logging/Log";
import { LOG_LEVEL } from "../../logging/LogLevels";

const LEGACY_BASE_STORAGE_KEY = 'CrownstoneStore_';
const MIGRATION_PROGRESS_STORAGE_KEY = 'CrownstoneMigrationProgress';
export const HISTORY_PREFIX = '_@$:';
export const HISTORY_CYCLE_SIZE = 10;

// We keep 1 historical item. WARN: This cannot be changed without a refactor of this module.
// We will assume the amount of history kept is never more than half the cycle size.
export const HISTORY_SIZE = 1;


interface persistOptions {
  idContainers: { [propName: string]: boolean },
  unpackKeys:   { [propName: string]: boolean },
  fullPersist? : boolean,
  handlers: {
    difference(a: any, b: any, path: string, storageKey: string) : void,
    undefinedInB(a: any, b: any, path: string, storageKey: string) : void,
  }
}

interface asyncMultiError {
  key: string,
  message: string
}

const FAILED_DB_ERROR = 'FAILED_REPAIR_DB';


/**
 *
 */
export class Persistor {
  userId : string;
  store : any;
  initialized : boolean = false;
  userKeyCache : map = {};
  processPending = false;
  executeOnFinish: any = null;

  lastPersistedState = null;
  persistQueue = [];

  keyHistory : numberMap = {};

  initialize(userId, store) : Promise<void> {
    LOGi.store("Persistor: Initializing...");
    this.userId = userId;
    this.store = store;
    return this.hydrate()
      .then(() => {
        this.initialized = true;
      })
  }

  destroyActiveUser() {
    return AsyncStorage.getAllKeys()
      .then((allKeys) => {
        LOGd.store("Persistor: all keys found:", allKeys);

        // get the keys for this user from the list of all keys.
        let userKeys = PersistorUtil.extractUserKeys(allKeys, this.userId);
        console.log("ALL USER KEYS", userKeys)
        return AsyncStorage.multiRemove(userKeys)
      })
  }


  /**
   * The PathObject can use _id_ as wildcard
   *  { spheres : { _id_: stones : { _id_ : activityLogs}}}
   *
   *  This method will write a file with validationKeys. These can be checked beforehand to see if we have to actually do anything.
   *
   * @param pathObject
   */
  destroyDataFields(pathObjects : any[], verificationKey) {
    let progressData : string = null;
    return AsyncStorage.getItem(MIGRATION_PROGRESS_STORAGE_KEY)
      .then((data) : any => {
        progressData = data;
        return this._destroyDataFields(pathObjects);
        if (!data) {
          return this._destroyDataFields(pathObjects);
        }
        else {
          let dataArr = data.split(";");
          if (dataArr.indexOf(verificationKey) === -1) {
            return this._destroyDataFields(pathObjects);
          }
        }
        return false;
      })
      .then((haveToPersist) => {
        if (haveToPersist === false) {
          return;
        }

        let newValue = progressData + ";" + verificationKey;
        if (!progressData) {
          newValue = verificationKey;
        }
        return AsyncStorage.setItem(MIGRATION_PROGRESS_STORAGE_KEY, newValue)
      })
      .catch((err) => {
        console.warn("destroyDataFields ERROR: ", err)
      })
  }

  // this method actually does the work
  _destroyDataFields(pathObjects : any[]) {
    return AsyncStorage.getAllKeys()
      .then((allKeys) => {
        let keysToDestroy = {}; // this is map to ensure that we do not delete a key twice
        for (let i = 0; i < pathObjects.length; i++) {
          this._selectMatchingKeys(pathObjects[i], allKeys, keysToDestroy);
        }
        return AsyncStorage.multiRemove(Object.keys(keysToDestroy))
      })
  }

  _getPathStructureFromPathObject(pathObject) {
    let structure = [];
    let parser = function(obj, arr) {
      if (typeof obj === 'object') {
        let key = Object.keys(obj)[0]
        arr.push(key);
        if (typeof obj[key] === 'object') {
          parser(obj[key],arr);
        }
        else {
          arr.push(obj[key])
        }
      }
    }

    if (typeof pathObject === 'object') {
      parser(pathObject, structure);
    }
    else {
      return [pathObject]
    }

    return structure;
  }

  _selectMatchingKeys(pathObject: any, allKeys : string[], keysToDestroy: any) {
    let pathStructure = this._getPathStructureFromPathObject(pathObject);

    for ( let i = 0; i < allKeys.length; i++ ) {
      let key = allKeys[i]
      if (keysToDestroy[key]) { continue; }

      let keyArr = key.split(".");
      for (let j = 0; j < pathStructure.length && j < keyArr.length -1; j++) {
        if (pathStructure[j] === "_id_") {
          continue;
        }

        if (keyArr[j+1] !== pathStructure[j]) {
          if (keyArr[j+1].split("_@$")[0] !== pathStructure[j]) {
            break;
          }
        }

        if (j === pathStructure.length - 1) {
          keysToDestroy[key] = true;
        }
      }


    }
  }

  endSession() : Promise<void> {
    return new Promise((resolve, reject) => {
      this.initialized = false;
      this.userId = null;
      this.store = null;
      this.userKeyCache = {};
      if (this.processPending === true) {
        this.executeOnFinish = resolve;
      }
      else {
        resolve();
      }
    })
  }

  indicateProcessEnded(newState) {
    this.lastPersistedState = newState;
    this.processPending = false;
    if (typeof this.executeOnFinish === 'function') {
      this.executeOnFinish();
      this.executeOnFinish = null;
    }
  }


  fail() {
    Alert.alert(
      "Failed to read database",
      "Unfortunately, I was unable to read the database. You will have to log in again, some data may have been lost.",
      [{text: "OK"}],
      {cancelable: false}
    );
  }




  hydrate() {
    this.processPending = true;
    LOGi.store("Persistor: Starting Hydration...");
    let migrationRequired = false;
    let abortHydration = false;
    let initialState;
    return this._checkHydrateMode()
      .then((result) => {
        LOGi.store("Persistor: hydration mode determined: ", result);
        switch (result) {
          case 'classic':
            migrationRequired = true;
            return this._hydrateClassic()
              .catch((err) => {
                if (err === FAILED_DB_ERROR) {
                  throw err;
                }
                this.fail();
                migrationRequired = false;
                return {};
              });
          case 'v2':
            return this._hydrateV2();
          case 'reset':
            abortHydration = true;
            break;
          default:
            throw 'FAILED_GETTING_HYDRATE_MODES';
        }
      })
      .then((initialState) => {
        if (abortHydration === false) {
          LOGd.store("Persistor: Initial state obtained for hydration:", initialState);
          this.store.dispatch({type:"HYDRATE", state: initialState, __logLevel: LOG_LEVEL.verbose });
          // update the store based on new fields in the database (changes to the reducers: new fields in the default values)
          // also add the app identifier if we don't already have one.
          this._refreshDatabase();
        }
      })
      .then(() => {
        if (migrationRequired) {
          LOGi.store("Persistor: Initializing migration to move to the new persisting method");
          return this._migrate();
        }
      })
      .then(() => {
        LOGi.store("Persistor: Hydration Complete!");
        this.indicateProcessEnded(initialState);
      })
      .catch((err) => {
        LOGe.store("Persistor: Error during hydration", err);
        this.indicateProcessEnded(initialState);
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
      .catch(() => {
        return AsyncStorage.removeItem(LEGACY_BASE_STORAGE_KEY + this.userId)
          .then(() => { this.fail(); })
          .then(() => { return 'reset'; })
          .catch(() => {
            Alert.alert(
              "Error getting Database",
              "You will need to reinstall the app to resolve this issue. Our apologies for the inconvenience.",
              [{text:'OK'}]
            );
            throw FAILED_DB_ERROR;
          })
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


  /**
   * Extract the user keys from the available keys and return a set we will work with.
   * @private
   */
  _step1() : Promise<string[]> {
    // reset globals that we change in this method.
    this.keyHistory   = {};
    this.userKeyCache = {};
    LOGd.store("Persistor: Hydration v2 Step1, gettings all keys.");
    return AsyncStorage.getAllKeys()
      .then((allKeys) => {
        LOGd.store("Persistor: all keys found:", allKeys);

        // get the keys for this user from the list of all keys.
        let userKeys = PersistorUtil.extractUserKeyData(allKeys, this.userId);

        // generate a user key cache
        this._createUserKeyCache(allKeys);

        // get latest entries from the userKey list
        let latestData     = PersistorUtil.extractLatestEntries(userKeys);
        let latestUserKeys = latestData.latestKeys;
        this.keyHistory    = latestData.historyReference; // this is a map with all the oldest indices of this data set.

        // sort the userKeysList by length
        latestUserKeys.sort((a,b) => { return a.key.length - b.key.length; });
        LOGd.store("Persistor: Hydration v2 Step1, userKeyCache found during hydration:", latestUserKeys);

        // filter out the legal and illegal keys. Illegal keys are parent keys that also have children.
        let { filteredUserKeys, illegalKeys } = PersistorUtil.filterParentEntries(latestUserKeys);

        // delete illegal keys.
        if (illegalKeys.length > 0) {
          LOGd.store("Persistor: Hydration v2 Step1, removing illegal keys...", illegalKeys);
          // illegal keys do not have to be _batchRemoved since that also cascades.
          return AsyncStorage.multiRemove(illegalKeys)
            .catch((err) => {
              LOGe.store("Persistor: Hydration v2 Step1, Failed in step 1", err);
              throw err;
            })
            .then(() => {
              LOGd.store("Persistor: Hydration v2 Step1, illegal keys removed, retrying step 1.");
              return this._step1();
            })
        }
        else {
          return filteredUserKeys;
        }
      })
  }


  /**
   * Try to get the supplied keys. If this fails, remove those that fail and start back in step 1
   *
   * @param keyList
   * @private
   */
  _step2(keyList : string[]) {
    LOGd.store("Persistor: Hydration v2 Step2, getting data from keys.");
    return AsyncStorage.multiGet(keyList)
      .catch((errorArray : asyncMultiError[]) => {
        LOGw.store("Persistor: Hydration v2 Step2, error while getting data.");
        // attempt to get the historical version of failed keys.
        if (Array.isArray(errorArray)) {
          // handle all errors
          let failedKeys = [];
          errorArray.forEach((err : asyncMultiError) => {
            let key = err.key;
            LOGw.store("Persistor: Hydration v2 Step2, problem getting key in step 2:", key, err.message);
            failedKeys.push(key);
          });

          // clear broken keys.
          LOGd.store("Persistor: Hydration v2 Step2, removing failing keys.", failedKeys);
          return AsyncStorage.multiRemove(failedKeys)
            .catch((err) => {
              LOGe.store("Persistor: Hydration v2 Step2, Failed in step 2.", err);
              throw err;
            })
            .then(() => {     return this._step1() })
            .then((keys) => { return this._step2(keys) })
        }
        else {
          LOGe.store("Persistor: Error is not array as we expected. Failed step 2", errorArray);
          throw errorArray;
        }
      })
  }


  /**
   * Checking received data for nulls
   * @param keyValuePairArray
   * @returns {any}
   * @private
   */
  _step3(keyValuePairArray) {
    LOGd.store("Persistor: Hydration v2 Step3, checking received data for nulls.");

    // check if we have empty data in our set. This means a key was empty. This should not happen.
    // The only thing we can do is strip the key from the selection.
    let invalidKeys = [];
    let validKeys = [];
    for (let i = 0; i < keyValuePairArray.length; i++) {
      let pair = keyValuePairArray[i];
      let key = pair[0];
      let data = pair[1];

      if (data === null) {
        invalidKeys.push(key);
      }
      else {
        validKeys.push(key);
      }
    }


    // invalid keys are being batchRemoved. This will cascase as well.
    if (invalidKeys.length > 0) {
      LOGd.store("Persistor: Hydration v2 Step3, Removing invalid keys.", invalidKeys);
      return this._batchRemove(invalidKeys)
        .catch((err) => {
          LOGe.store("Persistor: Hydration v2 Step3, Failed step 3", err);
          throw err;
        })
        .then(()                  => { return this._step1();                  })
        .then((userKeys)          => { return this._step2(userKeys);          })
        .then((keyValuePairArray) => { return this._step3(keyValuePairArray); })
    }
    else {
      return keyValuePairArray;
    }
  }


  /**
   * Creating pointer tree and placing data.
   * @param keyValuePairArray
   * @returns {{}}
   * @private
   */
  _step4(keyValuePairArray) {
    LOGd.store("Persistor: Hydration v2 Step4, creating pointer tree and placing data.");
    let usedKeys = [];
    for (let i = 0; i < keyValuePairArray.length; i++) {
      usedKeys.push(keyValuePairArray[i][0]);
    }

    // construct pointer tree to fill user fields.
    let baseData = {};
    let pointerTree = PersistorUtil.constructPointerTree(usedKeys, baseData);
    for (let i = 0; i < keyValuePairArray.length; i++) {
      // the pointer tree uses stripped keys so it is immune to historical data.
      let pair = keyValuePairArray[i];
      let strippedKey = PersistorUtil.stripHistoryTag(pair[0]);
      let data = pair[1];

      if (pointerTree[strippedKey]) {
        pointerTree[strippedKey].pointer[pointerTree[strippedKey].assignmentKey] = JSON.parse(data);
      }
    }
    return baseData;
  }


  _hydrateV2() {
    LOGi.store("Persistor: Starting new v2 hydration.");
    return this._step1()
      .then((userKeys)          => { return this._step2(userKeys); })
      .then((keyValuePairArray) => { return this._step3(keyValuePairArray); })
      .then((keyValuePairArray) => { return this._step4(keyValuePairArray); })
      .catch((err) => {
        LOGe.store("Persistor: Error during hydrate v2", err);
        this.fail();
        return {};
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

      refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, sphereOnly: true});

      if (state.spheres[sphereId].stones) {
        let stoneIds = Object.keys(state.spheres[sphereId].stones);
        stoneIds.forEach((stoneId) => { refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, stoneId: stoneId});});
      }
      if (state.spheres[sphereId].locations) {
        let locationIds = Object.keys(state.spheres[sphereId].locations);
        locationIds.forEach((locationId) => { refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, locationId: locationId});});
      }
      if (state.spheres[sphereId].users) {
        let userIds = Object.keys(state.spheres[sphereId].users);
        userIds.forEach((userId) => { refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, userId: userId});});
      }
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

  _checkPersistQueue() {
    if (this.persistQueue.length > 0) {
      if (this.processPending !== true) {
        this._persist(this.lastPersistedState, this.store.getState(), false).then(() => {
          // on next tick.
          this.persistQueue.forEach((queue) => {
            queue.resolver();
          });
          this.persistQueue = [];
        })
      }
    }
    return false;
  }

  persistChanges(oldState, newState) : Promise<void> {
    LOGd.store("Persistor: Starting partial persist.");
    if (this.processPending === true) {
      return new Promise((resolve, reject) => {
        this.persistQueue.push({resolver: resolve});
      })
    }

    return this._persist(this.lastPersistedState || oldState, newState, false).then(() => {
      // on next tick.
      setTimeout(() => { this._checkPersistQueue(); }, 0);
    })
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
              errors: DIRECT,
              powerUsage: PER ID
            },
          }
          messages:   DIRECT,
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
      'spheres'                  : true, // so each sphere is a separate file
      'spheres.{id}'             : true, // each item IN a sphere is a separate file (config, layout etc)
      'spheres.{id}.locations'   : true, // each individual location is a separate file
      'spheres.{id}.sortedLists' : true, // each sorted list is a separate file
      'spheres.{id}.scenes'      : true, // each scene is a separate file
      'spheres.{id}.stones'      : true, // each stone is a separate file
      'spheres.{id}.stones.{id}' : true, // each item IN a stone is a separate file.
    };

    let keyValueWrites = [] as string[][];
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
        this.indicateProcessEnded(newState);
      })
      .catch((err) => {
        this.indicateProcessEnded(newState);
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


  _batchPersist(keyValueWrites : string[][]) : Promise<void> {
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
      // we require a userKey identifier, either get it or we already have it.
      let userKeys = Object.keys(this.userKeyCache);
      if (userKeys.length === 0) {
        return this._getAndCreateUserKeyCache()
          .catch((err) => { reject(err); });
      }
      else {
        resolve([]);
      }
    })
      .then(() => {
        // create keyRemovalMap for quick lookup.
        let keyRemovalMap = {};
        for (let i = 0; i < keyRemovals.length; i++) {
          keyRemovalMap[keyRemovals[i]] = true;
        }

        // cache exists
        let userKeys = Object.keys(this.userKeyCache);
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
                // check if these keys are on the same level before deleting one of them.
                if (checkKeyWithoutHistoryTag.match(/(\.)/g).length !== candidate.match(/(\.)/g).length) {
                  keyRemovals.push(checkKey);
                  keyRemovalMap[checkKey] = true;
                  LOGd.store("Persistor: Added field to be removed due to cascade.", checkKey);
                }
                else {
                  LOGd.store("Persistor: SKIPPING cascaded field that did not pass the level check.");
                }

              }
            }
          }
        }

        // all cascaded removals have been added to this list.
        return keyRemovals;
      })
  }


  /**
   * This creates the cache for all userKeyCache including their history tags.
   * @private
   */
  _getAndCreateUserKeyCache() {
    return AsyncStorage.getAllKeys()
      .then((allKeys) => {
        this._createUserKeyCache(allKeys);
      })
  }

  _createUserKeyCache(allKeys) {
    this.userKeyCache = {};
    for (let i = 0; i < allKeys.length; i++) {
      let key = allKeys[i];
      let keyArray = key.split('.');
      if (keyArray[0] === this.userId) {
        this.userKeyCache[key] = true;
      }
    }
  }

  _updateUserKeyCache(updatedKeys : string[]) {
    for (let i = 0; i < updatedKeys.length; i++) {
      this.userKeyCache[updatedKeys[i]] = true;
    }
  }

  _removeFromUserKeyCache(keyRemovals : string[]) {
    for (let i = 0; i < keyRemovals.length; i++) {
      let key = keyRemovals[i];
      if (this.userKeyCache[key] !== undefined) {
        this.userKeyCache[key] = false;
        delete this.userKeyCache[key];
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
  else if (a !== b) {
    options.handlers.difference(a,b,path,storageKey)
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
