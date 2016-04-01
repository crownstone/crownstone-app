export function update(newValue, original) {
  return (newValue === undefined ? original : newValue);
}