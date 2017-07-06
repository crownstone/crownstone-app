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
  return new Date().valueOf();
};

export function refreshDefaults(state, defaultObject) {
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
    let fields = Object.keys(defaultObject);
    fields.forEach((field) => {
      if (newState[field] === undefined) {
        newState[field] = defaultObject[field];
      }
    });
    return newState;
  }
  return state;
}