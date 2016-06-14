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

    if (data) {
      data = JSON.parse(data);
      console.log("DATA FROM STORAGE", data );
      if (OVERRIDE_DATABASE === true && data && data.user && data.user.firstName === undefined) {
        console.log("INJECTING FAKE DATA");
        store = createStore(CrownstoneReducer, fakeStore);
      }
      else {
        store = createStore(CrownstoneReducer, data);
      }
    }
    else {
      console.log("DATA FROM STORAGE", data );
      if (OVERRIDE_DATABASE === true) {
        console.log("INJECTING FAKE DATA");
        store = createStore(CrownstoneReducer, fakeStore);
      }
      else {
        store = createStore(CrownstoneReducer);
      }
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
        //console.log("WRITING: ", payload);
        AsyncStorage.setItem(STORAGE_KEY, payload).done();
      }, 500);
    });

    eventBus.emit('storeInitialized');
    return store;

}).done();
