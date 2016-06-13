import { AsyncStorage }   from 'react-native'
import { createStore }    from 'redux'
import CrownstoneReducer  from './reducer'
import { fakeStore }      from './overrideStore'
import { eventBus }       from '../../util/eventBus'
import { OVERRIDE_DATABASE } from '../../ExternalConfig'

let STORAGE_KEY = 'reducerStore';

export let store = {};
export let storeInitialized = false;

let writeTimeout = null;

AsyncStorage.getItem(STORAGE_KEY)
  .then((data) => {

    console.log("DATA FROM STORAGE", data, data );

    if (data === null || data) {
      console.log("FORCIBLY OVERRIDING THE DATA")
      // this only works with a clean install of the app or a logout event
      if (OVERRIDE_DATABASE === true) {
        store = createStore(CrownstoneReducer, fakeStore);
      }
      else {
        store = createStore(CrownstoneReducer);
      }

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
        let payload = JSON.stringify(store.getState());
        console.log("WRITING: ", payload);
        AsyncStorage.setItem(STORAGE_KEY, payload).done();
      }, 500);
    });

    eventBus.emit('storeInitialized');
    return store;

}).done();
