
import {HISTORY_CYCLE_SIZE, HISTORY_PREFIX} from "./Persistor";

interface userKeyObject {
  key: string,
  arr: string[]
}

export const PersistorUtil = {

  extractUserKeys: function(allKeys : string[], userId : string) {
    // Extract user keys from the complete key list
    let userKeys = [];

    for (let i = 0; i < allKeys.length; i++) {
      let key = allKeys[i];
      let keyArray = key.split('.');
      if (keyArray[0] === userId) {
        userKeys.push({key:key, arr: keyArray});
      }
    }

    return userKeys
  },

  extractLatestEntries: function(userKeys : userKeyObject[]) {
    let latestKeys = [];
    let history = {};
    let historyReference = {};

    // examine all keys for history
    for (let i = 0; i < userKeys.length; i++) {
      let keyArray = userKeys[i].key.split(HISTORY_PREFIX);
      if (keyArray.length === 2) {
        let key = keyArray[0];
        let index = Number(keyArray[1]);
        if (history[key] === undefined) {
          history[key] = {index: index, keyData: userKeys[i]};
        }
        else if (history[key].index === 9 && index === 0) { // we loop from 0..9. This means 0 is higher than 0.
          history[key].index = index;
          history[key].keyData = userKeys[i];

        }
        else if (history[key] < index) {
          history[key].index = index;
          history[key].keyData = userKeys[i];
        }
      }
      else {
        console.warn("CANT HANDLE KEYARRAY", userKeys[i]);
      }
    }

    // get latest versions
    let historyKeys = Object.keys(history);
    for (let i = 0; i < historyKeys.length; i++) {
      let key = historyKeys[i];
      historyReference[key] = history[key].index;
      latestKeys.push(history[key].keyData)
    }

    return { latestKeys, historyReference };
  },

  filterParentEntries: function(userKeys : userKeyObject[]) {
    // get parent keys out of this list because they will destroy the pointer tree
    let illegalKeys = [];
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
      else {
        illegalKeys.push(userKeys[i]);
      }
    }

    return { filteredUserKeys, illegalKeys };
  },


  /**
   * The pointer tree will not have any history tags.
   * @param userKeys
   * @param baseData
   * @returns {{pointerTree: {}; keyListForRetrieval: Array}}
   */
  constructPointerTree: function (userKeys : userKeyObject[], baseData : object) {
    let pointerTree = {};
    let keyListForRetrieval = [];

    function storePointer(pointer, assignmentKey, key) {
      // The key contains a history tag so it can be matched to the retrieved value.
      // The assignment key is stripped of it, as is the final field of the pointer branch.
      pointerTree[key] = {assignmentKey: assignmentKey, pointer: pointer};
    }

    for (let i = 0; i < userKeys.length; i++) {
      let key = userKeys[i].key;
      let dataPath = userKeys[i].arr;

      let strippedEndOfPath = PersistorUtil.stripHistoryTag(dataPath[ dataPath.length - 1]);

      // index 0 is the userId so we skip this in the keyArray
      let pointer = baseData;
      for (let j = 1; j < dataPath.length; j++) {
        if (pointer[dataPath[j]] === undefined) {
          if (j === dataPath.length - 1) { // at the very end of the path, the history tag is removed.
            pointer[strippedEndOfPath] = {};
          }
          else {
            pointer[dataPath[j]] = {};
          }
        }

        if (j < dataPath.length - 1) {
          pointer = pointer[dataPath[j]]
        }
        else {
          // end of path
          // get the data on this key
          storePointer(pointer, strippedEndOfPath, key);
        }
      }
      keyListForRetrieval.push(key);
    }

    return { pointerTree, keyListForRetrieval }
  },

  insertAllHistoryKeyPossibilities: function(storageKey, array) {
    for (let i = 0; i < HISTORY_CYCLE_SIZE; i++) {
      array.push(storageKey + HISTORY_PREFIX + i);
    }
  },

  stripHistoryTag: function(key : string) {
    return key.split(HISTORY_PREFIX)[0]
  },
};