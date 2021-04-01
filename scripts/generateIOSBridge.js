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
  return "RCT_EXTERN_METHOD(" + x.trim() + ")"
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
      result += '(nonnull NSNumber *)'
      break;
    case "@escaping RCTResponseSenderBlock":
      result += '(RCTResponseSenderBlock)'
      break;
    case "String":
      result += '(NSString *)'
      break;
    case "NSDictionary":
      result += '(NSDictionary *)'
      break;
    case "[NSNumber]":
      result += '(NSArray *)'
      break;
    case "[NSDictionary]":
      result += '(NSArray *)'
      break;
    default:
      console.log("UNKNOWN TYPE", fn);
  }

  if (nameRequired) {
    result = variableName + ':' + result + variableName
  }
  else {
    result += variableName;
  }

  return result;
}

let space = '\n                     '

functions.forEach((fn) => {
  let functionName = fn.substr(0, fn.indexOf('('))
  if (fn.indexOf("()") !== -1) {
    // handle the case of functionName()
    mapped.push(wrap(fn.substr(0,fn.length-2)));
  }
  else {
    let args = getArg(fn);
    let content = ''
    args.forEach((arg) => {
      content += getType(fn, arg) + (args.length > 4 ? space : ' ');
    });
    mapped.push(wrap(functionName + ":" + content))
  }
})

let targetSource = `
//
//  NativeBridge.m
//  Crownstone
//
//  Created by Alex de Mulder on 16/03/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(BluenetJS, RCTEventEmitter)
`
mapped.forEach((x) => { targetSource += x + "\n" })

targetSource += `

+ (BOOL)requiresMainQueueSetup { return YES; }
@end
`

fs.writeFileSync(TARGET, targetSource)

