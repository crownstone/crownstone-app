import { AsyncStorage }   from 'react-native'
import { createStore }    from 'redux'
import CrownstoneReducer  from './reducer'
import { eventBus }       from '../../util/eventBus'

let STORAGE_KEY = 'reducerStore';

export let store = {};
export let storeInitialized = false;

let writeTimeout = null;

AsyncStorage.getItem(STORAGE_KEY)
  .then((data) => {
    console.log("DATA FROM STORAGE", data);

    if (data === null) {
      store = createStore(CrownstoneReducer);
    }
    else {
      store = createStore(CrownstoneReducer, JSON.parse(data));
    }

    storeInitialized = true;
    
    store.subscribe(() => {
      if (writeTimeout !== null) {
        clearTimeout(writeTimeout);
        writeTimeout = null;
      }
      writeTimeout = setTimeout(() => {
        writeTimeout = null;
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store.getState())).done();
      },500);
    });

    eventBus.emit('storeInitialized');
    return store;
  }).done();


