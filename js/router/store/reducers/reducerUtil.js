export function update(newValue, original) {
  return (newValue === undefined ? original : newValue);
}

export var getTime = function(remoteTime) {
  if (remoteTime) {
    return remoteTime;
  }
  return new Date().valueOf();
};