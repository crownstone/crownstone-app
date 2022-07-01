const SOURCE = '../ios/BridgeFiles/BluenetIntegration.swift';
const TARGET = '../ios/BridgeObjCFiles/NativeBridge.m'

const fs = require("fs");
let str = fs.readFileSync('../ios/BridgeFiles/BluenetIntegration.swift','utf-8')

let strArray = str.split("\n");
let functions = [];
for (let i = 0; i < strArray.length; i++) {
  let line = strArray[i];
  if (line.indexOf("@objc func") !== -1) {
    line = line.replace("  @objc func ", '');
    let closureIndex = line.indexOf(')');
    line = line.substr(0, closureIndex + 1);
    functions.push(line)
  }
}

let mapped = [];

function wrap(x) {
  return x.trim().replace(', )', ') {}');
}

function getArg(x) {
  let opening = x.indexOf('(')+1;
  let closing = x.indexOf(')');
  let arguments = x.substr(opening, closing-opening);
  let args = arguments.split(",")
  for (let i = 0; i < args.length; i++) {
    args[i] = args[i].trim()
  }
  return args;
}

function getType(fn, x) {
  let split = x.split(":");
  for (let i = 0; i < split.length; i++) {
    split[i] = split[i].trim()
  }
  let type = split[1];
  let nameRequired = split[0][0] !== "_";

  let variableName = split[0].replace("_ ",'');

  let result = '';

  switch (type) {
    case "NSNumber":
      result += 'number'
      break;
    case "@escaping RCTResponseSenderBlock":
      result += 'callback'
      break;
    case "String":
      result += 'string'
      break;
    case "NSDictionary":
      result += 'object'
      break;
    case "[NSNumber]":
      result += 'number[]'
      break;
    case "[NSDictionary]":
      result += 'object[]'
      break;
    default:
      console.log("UNKNOWN TYPE", fn);
  }

  result = variableName + ':' + result + ', ';

  return result;
}

functions.forEach((fn) => {
  let functionName = fn.substr(0, fn.indexOf('('))
  if (fn.indexOf("()") !== -1) {
    // handle the case of functionName()
    mapped.push(wrap(fn) + " {}");
  }
  else {
    let args = getArg(fn);
    let content = ''
    args.forEach((arg) => {
      content += getType(fn, arg);
    });
    mapped.push(wrap(functionName + "(" + content + ")"))
  }
})

let targetSource = ''
mapped.forEach((x) => { targetSource += x + "\n" })

console.log(targetSource)
