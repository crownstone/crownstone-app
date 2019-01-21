
//util
let padd = function (x, size) {
  if (x === "__filename:") {
    return x;
  }
  while (x.length < size) {
    x += " ";
  }
  return x
}


module.exports = {padd}