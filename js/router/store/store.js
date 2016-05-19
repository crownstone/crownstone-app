import { AsyncStorage }   from 'react-native'
import { createStore }    from 'redux'
import CrownstoneReducer  from './reducer'
import { eventBus }       from '../../util/eventBus'

let STORAGE_KEY = '@reducerStore';
export let store = {};
AsyncStorage.getItem(STORAGE_KEY)
  .then((data) => {
    console.log("DATA FROM STORAGE", data);
    if (data === null) {
      store = createStore(CrownstoneReducer);
    }
    else {
      store = createStore(CrownstoneReducer, JSON.parse(data));
    }

    store.subscribe(() => {
      console.log("STORING DATA:", JSON.stringify(store.getState()));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store.getState()));
    });


    eventBus.emit('storeInitialized');
    return store;
  }).done();


