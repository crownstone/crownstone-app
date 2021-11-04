import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { xUtil } from "../../util/StandAloneUtil";
import { Get } from "../../util/GetUtil";
import { BCH_ERROR_CODES } from "../../Enums";
import { LOGd, LOGi } from "../../logging/Log";
import mesh from "../../database/reducers/stoneSubReducers/mesh";




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
        // do not touch what is not yours! Shoo!
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
    if (BleCommandCleaner._isDuplicate(command, existingCommand) && BleCommandCleaner._canBeRemoved(existingCommand)) {
      LOGi.constellation("BleCommandCleaner: Removed command due to duplicate",
        existingCommand.id,
        command.id,
        command.command.type,
        command.commandType,
        existingCommand.commanderId
      );
      BleCommandCleaner._removeCommand(existingCommand);
      return true;
    }
    return false;
  },

  removeDuplicatesFromMeshQueue(command: BleCommand, queue: CommandQueueMap) {
    // if command is direct, remove mesh relays in case the endTarget is the same as the handle
    if (command.commandType === 'DIRECT') {
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
            }
            cleanedCommandList.push(meshCommand);
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
          // if the new command is a meshRelay command, the endTarget is populated. If that is the case, only check for duplicates if that matches the
          // exising mesh command.

          // if the new command does not have an endtarget, the command is just a mesh command, like setTime or registerTrackedDevice
          // in that case, we also only want to compare those who have no endTarget defines
          if (command.endTarget === meshCommand.endTarget) {
            if (BleCommandCleaner.handleCommand(command, meshCommand)) {
              continue;
            }
          }
          cleanedCommandList.push(meshCommand);
        }
        queue.mesh[meshId] = cleanedCommandList;
      }
    }
  },


  _removeCommand(command: BleCommand) {
    command.promise.reject(new Error(BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE));
  },

  _canBeRemoved(existingCommand: BleCommand) : boolean {
    if (existingCommand.attemptingBy.length > 0) {
      return false;
    }
    return true;
  },

  _isDuplicate(newCommand: BleCommand, existingCommand: BleCommand) : boolean {
    return newCommand.command.isDuplicate(existingCommand.command)
  },


}

