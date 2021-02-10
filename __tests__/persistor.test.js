'use strict';
// __tests__/Intro-test.js
// Note: test renderer must be required after react-native.


let jest = require('jest');



jest.mock('../js/ExternalConfig', () => {
  return {
    RELEASE_MODE_USED: false,
    PROMISE_MANAGER_FALLBACK_TIMEOUT: 60000,
    LOG_INFO       : 100,
    LOG_WARNINGS   : 100,
    LOG_ERRORS     : 0,
    LOG_VERBOSE    : 100,
    LOG_SCHEDULER  : 100,
    LOG_BLE        : 100,
    LOG_EVENTS     : 100,
    LOG_STORE      : 100,
    LOG_MESH       : 100,
    LOG_CLOUD      : 100,
    LOG_DEBUG      : 100,
    MESH_ENABLED   : true,
    SCHEDULER_FALLBACK_TICK: 1,
    DISABLE_NATIVE: true,
    TRIGGER_TIME_BETWEEN_SWITCHING_NEAR_AWAY: 1,
  }
});


jest.mock('react-native/Libraries/Alert/Alert', () => {
  return {
    alert: (x,y,z,b) => { console.log("ALERT",x,y); }
  }
})

jest.mock('@react-native-community/async-storage', () => {
  return {
    __getErrKeys: {},
    __delErrKeys: {},
    __db: {},
    __setDb: (db) => { this.__db = db; },
    __setDelErrKeys: (x) => { this.__delErrKeys = x; },
    __setGetErrKeys: (x) => { this.__getErrKeys = x; },
    getItem:     (key)      => {
      // console.log('requestingKey:',key);
      return new Promise((resolve, reject) => {
        if (this.__getErrKeys && this.__getErrKeys[key]) {
          // console.log("REJECTING", key);
          reject(key);
        }
        else {
          resolve( this.__db ? this.__db[key] : null );
        }
      })
    },
    removeItem:  (key) => {
      return new Promise((resolve, reject) => {
        if (this.__delErrKeys && this.__delErrKeys[key]) {
          reject(key);
        }
        else {
          delete this.__db[key]
          resolve();
        }
      })
    },
    getAllKeys: () => {
      return new Promise((resolve, reject) => {
        resolve(Object.keys(this.__db));
      })
    },
    multiGet: (keyArray) => {
      return new Promise((resolve, reject) => {
        let result = [];
        let errs = [];
        keyArray.forEach((key) => {
          if (this.__getErrKeys && this.__getErrKeys[key]) {
            // console.log("multiGet REJECTING", key);
            let err = new Error();
            err.message = "FAILED GETTING KEY";
            err.key = key;
            errs.push(err);
          }
          else {
            result.push([key, this.__db[key]]);
          }
        })
        if (errs.length > 0) {
          reject(errs);
        }
        else {
          resolve(result);
        }
      })
    },
    multiSet: (kvPairs)  => {
      // console.log('multiSet', kvPairs);
      return new Promise((resolve, reject) => {
        resolve();
      })
    },
    multiRemove: (keyArray) => {
      // console.log('multiRemove', keyArray);
      return new Promise((resolve, reject) => {
        keyArray.forEach((key) => {
          delete this.__db[key]
        })
        resolve();
      })
    },
  }
})

import { Persistor } from '../ts/router/store/Persistor';
import { PersistenceEnhancer } from "../ts/router/store/persistenceEnhancer";
import { NativeEnhancer } from "../ts/router/store/nativeEnhancer";
import { applyMiddleware, createStore } from "redux";
import { EventEnhancer } from "../ts/router/store/eventEnhancer";
import CrownstoneReducer from "../ts/router/store/reducer";

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

import AsyncStorage from "@react-native-community/async-storage";


// test('PersistorTest - old hydration and migration', () => {
//   let database = {
//     CrownstoneLoggedInUser:'test',
//     CrownstoneStore_test: JSON.stringify({})
//   }
//
//   AsyncStorage.__setDb(database);
//   AsyncStorage.__setDelErrKeys({});
//   AsyncStorage.__setGetErrKeys({});
//
//   let persistor = new Persistor();
//
//   let store = createStore(
//     enableBatching(CrownstoneReducer), {},
//     applyMiddleware(EventEnhancer, NativeEnhancer, PersistenceEnhancer)
//   );
//   store.batchDispatch = batchActions;
//
//   return persistor.initialize("test", store);
// });
//
// test('PersistorTest - old hydration fail, but recover', () => {
//   let database = {
//     CrownstoneLoggedInUser:'test',
//     CrownstoneStore_test: JSON.stringify({})
//   }
//
//   let getErrKeys = {
//     CrownstoneStore_test: true
//   }
//
//   AsyncStorage.__setDb(database)
//   AsyncStorage.__setDelErrKeys({})
//   AsyncStorage.__setGetErrKeys(getErrKeys)
//
//   let persistor = new Persistor();
//
//   let store = createStore(
//     enableBatching(CrownstoneReducer), {},
//     applyMiddleware(EventEnhancer, NativeEnhancer, PersistenceEnhancer)
//   );
//   store.batchDispatch = batchActions;
//
//   return persistor.initialize("test", store);
// });
//
// test('PersistorTest - old hydration fail, fail recover', () => {
//   let database = {
//     CrownstoneLoggedInUser:'test',
//     CrownstoneStore_test: JSON.stringify({})
//   }
//
//   let getErrKeys = {
//     CrownstoneStore_test: true
//   }
//
//   let delErrKeys = {
//     CrownstoneStore_test: true
//   }
//
//   AsyncStorage.__setDb(database)
//   AsyncStorage.__setDelErrKeys(delErrKeys)
//   AsyncStorage.__setGetErrKeys(getErrKeys)
//
//   let persistor = new Persistor();
//
//   let store = createStore(
//     enableBatching(CrownstoneReducer), {},
//     applyMiddleware(EventEnhancer, NativeEnhancer, PersistenceEnhancer)
//   );
//   store.batchDispatch = batchActions;
//
//   return persistor.initialize("test", store)
//     .then(() => { expect(true).toBe(false); /* this should never happen */ })
//     .catch((err) => { expect(err).toBe('FAILED_REPAIR_DB'); });
// });
//
// test('PersistorTest - new hydration', () => {
//   let db = require("./data/db").db;
//   let database = {
//     ...db
//   }
//
//   AsyncStorage.__setDb(database);
//   AsyncStorage.__setDelErrKeys({});
//   AsyncStorage.__setGetErrKeys({});
//
//   let persistor = new Persistor();
//
//   let store = createStore(
//     enableBatching(CrownstoneReducer), {},
//     applyMiddleware(EventEnhancer, NativeEnhancer, PersistenceEnhancer)
//   );
//   store.batchDispatch = batchActions;
//
//   return persistor.initialize("test", store);
// });
//
// test('PersistorTest - new hydration with illegal topclassKey', () => {
//   let db = require("./data/db").db;
//   let database = {
//     ...db,
//     "test.spheres_@$:8": {}
//   }
//
//   AsyncStorage.__setDb(database);
//   AsyncStorage.__setDelErrKeys({});
//   AsyncStorage.__setGetErrKeys({});
//
//   let persistor = new Persistor();
//
//   let store = createStore(
//     enableBatching(CrownstoneReducer), {},
//     applyMiddleware(EventEnhancer, NativeEnhancer, PersistenceEnhancer)
//   );
//   store.batchDispatch = batchActions;
//
//   return persistor.initialize("test", store);
// });
//
// test('PersistorTest - new hydration with Null value for a stone, check if latest is used.', () => {
//   let db = require("./data/db").db;
//   let database = {
//     ...db,
//     "test.spheres.3818a89-b810-866a-7dbb-a43e990d18bd.stones.1205c8ba-db1-b45d-23e0-b08fb685cdeb.config_@$:6": null,
//   }
//
//   AsyncStorage.__setDb(database);
//   AsyncStorage.__setDelErrKeys({});
//   AsyncStorage.__setGetErrKeys({});
//
//   let persistor = new Persistor();
//
//   let store = createStore(
//     enableBatching(CrownstoneReducer), {},
//     applyMiddleware(EventEnhancer, NativeEnhancer, PersistenceEnhancer)
//   );
//   store.batchDispatch = batchActions;
//
//   return persistor.initialize("test", store)
//     .then(() => {
//       let state = store.getState();
//       expect(state.spheres['3818a89-b810-866a-7dbb-a43e990d18bd'].stones['1205c8ba-db1-b45d-23e0-b08fb685cdeb'].config.applianceId).toBe('latest');
//     });
// });
//
// test('PersistorTest - new hydration with Null value for a stone, check if backup is used.', () => {
//   let db = require("./data/db").db;
//   let database = {
//     ...db,
//     "test.spheres.3818a89-b810-866a-7dbb-a43e990d18bd.stones.1205c8ba-db1-b45d-23e0-b08fb685cdeb.config_@$:7": null,
//   }
//
//   AsyncStorage.__setDb(database);
//   AsyncStorage.__setDelErrKeys({});
//   AsyncStorage.__setGetErrKeys({});
//
//   let persistor = new Persistor();
//
//   let store = createStore(
//     enableBatching(CrownstoneReducer), {},
//     applyMiddleware(EventEnhancer, NativeEnhancer, PersistenceEnhancer)
//   );
//   store.batchDispatch = batchActions;
//
//   return persistor.initialize("test", store)
//     .then(() => {
//       let state = store.getState();
//       expect(state.spheres['3818a89-b810-866a-7dbb-a43e990d18bd'].stones['1205c8ba-db1-b45d-23e0-b08fb685cdeb'].config.applianceId).toBe('backup');
//     });
// });
//
// test('PersistorTest - new hydration with error while getting data.', () => {
//   let db = require("./data/db").db;
//   let database = {
//     ...db,
//   }
//
//   AsyncStorage.__setDb(database);
//   AsyncStorage.__setDelErrKeys({});
//   AsyncStorage.__setGetErrKeys({
//     "test.spheres.3818a89-b810-866a-7dbb-a43e990d18bd.stones.1205c8ba-db1-b45d-23e0-b08fb685cdeb.config_@$:7": true,
//     "test.spheres.3818a89-b810-866a-7dbb-a43e990d18bd.stones.d2687c0-dd56-1e81-eb33-94dda975d6e1.state_@$:6": true
//   });
//
//   let persistor = new Persistor();
//
//   let store = createStore(
//     enableBatching(CrownstoneReducer), {},
//     applyMiddleware(EventEnhancer, NativeEnhancer, PersistenceEnhancer)
//   );
//   store.batchDispatch = batchActions;
//
//   return persistor.initialize("test", store)
//     .then(() => {
//       let state = store.getState();
//       expect(state.spheres['3818a89-b810-866a-7dbb-a43e990d18bd'].stones['1205c8ba-db1-b45d-23e0-b08fb685cdeb'].config.applianceId).toBe('backup');
//     });
// });
//
// test('PersistorTest - cascade removal', () => {
//   let db = require("./data/db").db;
//   let database = {
//     ...db,
//   }
//
//   AsyncStorage.__setDb(database);
//   AsyncStorage.__setDelErrKeys({});
//   AsyncStorage.__setGetErrKeys({});
//
//   let persistor = new Persistor();
//
//   let store = createStore(
//     enableBatching(CrownstoneReducer), {},
//     applyMiddleware(EventEnhancer, NativeEnhancer, PersistenceEnhancer)
//   );
//   store.batchDispatch = batchActions;
//
//   return persistor.initialize("test", store)
//     .then(() => {
//       let oldState = store.getState();
//       store.dispatch({
//         type: "REMOVE_STONE",
//         sphereId: '3818a89-b810-866a-7dbb-a43e990d18bd',
//         stoneId: '1205c8ba-db1-b45d-23e0-b08fb685cdeb'
//       });
//       return persistor.persistChanges(oldState, store.getState())
//     })
//     .then(() => {
//       return AsyncStorage.getAllKeys();
//     })
//     .then((data) => {
//       expect(data["test.spheres.3818a89-b810-866a-7dbb-a43e990d18bd.stones.d2687c0-dd56-1e81-eb33-94dda975d6e1.state_@$:6"]).toBe(undefined);
//     })
//
// });
//
// test('PersistorTest - Add Stone', () => {
//   let db = require("./data/db").db;
//   let database = {
//     ...db,
//   }
//
//   AsyncStorage.__setDb(database);
//   AsyncStorage.__setDelErrKeys({});
//   AsyncStorage.__setGetErrKeys({});
//
//   let persistor = new Persistor();
//
//   let store = createStore(
//     enableBatching(CrownstoneReducer), {},
//     applyMiddleware(EventEnhancer, NativeEnhancer, PersistenceEnhancer)
//   );
//   store.batchDispatch = batchActions;
//
//   return persistor.initialize("test", store)
//     .then(() => {
//       let oldState = store.getState();
//       store.dispatch({
//         type: "ADD_STONE",
//         sphereId: '3818a89-b810-866a-7dbb-a43e990d18bd',
//         stoneId: '1205sdgcdeb'
//       });
//       return persistor.persistChanges(oldState, store.getState())
//     })
//     .then(() => {
//       return AsyncStorage.getAllKeys();
//     })
//     .then(() => {
//       persistor.endSession()
//     })
// });

test('PersistorTest - Add Location', () => {
  let db = require("./data/db").db;
  let database = {
    ...db,
  }

  AsyncStorage.__setDb(database);
  AsyncStorage.__setDelErrKeys({});
  AsyncStorage.__setGetErrKeys({});

  let persistor = new Persistor();

  let store = createStore(
    enableBatching(CrownstoneReducer), {},
    applyMiddleware(EventEnhancer, NativeEnhancer, PersistenceEnhancer)
  );
  store.batchDispatch = batchActions;

  return persistor.initialize("test", store)
    .then(() => {
      let oldState = store.getState();
      store.dispatch({
        type: "ADD_LOCATION",
        sphereId: '3818a89-b810-866a-7dbb-a43e990d18bd',
        locationId: '1205sdgcdeb'
      });
      store.dispatch({
        type: "ADD_LOCATION",
        sphereId: '3818a89-b810-866a-7dbb-a43e990d18bd',
        locationId: 'xvxzs'
      });
      return persistor.persistChanges(oldState, store.getState())
    })
    .then(() => {
      return AsyncStorage.getAllKeys();
    })
    .then(() => {
      persistor.endSession()
    })
});

// test('PersistorTest - Load incomplete db', () => {
//   let db = require("./data/db_withoutLocations").db;
//   let database = {
//     ...db,
//   }
//
//   AsyncStorage.__setDb(database);
//   AsyncStorage.__setDelErrKeys({});
//   AsyncStorage.__setGetErrKeys({});
//
//   let persistor = new Persistor();
//
//   let store = createStore(
//     enableBatching(CrownstoneReducer), {},
//     applyMiddleware(EventEnhancer, NativeEnhancer, PersistenceEnhancer)
//   );
//   store.batchDispatch = batchActions;
//
//   return persistor.initialize("test", store)
// });