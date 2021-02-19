const fs = require("fs");
const path = require("path");

let methods = [
  {name:"toggle",                        type:'void'},
  {name:"multiSwitch",                   type:'void'},
  {name:"turnOn",                        type:'void'},
  {name:"getBootloaderVersion",          type:'string'},
  {name:"getFirmwareVersion",            type:'string'},
  {name:"getHardwareVersion",            type:'string'},
  {name:"addBehaviour",                  type:'void'},
  {name:"updateBehaviour",               type:'void'},
  {name:"removeBehaviour",               type:'void'},
  {name:"getBehaviour",                  type:'void'},
  {name:"commandFactoryReset",           type:'void'},
  {name:"sendNoOp",                      type:'void'},
  {name:"sendMeshNoOp",                  type:'void'},
  {name:"connect",                       type:'void'},
  {name:"cancelConnectionRequest",       type:'void'},
  {name:"disconnectCommand",             type:'void'},
  {name:"getMACAddress",                 type:'string'},
  {name:"phoneDisconnect",               type:'void'},
  {name:"setupCrownstone",               type:'void'},
  {name:"recover",                       type:'void'},
  {name:"putInDFU",                      type:'void'},
  {name:"setupPutInDFU",                 type:'void'},
  {name:"performDFU",                    type:'void'},
  {name:"setupFactoryReset",             type:'void'},
  {name:"bootloaderToNormalMode",        type:'void'},
  {name:"clearErrors",                   type:'void'},
  {name:"restartCrownstone",             type:'void'},
  {name:"setTime",                       type:'void'},
  {name:"getTime",                       type:'void'},
  {name:"getSwitchState",                type:'number'},
  {name:"lockSwitch",                    type:'void'},
  {name:"allowDimming",                  type:'void'},
  {name:"setSwitchCraft",                type:'void'},
  {name:"setupPulse",                    type:'void'},
  {name:"setTapToToggle",                type:'void'},
  {name:"setTapToToggleThresholdOffset", type:'void'},
  {name:"getTapToToggleThresholdOffset", type:'number'},
  {name:"setSoftOnSpeed",                type:'void'},
  {name:"getSoftOnSpeed",                type:'number'},
  {name:"syncBehaviours",                type:'void'},
  {name:"switchRelay",                   type:'void'},
  {name:"switchDimmer",                  type:'void'},
  {name:"getResetCounter",               type:'number'},
  {name:"getSwitchcraftThreshold",       type:'number'},
  {name:"setSwitchcraftThreshold",       type:'void'},
  {name:"getMaxChipTemp",                type:'number'},
  {name:"setMaxChipTemp",                type:'void'},
  {name:"getDimmerCurrentThreshold",     type:'number'},
  {name:"setDimmerCurrentThreshold",     type:'void'},
  {name:"getDimmerTempUpThreshold",      type:'number'},
  {name:"setDimmerTempUpThreshold",      type:'void'},
  {name:"getDimmerTempDownThreshold",    type:'number'},
  {name:"setDimmerTempDownThreshold",    type:'void'},
  {name:"getVoltageZero",                type:'number'},
  {name:"setVoltageZero",                type:'void'},
  {name:"getCurrentZero",                type:'number'},
  {name:"setCurrentZero",                type:'void'},
  {name:"getPowerZero",                  type:'number'},
  {name:"setPowerZero",                  type:'void'},
  {name:"getVoltageMultiplier",          type:'number'},
  {name:"setVoltageMultiplier",          type:'void'},
  {name:"getCurrentMultiplier",          type:'number'},
  {name:"setCurrentMultiplier",          type:'void'},
  {name:"setUartState",                  type:'void'},
  {name:"getBehaviourDebugInformation",  type:'behaviourDebug'},
  {name:"setSunTimesViaConnection",      type:'void'},
  {name:"registerTrackedDevice",         type:'void'},
  {name:"trackedDeviceHeartbeat",        type:'void'},
  {name:"getCrownstoneUptime",           type:'number'},
  {name:"getMinSchedulerFreeSpace",      type:'number'},
  {name:"getLastResetReason",            type:'ResetReason'},
  {name:"getGPREGRET",                   type:'GPREGRET[]'},
  {name:"getAdcChannelSwaps",            type:'AdcSwapCount'},
  {name:"getAdcRestarts",                type:'AdcRestart'},
  {name:"getSwitchHistory",              type:'SwitchHistory[]'},
  {name:"getPowerSamples",               type:'PowerSamples[]'},
  {name:"setUartKey",                    type:'void'},
  {name:"transferHubTokenAndCloudId",    type:'HubDataReply'},
  {name:"requestCloudId",                type:'HubDataReply'},
  {name:"factoryResetHub",               type:'HubDataReply'},
  {name:"factoryResetHubOnly",           type:'HubDataReply'},
];

methods.sort((a,b) => { return a.name > b.name ? 1 : -1});

function capitalize(str) {
  return str.substring(0,1).toUpperCase() + str.substr(1);
}

const generatedNote = `// GENERATED FILE (REMOVE IF FILE IS CHANGED)`

let importPaths = [];

for (let item of methods) {
  let className = "Command_" + capitalize(item.name)
  let filename = className + ".ts"
  let pathToCommand = path.join(__dirname, "../app/ts/logic/constellation/commandClasses/" + filename);
  importPaths.push(`export * from "./${className}"`);
  if (fs.existsSync(pathToCommand)) {
    let content = fs.readFileSync(pathToCommand, 'utf-8')
    let lines = content.split("\n");
    if (lines[0] !== generatedNote) {
      console.log("SKIP", filename);
      continue;
    }
  }

  console.log("Creating/updating file", filename);
  let customClass = `${generatedNote}

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class ${className} extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("${item.name}");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<${item.type}> {
    return BluenetPromiseWrapper.${item.name}(connectedHandle);
  }
  
}

`;

  fs.writeFileSync(pathToCommand, customClass);
}

function padd(input) {
  let length = 35;
  let str = "\""+input+"\"";
  if (str.length < length) {
    for (let i = str.length; i < length; i++) {
      str += " ";
    }
  }
  str += "|\n"
  return str
}
let prefixStr = '';
for (let i = 0; i < 25; i++) {
  prefixStr += ' '
}

let typeContent = 'type BridgeCommandType = ' + padd(methods[0].name);
for (let i = 1; i < methods.length; i++) {
  let name = methods[i].name;
  typeContent += prefixStr+padd(name)
}

fs.writeFileSync(path.join(__dirname, "../app/ts/logic/constellation/commandClasses/index.ts"), importPaths.join("\n"));
fs.writeFileSync(path.join(__dirname, "../app/ts/logic/constellation/commandClasses/base/commands.d.ts"), typeContent);
