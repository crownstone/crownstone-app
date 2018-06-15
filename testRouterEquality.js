
const fs = require("fs");

let iosRouter     = fs.readFileSync('./js/router/RouterIOS.js', {encoding:'ascii'});
let androidRouter = fs.readFileSync('./js/router/RouterAndroid.js', {encoding:'ascii'});

let iosLines = iosRouter.split("\n");
let androidLines = androidRouter.split("\n");


console.log("Router comparison started.")

let keyGet = /key=\"(.*?)\"/g
let iosKeys = [];
let androidKeys = [];
iosLines.forEach((line) => {
  if (line.indexOf("component={") !== -1) {
    let match = line.match(keyGet);
    if (match) {
      let key = match[0].replace("key=\"","").replace('"',"")
      iosKeys.push(key)
    }
  }
})

androidLines.forEach((line) => {
  if (line.indexOf("component={") !== -1) {
    let match = line.match(keyGet);
    if (match) {
      let key = match[0].replace("key=\"","").replace('"',"")
      androidKeys.push(key);
      if (iosKeys.indexOf(key) === -1) {
        console.log("MISSING KEY IN IOS ROUTER:", key)
      }
    }
  }
})

iosLines.forEach((line) => {
  if (line.indexOf("component={") !== -1) {
    let match = line.match(keyGet);
    if (match) {
      let key = match[0].replace("key=\"","").replace('"',"")
      if (androidKeys.indexOf(key) === -1) {
        console.log("MISSING KEY IN ANDROID ROUTER:", key)
      }
    }
  }
})


console.log("Router comparison completed.")
