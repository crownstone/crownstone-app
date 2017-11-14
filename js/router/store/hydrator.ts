import { AsyncStorage } from 'react-native'

function hydrate(userId) {
  // get all keys
  let data = {};
  let pointerIndex = {};

  function storePointer(pointer, key) {
    pointerIndex[key] = pointer;
  }

  AsyncStorage.getAllKeys()
    .then((keys) => {
      let userKeys = [];
      let keyListForRetreival = [];
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let keyArray = key.split('.');
        if (keyArray[0] === userId) {
          userKeys.push({key:key, arr: keyArray});
        }
      }

      userKeys.sort((a,b) => { return a.key.length - b.key.length });

      for (let i = 0; i < userKeys.length; i++) {
        let key = userKeys[i].key;
        let keyArray = userKeys[i].arr

        // index 0 is the userId
        let pointer = data;
        for (let j = 1; j < keyArray; j++) {
          if (keyArray.length > j+1) {
            if (pointer[keyArray[j]] === undefined) {
              pointer[keyArray[j]] = {};
            }
            pointer = pointer[keyArray[j]]
          }
          else {
            // end of path
            // get the data on this key
            storePointer(pointer, key);
          }
        }

        keyListForRetreival.push(key);
      }
      console.log('dataTree:', data);
      return AsyncStorage.multiGet(keyListForRetreival)
    })
    .then((keyValuePairArray) => {
      for (let i = 0; i < keyValuePairArray.length; i++) {
        let pair = keyValuePairArray[i];
        if (pointerIndex[pair[0]]) {
          pointerIndex[pair[0]] = pair[1];
        }
      }

      console.log("all data", data);
    })
    .catch((err) => { console.log('failed to get all keys'); })
  // construct tree
  // load tree into store


}
