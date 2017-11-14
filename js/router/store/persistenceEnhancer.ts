import { AsyncStorage } from 'react-native'
import { LOG } from '../../logging/Log'


/**
 * This will ensure that the usage of the classifier will be done according
 * to when the fingerprints of all rooms are ready.
 *
 * @param getState
 * @returns {function(*): function(*=)}
 * @constructor
 */
export function PeristenceEnhancer({ getState }) {
  return (next) => (action) => {
    if (action.type === 'HYDRATE') { return next(action); }


    // required for some of the actions
    let oldState = getState();

    let returnValue = next(action);

    // state after update
    let newState = getState();

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

    let userId = 'test'

    const idContainers = {
      'spheres': true,
      'spheres.{id}.stones':true
    }

    const unpackKeys = {
      'spheres'                 : true,
      'spheres.{id}'            : true,
      'spheres.{id}.locations'  : true,
      'spheres.{id}.appliances' : true,
      'spheres.{id}.stones'     : true,
      'spheres.{id}.stones.{id}': true,
      'spheres.{id}.stones.{id}.powerUsage': true,
    }

    let options = {
      idContainers: idContainers,
      unpackKeys: unpackKeys,
      handlers: {}
    };

    options.handlers = {
      difference:   (a,b,path,storageKey) => { console.log('Will persist', JSON.stringify(b), 'to', storageKey) },
      undefinedInB: (a,b,path,storageKey) => { console.log('Will remove',  JSON.stringify(b), 'to', storageKey) },
    };

    let keyWrites = [];
    let dataWrites = [];

    let keyRemovals = [];

    // to look for changes, we compare the old and new state. Given that everything is immutable, this should be very fast.
    // --> iterate over the oldState
    let oldKeys = Object.keys(oldState);
    for (let i = 0; i < oldKeys.length; i++) {
      let field = oldKeys[i];
      compare(oldState[field], newState[field], field, userId + '.' + field, options);
    }


    // for things that have been added, we should check if the newState has new fields
    // --> iterate over the newState

    options.handlers = {
      difference:   (a,b,path,storageKey) => { /*   do nothing  */ },
      undefinedInB: (a,b,path,storageKey) => { console.log('Will persist', JSON.stringify(a), 'to', storageKey) },
    };

    let newKeys = Object.keys(newState);
    for (let i = 0; i < newKeys.length; i++) {
      let field = newKeys[i];
      compare(newState[field], oldState[field], field, userId + '.' + field, options);
    }

    batchPersist(keyWrites,dataWrites);
    batchRemove(keyRemovals);

    // This will likely be the action itself, unless
    // a middleware further in chain changed it.
    return returnValue
  }
}

function batchPersist(keyWrites, dataWrites) {
  if (keyWrites.length === dataWrites.length && keyWrites.length > 0) {
    AsyncStorage.multiSet(keyWrites, dataWrites)
      .then(() => { console.log('batch persisted', keyWrites)})
      .catch((err) => { console.log('err batch persisting', keyWrites, err); })
  }
}

function batchRemove(keyRemovals) {
  // todo: cascade
  if (keyRemovals.length > 0) {
    AsyncStorage.multiRemove(keyRemovals)
      .then(() => { console.log('batch removed', keyRemovals)})
      .catch((err) => { console.log('err batch removing', keyRemovals, err); })
  }
}

// function persistToStorage(data, storageKey) {
//   // todo: batch
//   AsyncStorage.setItem(storageKey, JSON.stringify(data))
//     .then(() => { console.log('persisted', storageKey)})
//     .catch((err) => { console.log('err persisting', storageKey, err); })
// }
//
// function removeFromStorage(storageKey) {
//   // todo: batch, cascade
//   AsyncStorage.removeItem(storageKey)
//     .then(() => { console.log('removed', storageKey)})
//     .catch((err) => { console.log('err removing', storageKey, err); })
// }


function compareObjects(a, b, path, storageKey, options) {
  let keys = Object.keys(a);
  for (let i = 0; i < keys.length; i++) {
    let field = keys[i];
    let nextPath = path;
    let nextStoragekey = storageKey + '.' + field;
    if (options.idContainers && options.idContainers[path]) {
      nextPath += '.{id}'
    }
    else {
      nextPath += '.' + field;
    }
    compare(a[field] ,b[field], nextPath, nextStoragekey, options);
  }
}

function checkObjects(a, b, path, storagekey, options) {
  if (a === b) {
    //  no need to store --> no changes
  }
  else {
    // CHANGE!

    // check if this field is stored as-is or if we step in.
    if (options.unpackKeys && options.unpackKeys[path]) {
      compareObjects(a, b, path, storagekey, options);
    }
    else {
      options.handlers.difference(a,b,path,storagekey);
    }
  }
}

function compare(a, b, path, storageKey, options) {
  if (b === undefined) {
    options.handlers.undefinedInB(a,b,path,storageKey);
  }
  else if (b === null) {
    console.warn("B is null!", a,b,path,storageKey);
  }
  else if (Array.isArray(a) === true && Array.isArray(b) === true) {
    // todo: compare arrays
  }
  else if (typeof a === 'object' && typeof b === 'object') {
    checkObjects(a, b, path, storageKey, options);
  }
}


