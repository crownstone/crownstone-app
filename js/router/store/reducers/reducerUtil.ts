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
  let newState = {...state};
  let fields = Object.keys(defaultObject);
  fields.forEach((field) => {
    if (newState[field] === undefined) {
      newState[field] = defaultObject[field];
    }
  });
  return newState;
}