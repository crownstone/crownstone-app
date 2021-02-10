import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { xUtil } from "../../util/StandAloneUtil";
import { Get } from "../../util/GetUtil";
import { BCH_ERROR_CODES } from "../../Enums";
import { LOGd } from "../../logging/Log";




/**
 * This module will house all util methods to handle the handling of duplicate commands in the queue
 */
export const BleCommandCleaner =  {

  removeDuplicatesFromDirectQueue(command: BleCommand, queue: CommandQueueMap) {
    if (command.commandType !== "DIRECT") { return; }

    let handle         = command.commandTarget;
    let directToHandle = queue.direct[handle];

    if (!directToHandle) { return; }

    let cleanedCommandList : BleCommand[] = [];
    for (let existing of directToHandle) {
      if (command.private) {
        if (command.commanderId === existing.commanderId && existing.private) {
          if (BleCommandCleaner.handleCommand(command, existing)) { continue; }
        }

      }
      else if (existing.private) {
        // do not touch whats not yours! Shoo!
      }
      else {
        // check if this is a duplicate
        if (BleCommandCleaner.handleCommand(command, existing)) { continue; }
      }
      
      cleanedCommandList.push(existing);
    }

    queue.direct[handle] = cleanedCommandList;
  },

  /**
   * This checks if the existing command is a duplicate of the new one, if it can be removed and it fails the command which will be removed.
   * @param command
   * @param existingCommand
   */
  handleCommand(command: BleCommand, existingCommand: BleCommand) : boolean {
    if (BleCommandCleaner._isDuplicate(command.command, existingCommand.command) && BleCommandCleaner._canBeRemoved(existingCommand)) {
      BleCommandCleaner._removeCommand(existingCommand);
      return true;
    }
    return false;
  },

  removeDuplicatesFromMeshQueue(command: BleCommand, queue: CommandQueueMap) {
    // if command is direct, remove mesh relays in case the endTarget is the same as the handle
    if (command.commandType === 'DIRECT' || command.commandType === "MESH_RELAY") {
      let handle = command.endTarget || command.commandTarget; // in case this is a mesh_relay, the handle is the endTarget.
      let meshIds = Object.keys(queue.mesh);
      for (let meshId of meshIds) {
        let meshCommands = queue.mesh[meshId];
        if (meshCommands) {
          let cleanedCommandList = [];
          for (let meshCommand of meshCommands) {
            if (meshCommand.endTarget === handle) {
              if (BleCommandCleaner.handleCommand(command, meshCommand)) {
                continue;
              }
              else {
                cleanedCommandList.push(meshCommand);
              }
            }
          }
          queue.mesh[meshId] = cleanedCommandList;
        }
      }
    }
    else {
      let meshId = command.commandTarget;
      let meshCommands = queue.mesh[meshId];
      if (meshCommands) {
        let cleanedCommandList = [];
        for (let meshCommand of meshCommands) {
          if (BleCommandCleaner.handleCommand(command, meshCommand)) {
            continue;
          }
          else {
            cleanedCommandList.push(meshCommand);
          }
        }
        queue.mesh[meshId] = cleanedCommandList;
      }
    }
  },


  _removeCommand(command: BleCommand) {
    command.promise.reject({code: BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE, message:"Removed because of duplicate"});
  },

  _canBeRemoved(existingCommand: BleCommand) : boolean {
    if (existingCommand.attemptingBy.length > 0) {
      return false;
    }
    return true;
  },

  _isDuplicate(newCommand: commandInterface, existingCommand: commandInterface) : boolean {
    let newType = newCommand.type;
    let existingType = existingCommand.type;
    let conflictingCommand = existingType === newType ||
      existingType === 'multiSwitch' && newType === 'turnOn' ||
      existingType === 'turnOn'      && newType === 'multiSwitch';
    let duplicate = false;
    if (conflictingCommand) {
      switch(existingType) {
        case 'multiSwitch':
        case 'turnOn':
        case 'getBootloaderVersion':
        case 'getFirmwareVersion':
        case 'getHardwareVersion':
        case 'commandFactoryReset':
        case 'sendNoOp':
        case 'sendMeshNoOp':
        case 'meshSetTime':
        case 'setTime':
        case 'setSunTimes':
        case 'clearErrors':
        case 'lockSwitch':
        case 'setSwitchCraft':
        case 'allowDimming':
        case 'setTapToToggle':
        case 'setTapToToggleThresholdOffset':
        case 'setMeshChannel':
        case 'setupPulse':
          duplicate = true;
          break
        case 'addBehaviour':
        case 'updateBehaviour':
        case 'removeBehaviour':
        case 'syncBehaviour':
        case 'getBehaviour':
          duplicate = xUtil.deepCompare(existingCommand, newCommand);
          break;
        case 'registerTrackedDevice':
          // double check to satisfy type checking by typescript
          if (newCommand.type === "registerTrackedDevice" && existingCommand.type === "registerTrackedDevice") {
            duplicate = newCommand.trackingNumber === existingCommand.trackingNumber;
          }
          break;
        default:
          duplicate = true;
      }
    }
    return duplicate;
  },


}

