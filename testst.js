
let a = [{a:2}, {b:2}]

let b = [];
for (let measurement of a) {
  b.push({...measurement})
}

b[0].a = 4

console.log(a,b)