
import {HISTORY_CYCLE_SIZE, HISTORY_PREFIX} from "./Persistor";

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

  extractLatestEntries: function(userKeys : userKeyObject[]) : {latestKeys: userKeyObject[], historyReference: numberMap } {
    let latestKeys = [];
    let history = {};
    let historyReference = {};

    // examine all keys for history
    for (let i = 0; i < userKeys.length; i++) {
      let keyArray = userKeys[i].key.split(HISTORY_PREFIX);
      if (keyArray.length === 2) {
        let pureKey = keyArray[0];
        let index = Number(keyArray[1]);
        if (history[pureKey] === undefined) {
          history[pureKey] = {index: index, keyData: userKeys[i], historyIndex: null};
        }
        else if (history[pureKey].index === 9 && index === 0) { // we loop from 0..9. This means 0 is higher than 0.
          history[pureKey].historyIndex = history[pureKey].index;
          history[pureKey].index = index;
          history[pureKey].keyData = userKeys[i];

        }
        else if (history[pureKey].index < index) {
          history[pureKey].historyIndex = history[pureKey].index;
          history[pureKey].index = index;
          history[pureKey].keyData = userKeys[i];
        }
        else if (history[pureKey].index > index) {
          history[pureKey].historyIndex = index;
        }
      }
      else {
        console.warn("CANT HANDLE KEYARRAY", userKeys[i]);
      }
    }

    // get latest versions
    let historyKeys = Object.keys(history);
    for (let i = 0; i < historyKeys.length; i++) {
      let pureKey = historyKeys[i];
      historyReference[pureKey] = history[pureKey].index;
      latestKeys.push(history[pureKey].keyData)
    }

    return { latestKeys, historyReference };
  },

  filterParentEntries: function(userKeys : userKeyObject[]) : { filteredUserKeys : string[], illegalKeys : string[] } {
    // get parent keys out of this list because they will destroy the pointer tree
    let illegalKeys = [];
    let filteredUserKeys = [];
    for (let i = 0; i < userKeys.length; i++) {
      let found = false;
      let checkKey = PersistorUtil.stripHistoryTag(userKeys[i].key);
      for (let j = i + 1; j < userKeys.length; j++) {
        let candidate = userKeys[j].key;

        if (candidate.substr(0, checkKey.length) === checkKey) {
          // check if these keys are on the same level before marking one of them illegal
          if (candidate.match(/(\.)/g).length !== checkKey.match(/(\.)/g).length) {
            found = true;
            break;
          }
        }
      }
      if (!found) {
        filteredUserKeys.push(userKeys[i].key);
      }
      else {
        illegalKeys.push(userKeys[i].key);
      }
    }

    return { filteredUserKeys, illegalKeys };
  },


  /**
   * The pointer tree will not have any history tags.
   * @param userKeys
   * @param baseData
   * @returns {pointerTree: {}}
   */
  constructPointerTree: function (userKeys : string[], baseData : object) {
    let pointerTree = {};

    function storePointer(pointer, assignmentKey, key) {
      // The key contains a history tag so it can be matched to the retrieved value.
      // The assignment key is stripped of it, as is the final field of the pointer branch.
      pointerTree[key] = {assignmentKey: assignmentKey, pointer: pointer};
    }

    for (let i = 0; i < userKeys.length; i++) {
      let strippedKey = PersistorUtil.stripHistoryTag(userKeys[i]);
      let dataPath = strippedKey.split('.');


      // index 0 is the userId so we skip this in the keyArray
      let pointer = baseData;
      for (let j = 1; j < dataPath.length; j++) {
        if (pointer[dataPath[j]] === undefined) {
          pointer[dataPath[j]] = {};
        }

        if (j < dataPath.length - 1) {
          pointer = pointer[dataPath[j]]
        }
        else {
          // end of path
          // get the data on this key
          storePointer(pointer, dataPath[j], strippedKey);
        }
      }
    }

    return pointerTree;
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