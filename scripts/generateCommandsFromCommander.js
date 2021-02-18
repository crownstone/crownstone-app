const fs = require("fs");
const path = require("path");

let a = [
  "toggle",
  "multiSwitch",
  "turnOn",
  "getBootloaderVersion",
  "getBootloaderVersion",
  "getBootloaderVersion",
  "getFirmwareVersion",
  "getHardwareVersion",
  "addBehaviour",
  "updateBehaviour",
  "removeBehaviour",
  "getBehaviour",
  "syncBehaviour",
  "commandFactoryReset",
  "sendNoOp",
  "sendMeshNoOp",
  "connect",
  "cancelConnectionRequest",
  "disconnectCommand",
  "getMACAddress",
  "phoneDisconnect",
  "toggleSwitchState",
  "setupCrownstone",
  "recover",
  "putInDFU",
  "setupPutInDFU",
  "performDFU",
  "setupFactoryReset",
  "bootloaderToNormalMode",
  "clearErrors",
  "restartCrownstone",
  "setTime",
  "setTimeViaBroadcast",
  "meshSetTime",
  "getTime",
  "getSwitchState",
  "lockSwitch",
  "allowDimming",
  "setSwitchCraft",
  "setupPulse",
  "broadcastSwitch",
  "broadcastBehaviourSettings",
  "setTapToToggle",
  "setTapToToggleThresholdOffset",
  "getTapToToggleThresholdOffset",
  "setSoftOnSpeed",
  "getSoftOnSpeed",
  "syncBehaviours",
  "getBehaviourMasterHash",
  "getBehaviourMasterHashCRC",
  "switchRelay",
  "switchDimmer",
  "getResetCounter",
  "getSwitchcraftThreshold",
  "setSwitchcraftThreshold",
  "getMaxChipTemp",
  "setMaxChipTemp",
  "getDimmerCurrentThreshold",
  "setDimmerCurrentThreshold",
  "getDimmerTempUpThreshold",
  "setDimmerTempUpThreshold",
  "getDimmerTempDownThreshold",
  "setDimmerTempDownThreshold",
  "getVoltageZero",
  "setVoltageZero",
  "getCurrentZero",
  "setCurrentZero",
  "getPowerZero",
  "setPowerZero",
  "getVoltageMultiplier",
  "setVoltageMultiplier",
  "getCurrentMultiplier",
  "setCurrentMultiplier",
  "setUartState",
  "getBehaviourDebugInformation",
  "turnOnMesh",
  "turnOnBroadcast",
  "setSunTimesViaConnection",
  "registerTrackedDevice",
  "trackedDeviceHeartbeat",
  "broadcastUpdateTrackedDevice",
  "getCrownstoneUptime",
  "getMinSchedulerFreeSpace",
  "getLastResetReason",
  "getGPREGRET",
  "getAdcChannelSwaps",
  "getAdcRestarts",
  "getSwitchHistory",
  "getPowerSamples",
  "setUartKey",
  "transferHubTokenAndCloudId",
  "requestCloudId",
  "factoryResetHub",
  "factoryResetHubOnly"
];

function capitalize(str) {
  return str.substring(0,1).toUpperCase() + str.substr(1);
}

const generatedNote = `// GENERATED FILE (REMOVE IF FILE IS CHANGED)`

for (let name of a) {
  let filename = "Command_" + capitalize(name) + ".ts"
  let pathToCommand = path.join(__dirname, "../app/ts/logic/constellation/commandClasses/" + filename);
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


export class Command_${capitalize(name)} extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "${name}");
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.${name}(this.handle);
  }
  
}

`;

}