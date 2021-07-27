
import {HISTORY_CYCLE_SIZE, HISTORY_PREFIX} from "./Persistor";

export const PersistorUtil = {

  extractUserKeys: function(allKeys : string[], userId : string) : string[] {
    // Extract user keys from the complete key list
    let userKeys = [];

    for (let i = 0; i < allKeys.length; i++) {
      let key = allKeys[i];
      let keyArray = key.split('.');
      if (keyArray[0] === userId) {
        userKeys.push(key);
      }
    }

    return userKeys
  },

  extractUserKeyData: function(allKeys : string[], userId : string) : userKeyObject[] {
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
    // the goal here is to have the history object filled with the latest entries.
    // the second goal is to have the history index be the oldest index of the data key
    for (let i = 0; i < userKeys.length; i++) {
      let keyArray = userKeys[i].key.split(HISTORY_PREFIX);
      if (keyArray.length === 2) {
        let pureKey = keyArray[0];
        let index = Number(keyArray[1]);

        if (history[pureKey] === undefined) {
          history[pureKey] = { newestIndex: index, newestFullKey: userKeys[i], oldestIndex: null };
        }
        else {
          // We have an existing entry for this key..
          // We want to try to get the latest version of this data. The index is from 0 to (HISTORY_CYCLE_SIZE - 1).
          // For now, we only store 1 historical item (HISTORY_SIZE). If we want to change this, we will need to keep track of the current index and calculate a distance.
          if (isNewer(index, history[pureKey].newestIndex)) {
            // we have a new "newest" key. Check if we should shift the previous to the oldest slot.
            if (history[pureKey].oldestIndex === null || !isNewer(history[pureKey].newestIndex, history[pureKey].oldestIndex)) {
              history[pureKey].oldestIndex = history[pureKey].newestIndex;
            }
            history[pureKey].newestIndex = index;
            history[pureKey].newestFullKey = userKeys[i];
          }
          else {
            if (history[pureKey].oldestIndex === null) {
              history[pureKey].oldestIndex = index;
            }
            else {
              if (!isNewer(index, history[pureKey].oldestIndex)) {
                history[pureKey].oldestIndex = index;
              }
            }
          }
        }
      }
      else {
        console.warn("PersistorUtil: Can't handle this key array. Invalid array:", userKeys[i]);
      }
    }

    // get latest versions
    let historyKeys = Object.keys(history);
    for (let i = 0; i < historyKeys.length; i++) {
      let pureKey = historyKeys[i];
      historyReference[pureKey] = history[pureKey].oldestIndex;
      latestKeys.push(history[pureKey].newestFullKey)
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

function isNewer(candidate, reference) {
  let midPoint = 0.5*HISTORY_CYCLE_SIZE;
  let dx = candidate - reference;
  if (dx > 0) {
    if (dx > midPoint) {
      return false
    }
    else {
      return true
    }
  }
  else {
    if (dx > -midPoint) {
      return false
    }
    else {
      return true
    }
  }
}