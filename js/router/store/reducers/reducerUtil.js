export function update(newValue, original) {
  return (newValue === undefined ? original : newValue);
}

export let getTime = function (remoteTime) {
  if (remoteTime) {
    return remoteTime;
  }
  return new Date().valueOf();
};