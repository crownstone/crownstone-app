import { AsyncStorage } from 'react-native'

function hydrate(userId) {
  // get all keys
  let data = {};
  AsyncStorage.getAllKeys()
    .then((keys) => {
      let userKeys = [];
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let keyArray = key.split('.');
        if (keyArray[0] === userId) {
          userKeys.push({key:key, arr: keyArray});
        }
      }

      userKeys.sort((a,b) => { return a.key.length - b.key.length });

      for (let i = 0; i < userKeys.length; i++) {
        let keyArray = userKeys[i].arr

        // index 0 is the userId
        let pointer = data;
        for (let j = 1; j < keyArray; j++) {
          if (keyArray.length > j+1) {
            pointer[keyArray[j]] = {};
            pointer = pointer[keyArray[j]]
          }
        }
      }

      console.log('dataTree:', data);
    })
    .catch((err) => { console.log('failed to get all keys'); })
  // construct tree
  // load tree into store


}