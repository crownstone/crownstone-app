export function update(newValue, original) {
  if (newValue === undefined) {
    return original;
  }
  else if (newValue === null) {
    return null;
  }
  else if (Array.isArray(newValue)) {
    return newValue.concat([]);
  }
  else if (typeof newValue === 'object' && newValue !== null) {
    return {...newValue};
  }
  return newValue;
}

export let getTime = function (remoteTime?) {
  if (remoteTime) {
    return remoteTime;
  }
  return Date.now();
};

export function refreshDefaults(state, defaultObject) {
  // the current entry is an array and has to be an object
  if (Array.isArray(state) && !Array.isArray(defaultObject) && typeof defaultObject === 'object') {
    let newState = [...state];
    let fields = Object.keys(defaultObject);
    for (let i = 0; i < newState.length; i++) {
      for (let j = 0; j < fields.length; j++) {
        if (newState[i][fields[j]] === undefined) {
          newState[i][fields[j]] = defaultObject[fields[j]];
        }
      }
    }
    return newState;
  }
  else if (Array.isArray(state) === false && typeof defaultObject === 'object') {
    let newState = {...state};

    migrateFields(newState, defaultObject);

    let fields = Object.keys(defaultObject);
    fields.forEach((field) => {
      // if this field does not exist...
      if (newState[field] === undefined) {
        if (Array.isArray(defaultObject[field])) {
          newState[field] = [...defaultObject[field]];
        }
        else if (defaultObject[field] === null) { // null is also an object. We need to catch this.
          newState[field] = null;
        }
        else if (typeof defaultObject[field] === 'object') {
          newState[field] = {...defaultObject[field]};
        }
        else {
          newState[field] = defaultObject[field];
        }
      }
      else if (field === 'cloudId' && newState[field] !== null && typeof newState[field] === 'object') {
        newState[field] = null;
      }
    });
    return newState;
  }
  return state;
}

function migrateFields(newState, defaultObject) {

  // rename touchToToggle to tapToToggle
  if (newState.touchToToggle !== undefined) {
    newState.tapToToggle = newState.touchToToggle;
  }
}