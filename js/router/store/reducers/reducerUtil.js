export function update(newValue, original) {
  return (newValue === undefined ? original : newValue);
}

export function getTime() {
  return new Date().valueOf();
}