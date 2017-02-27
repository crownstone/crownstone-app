export function update(newValue, original) {
  return (newValue === undefined ? original : newValue);
}

export let getTime = function (remoteTime) {
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