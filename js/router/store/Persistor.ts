import { AsyncStorage } from 'react-native'
import {LOG, LOGd, LOGe, LOGi, LOGv} from '../../logging/Log'


const BASE_STORAGE_KEY = 'CrownstoneStore_';

interface persistOptions {
  idContainers: { [propName: string]: boolean },
  unpackKeys:   { [propName: string]: boolean },
  fullPersist? : boolean,
  handlers: {
    difference(a: any, b: any, path: string, storageKey: string) : void,
    undefinedInB(a: any, b: any, path: string, storageKey: string) : void,
  }
}
// in your root javascript file
import 'react-native-console-time-polyfill';
import {LOG_LEVEL} from "../../logging/LogLevels";


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
    return AsyncStorage.getItem(BASE_STORAGE_KEY + this.userId)
      .then((data) => {
        if (data) {
          return "classic";
        }
        return "v2";
      })
  }

  _hydrateClassic() {
    LOGi.store("Persistor: Starting classic hydration.");
    return AsyncStorage.getItem(BASE_STORAGE_KEY + this.userId)
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
        return AsyncStorage.removeItem(BASE_STORAGE_KEY + this.userId)
      })
  }

  _hydrateV2() {
    LOGi.store("Persistor: Starting new v2 hydration.");
    let data = {};
    let pointerIndex = {};

    function storePointer(pointer, assignmentKey, key) {
      pointerIndex[key] = {assignmentKey: assignmentKey, pointer: pointer};
    }

    return AsyncStorage.getAllKeys()
      .then((keys) => {
        LOGi.store("Persistor: all keys found:", keys);
        let userKeys = [];
        let keyListForRetrieval = [];
        for (let i = 0; i < keys.length; i++) {
          let key = keys[i];
          let keyArray = key.split('.');
          if (keyArray[0] === this.userId) {
            userKeys.push({key:key, arr: keyArray});
          }
        }

        userKeys.sort((a,b) => { return a.key.length - b.key.length; });
        LOGd.store("Persistor: userKeys found during hydration:", userKeys);

        // get parent keys out of this list because they will destroy the pointer tree
        let filteredUserKeys = [];
        for (let i = 0; i < userKeys.length - 1; i++) {
          let found = false;
          let checkKey = userKeys[i].key;
          for (let j = i + 1; j < userKeys.length; j++) {
            let candidate = userKeys[j].key;

            if (candidate.substr(0, checkKey.length) === checkKey) {
              found = true;
              break;
            }
          }
          if (!found) {
            filteredUserKeys.push(userKeys[i]);
          }
        }


        // construct pointer tree to fill user fields.
        for (let i = 0; i < filteredUserKeys.length; i++) {
          let key = filteredUserKeys[i].key;
          let keyArray = filteredUserKeys[i].arr;

          // save in cache map.
          this.userKeys[key] = true;

          // index 0 is the userId
          let pointer = data;
          for (let j = 1; j < keyArray.length; j++) {
            if (pointer[keyArray[j]] === undefined) {
              pointer[keyArray[j]] = {};
            }

            if (keyArray.length > j+1) {
              pointer = pointer[keyArray[j]]
            }
            else {
              // end of path
              // get the data on this key
              storePointer(pointer, keyArray[j], key);
            }
          }
          keyListForRetrieval.push(key);
        }

        LOGv.store("Persistor: dataStructure found during hydration:", data);
        return AsyncStorage.multiGet(keyListForRetrieval);
      })
      .then((keyValuePairArray) => {
        for (let i = 0; i < keyValuePairArray.length; i++) {
          let pair = keyValuePairArray[i];
          if (pointerIndex[pair[0]]) {
            pointerIndex[pair[0]].pointer[pointerIndex[pair[0]].assignmentKey] = JSON.parse(pair[1]);
          }
        }
        return data;
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

    const idContainers = {
      'spheres': true,
      'spheres.{id}.stones':true
    };

    const unpackKeys = {
      'spheres'                 : true,
      'spheres.{id}'            : true,
      'spheres.{id}.locations'  : true,
      'spheres.{id}.appliances' : true,
      'spheres.{id}.stones'     : true,
      'spheres.{id}.stones.{id}': true,
      'spheres.{id}.stones.{id}.powerUsage': true,
    };

    let keyValueWrites = [] as [string[]];
    let keyRemovals = [];
    let keyRemovalMap = {};


    let options : persistOptions = {
      idContainers: idContainers,
      unpackKeys: unpackKeys,
      fullPersist: fullPersist,
      handlers: {
        difference: (a,b,path,storageKey) => {
          // Store B
          this._parseForStorage(b, path, storageKey, options, keyValueWrites);
        },
        undefinedInB: (a,b,path,storageKey) => {
          keyRemovals.push(storageKey);
          keyRemovalMap[storageKey] = true;
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
        this._parseForStorage(a, path, storageKey, options, keyValueWrites);
      },
    };

    let newKeys = Object.keys(newState);
    for (let i = 0; i < newKeys.length; i++) {
      let field = newKeys[i];
      compare(newState[field], oldState[field], field, this.userId + '.' + field, options);
    }

    return this._batchPersist(keyValueWrites)
      .then(() => {
        return this._batchRemove(keyRemovals, keyRemovalMap);
      })
      .then(() => {
        this.indicateProcessEnded();
      })
      .catch((err) => {
        this.indicateProcessEnded();
        throw err;
    })
  }

  _parseForStorage(data, path, storageKey, options, resultArray) {
    let storeData = () => {
      resultArray.push([storageKey, JSON.stringify(data)]);
    };

    if (!isObject(data)) {
      return storeData()
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
        this._parseForStorage(data[field], nextPath, nextStorageKey, options, resultArray);
      }
    }
    else {
      storeData();
    }
  }

  // _batchSinglePersist(keyValueWrites : [string[]], newKeys: string[]) : Promise<void> {
  //   let promises = [];
  //
  //   keyValueWrites.forEach((kvWrite) => {
  //     promises.push(AsyncStorage.mergeItem(kvWrite[0], kvWrite[1])
  //       .then((x) => { console.log("COMPLETED", kvWrite[0], kvWrite[1], x) })
  //       .catch((err) => { console.log("FAILED", err) }))
  //   });
  //
  //   return Promise.all(promises).then(() => {});
  // }

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

  _batchRemove(keyRemovals : string[], keyRemovalMap : map) : Promise<void> {
    return new Promise((resolve, reject) => {
      if (keyRemovals.length > 0) {
          this._cascadeRemovals(keyRemovals, keyRemovalMap)
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

  _cascadeRemovals(keyRemovals : string[], keyRemovalMap : map) : Promise<string[]> {
    return new Promise((resolve, reject) => {
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
        // cache exists
        let userKeys = Object.keys(this.userKeys);
        for (let i = 0; i < keyRemovals.length; i++) {
          let keyToBeDeleted = keyRemovals[i];
          let keyLength = keyToBeDeleted.length;

          for (let j = 0; j < userKeys.length; j++) {
            let userKey = userKeys[j];
            // if this key is not already schedules to be removed.
            if (!keyRemovalMap[userKey]) {
              // if the key is larger than the parent key and the parentKey prefixes this key
              if (userKey.length > keyLength && userKey.substr(0, keyLength) === keyToBeDeleted) {
                keyRemovals.push(userKey);
                keyRemovalMap[userKey] = true;
                LOGd.store("Persistor: Added field to be removed due to cascade.", userKey);
              }
            }
          }
        }

        // all cascaded removals have been added to this list.
        return keyRemovals;
      })
  }

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



