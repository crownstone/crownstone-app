import { eventBus }              from '../../util/EventBus'
import { Util }                  from '../../util/Util'
import {LOG, LOGd} from '../../logging/Log'
import {DISABLE_NATIVE, MESH_ENABLED, STONE_TIME_REFRESH_INTERVAL}          from '../../ExternalConfig'


/**
 * This can be used to batch commands over the mesh or 1:1 to the Crownstones.
 */
export class CommandManager {
  commands  : batchCommands = {};

  load(stone, stoneId: string, sphereId: string, command: commandInterface, priority: boolean, attempts: number, options: batchCommandEntryOptions) {
    if (stone.config.locked === true && command.commandName === "multiSwitch") {
      return new Promise((resolve, reject) => { reject("Stone is Locked"); });
    }
    else {
      return new Promise((resolve, reject) => {
        // remove duplicates from list.
        this._clearDuplicates(stoneId, sphereId, command);
        let uuid = Util.getUUID();
        this.commands[uuid] = {
          priority: priority,
          handle:   stone.config.handle,
          sphereId: sphereId,
          stoneId:  stoneId,
          stone:    stone,
          command:  command,
          attempts: attempts,
          options:  options,
          initialized: false,
          cleanup:  () => { this.commands[uuid] = undefined; delete this.commands[uuid]; },
          promise:  { resolve: resolve, reject: reject, pending: false}
        };
        eventBus.emit("BatchCommandHandlerLoadAction");
      });
    }
  }

  /**
   * Remove duplicate entries from the commands
   * @param stoneId
   * @param sphereId
   * @param command
   * @private
   */
  _clearDuplicates(stoneId, sphereId, command : commandInterface) {
    let uuids = Object.keys(this.commands);

    let clean = (todo) => {
      LOGd.info("BatchCommandHandler: removing duplicate entry for ", stoneId, command.commandName);
      todo.promise.reject("Removed because of duplicate");
      todo.cleanup();
    };

    for (let i = 0; i < uuids.length; i++) {
      let todo = this.commands[uuids[i]];
      if (todo.sphereId === sphereId && todo.stoneId === stoneId && todo.command.commandName === command.commandName) {
        if (command.commandName === 'setSchedule' || command.commandName === 'addSchedule') {
          if (JSON.stringify(command.scheduleConfig) === JSON.stringify(todo.command['scheduleConfig'])) {
            clean(todo);
          }
          break;
        }


        if (todo.promise.pending === false) {
          clean(todo);
        }
        else {
          LOGd.info("BatchCommandHandler: Detected pending duplicate entry for ", stoneId, command.commandName);
        }
      }
    }
  }

  /**
   *
   * If a target network id is provided, the filter will only allow stones which match that id unless the stoneId specifically matches the targetStoneId
   * If only a targetStoneId is provided, the filter will allow only matching stoneIds
   *
   * @param targetStoneId     // database id of stone. If provided, we only put todos for this stone in the list.
   * @param targetNetworkId   // Mesh network id of the Crownstone. If provided, we only put todos for this mesh network in the list.
   * @param markAsInitialized   // When true, the commands that are returned will be marked as initialized by the extraction process.
   * @returns {{directCommands: {}, meshNetworks: sphereMeshNetworks}}
   * @private
   */
  extractTodo(targetStoneId : string = null, targetNetworkId : string = null, markAsInitialized = false) {
    // This will determine if there are high priority commands to filter for, and if so return only those. If not, returns all.
    let commandsToHandle = this._getCommandsToHandle();

    let directCommands : directCommands = {};
    let meshNetworks : sphereMeshNetworks = {};

    let uuids = Object.keys(commandsToHandle);
    for (let i = 0; i < uuids.length; i++) {
      let todo = commandsToHandle[uuids[i]];

      // If we mark this command as initialized it will be handled by the attemptHandler.
      // This is required to avoid the cases where commands that are loaded while there is a pending process
      // If that pending process fails, anything that was loaded during that time would be cancelled as well.
      if (markAsInitialized === true) {
        todo.initialized = true;
      }

      let command = todo.command;
      let stoneConfig = todo.stone.config;

      // apply filter if required.
      if (targetNetworkId !== null) {
        if (targetNetworkId !== stoneConfig.meshNetworkId && targetStoneId !== todo.stoneId) {
          continue;
        }
      }
      else if (targetStoneId !== null) {
        if (targetStoneId !== todo.stoneId) {
          continue;
        }
      }

      // create the data fields for each sphere if they have not been created yet.
      if (directCommands[todo.sphereId] === undefined) { directCommands[todo.sphereId] = []; }
      if (meshNetworks[todo.sphereId]   === undefined) { meshNetworks[todo.sphereId]   = {}; }

      // mesh not supported, no mesh detected for this stone
      if (
        !MESH_ENABLED ||
        stoneConfig.meshNetworkId === null ||
        stoneConfig.meshNetworkId === undefined
      ) {
        // handle this 1:1
        directCommands[todo.sphereId].push(todo);
      }
      else {
        // this is a function to ensure that we do not create a field in the meshNetwork
        let verifyMeshPayloadPrefix = () => {
          if (meshNetworks[todo.sphereId][stoneConfig.meshNetworkId] === undefined) {
            meshNetworks[todo.sphereId][stoneConfig.meshNetworkId] = {
              keepAlive:      [],
              keepAliveState: [],
              multiSwitch:    [],
              other:          []
            };
          }
        };

        let payload = _getPayloadFromCommand(todo);

        if (command.commandName === 'keepAlive') {
          verifyMeshPayloadPrefix();
          meshNetworks[todo.sphereId][stoneConfig.meshNetworkId].keepAlive.push(payload);
        }
        else if (command.commandName === 'keepAliveState') {
          verifyMeshPayloadPrefix();
          meshNetworks[todo.sphereId][stoneConfig.meshNetworkId].keepAliveState.push(payload);
        }
        else if (command.commandName === 'multiSwitch') {
          verifyMeshPayloadPrefix();
          meshNetworks[todo.sphereId][stoneConfig.meshNetworkId].multiSwitch.push(payload);
        }
        else {
          // handle the command via the mesh or 1:1
          // meshNetworks[stoneConfig.meshNetworkId].other.push({ ...todo });

          // currently we forward all other commands to direct calls, todo: over mesh.
          directCommands[todo.sphereId].push(todo);
        }
      }
    }

    return { directCommands, meshNetworks };
  }


  _getCommandsToHandle() : batchCommands {
    // this is the list we will iterate over and process.
    let todoList = this.commands;

    // first we check if there is a high priority element in the list.
    let uuids = Object.keys(todoList);
    let highPriorityCommands : batchCommands = {};
    let highPriorityCrownstones = {};
    let highPriorityMeshNetworks = {};
    let highPriorityActive = false;

    // loop over all commands to look for a high priority one. If there is, also store the stoneId and meshNetworkId if available.
    // if a crownstone has a high priority command, also do the accompanying low priority ones if it has any.
    for (let i = 0; i < uuids.length; i++) {
      let currentTodo = this.commands[uuids[i]];
      if (currentTodo.priority === true) {
        highPriorityActive = true;
        highPriorityCrownstones[currentTodo.stoneId] = true;

        let meshNetworkId = currentTodo.stone.config.meshNetworkId;
        if (meshNetworkId) {
          highPriorityMeshNetworks[meshNetworkId] = true;
        }
      }
    }

    // Now that we know there is a high priority command, we fill it based on priority or whether or not it belongs to the same stone or mesh.
    if (highPriorityActive) {
      for (let i = 0; i < uuids.length; i++) {
        let currentTodo = this.commands[uuids[i]];
        let meshNetworkId = currentTodo.stone.config.meshNetworkId;
        if (currentTodo.priority === true || highPriorityCrownstones[currentTodo.stoneId] || (meshNetworkId !== null && highPriorityMeshNetworks[meshNetworkId])) {
          highPriorityCommands[uuids[i]] = this.commands[uuids[i]];
        }
      }

      // if there are high priority tasks, we switch the todoList from the full set to the high priority subset.
      todoList = highPriorityCommands;
    }

    return todoList;
  }


  highPriorityCommandAvailable() : boolean {
    // first we check if there is a high priority element in the list.
    let uuids = Object.keys(this.commands);

    // loop over all commands to look for a high priority one.
    for (let i = 0; i < uuids.length; i++) {
      if (this.commands[uuids[i]].priority === true) {
        return true;
      }
    }
    return false;
  }

  commandsAvailable() : boolean {
    return Object.keys(this.commands).length > 0
  }

  forceCleanAllCommands() {
    let uuids = Object.keys(this.commands);
    for (let i = 0; i < uuids.length; i++) {
      this.commands[uuids[i]].promise.resolve();
      this.commands[uuids[i]].cleanup();
    }
  }
}



/**
 * Extract the payload from the commands for the 4 supported states.
 * @param batchCommand
 * @returns {any}
 * @private
 */
const _getPayloadFromCommand = (batchCommand : batchCommandEntry) => {
  let payload;
  let command = batchCommand.command;
  let stoneConfig = batchCommand.stone.config;

  if (command.commandName === 'keepAlive') {
    payload = {
      attempts: batchCommand.attempts,
      initialized: batchCommand.initialized,
      options: batchCommand.options,
      cleanup: batchCommand.cleanup,
      promise: batchCommand.promise
    };
  }
  else if (command.commandName === 'keepAliveState') {
    payload = {
      attempts: batchCommand.attempts,
      initialized: batchCommand.initialized,
      options: batchCommand.options,
      handle: stoneConfig.handle,
      crownstoneId: stoneConfig.crownstoneId,
      changeState: command.changeState,
      state: command.state,
      timeout: command.timeout,
      cleanup: batchCommand.cleanup,
      promise: batchCommand.promise
    };
  }
  else if (command.commandName === 'setSwitchState') {
    payload = {
      attempts: batchCommand.attempts,
      initialized: batchCommand.initialized,
      crownstoneId: stoneConfig.crownstoneId,
      options: batchCommand.options,
      handle: stoneConfig.handle,
      state: command.state,
      cleanup: batchCommand.cleanup,
      promise: batchCommand.promise
    };
  }
  else if (command.commandName === 'multiSwitch') {
    payload = {
      stoneId: batchCommand.stoneId,
      attempts: batchCommand.attempts,
      initialized: batchCommand.initialized,
      crownstoneId: stoneConfig.crownstoneId,
      options: batchCommand.options,
      handle: stoneConfig.handle,
      state: command.state,
      intent: command.intent,
      timeout: command.timeout,
      cleanup: batchCommand.cleanup,
      promise: batchCommand.promise
    };
  }

  return payload;
}