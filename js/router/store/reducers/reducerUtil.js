export function update(newValue, original) {
  return (newValue === undefined ? original : newValue);
}

export var getTime = function() {
  return new Date().valueOf();
}