import { eventBus }              from '../../util/EventBus'
import { Util }                  from '../../util/Util'
import {LOG, LOGd, LOGe}         from '../../logging/Log'
import {DISABLE_NATIVE, STONE_TIME_REFRESH_INTERVAL} from '../../ExternalConfig'
import {MapProvider} from "../../backgroundProcesses/MapProvider";
import {MeshUtil} from "../../util/MeshUtil";


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


  isMeshEnabledCommand(command : commandInterface) {
    switch (command.commandName) {
      case 'keepAlive':
      case 'keepAliveState':
      case 'multiSwitch':
        return true;
      default:
        return false;
    }
  }


  _extractDirectCommand(todo, targetStoneId, markAsInitialized, directCommands : directCommands) {
    // apply filter if required.
    if (targetStoneId !== null && targetStoneId !== todo.stoneId) {
      return;
    }

    // create the data fields for each sphere if they have not been created yet.
    if (directCommands[todo.sphereId] === undefined) { directCommands[todo.sphereId] = []; }

    directCommands[todo.sphereId].push(todo);
    this._processCommand(todo, markAsInitialized);
  }

  _extractMeshCommand(state, todo : batchCommandEntry, targetNetworkId, targetStoneId, markAsInitialized, directCommands: directCommands, meshNetworks : sphereMeshNetworks) {
    let command = todo.command;
    let sphere = state.spheres[todo.sphereId]; if (!sphere) { return; }
    let stone  = sphere.stones[todo.stoneId];  if (!stone)  { return; }
    let stoneConfig = stone.config;

    // apply filter if required.
    if (targetNetworkId !== null) {
      // if we are not in the required mesh network AND this is not the target stone, cancel
      if (targetNetworkId !== stoneConfig.meshNetworkId && targetStoneId !== todo.stoneId) {
        return;
      }
    }
    else if (targetStoneId !== null && targetStoneId !== todo.stoneId) {
      // this is not the target stone. Ignore.
      return;
    }

    // create the data fields for each sphere if they have not been created yet.
    if (directCommands[todo.sphereId] === undefined) { directCommands[todo.sphereId] = []; }
    if (meshNetworks[todo.sphereId]   === undefined) { meshNetworks[todo.sphereId]   = {}; }

    if (stoneConfig.meshNetworkId === null || stoneConfig.meshNetworkId === undefined) {
      // handle this 1:1
      directCommands[todo.sphereId].push(todo);
      this._processCommand(todo, markAsInitialized);
    }
    else {
      // this is a function to ensure that we do not create a field in the meshNetwork
      if (meshNetworks[todo.sphereId][stoneConfig.meshNetworkId] === undefined) {
        meshNetworks[todo.sphereId][stoneConfig.meshNetworkId] = {
          keepAlive:      [],
          keepAliveState: [],
          multiSwitch:    []
        };
      }

      let payload = _getPayloadFromCommand(todo, stoneConfig);
      switch (command.commandName) {
        case 'keepAlive':
          meshNetworks[todo.sphereId][stoneConfig.meshNetworkId].keepAlive.push(payload);
          break;
        case 'keepAliveState':
          meshNetworks[todo.sphereId][stoneConfig.meshNetworkId].keepAliveState.push(payload);
          break;
        case 'multiSwitch':
          meshNetworks[todo.sphereId][stoneConfig.meshNetworkId].multiSwitch.push(payload);
          break;
        default:
          LOGe.info("CommandManager: Invalid command received. This should not happen!");
      }

      this._processCommand(todo, markAsInitialized);
    }
  }

  _processCommand(todo, markAsInitialized) {
    // If we mark this command as initialized it will be handled by the attemptHandler.
    // This is required to avoid the cases where commands that are loaded while there is a pending process
    // If that pending process fails, anything that was loaded during that time would be cancelled as well.
    if (markAsInitialized === true) {
      todo.initialized = true;
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
  extractTodo(state, targetStoneId : string = null, targetNetworkId : string = null, markAsInitialized = false) {
    // This will determine if there are high priority commands to filter for, and if so return only those. If not, returns all.
    let commandsToHandle = this._getCommandsToHandle(state);

    let directCommands : directCommands = {};
    let meshNetworks : sphereMeshNetworks = {};

    let uuids = Object.keys(commandsToHandle);
    for (let i = 0; i < uuids.length; i++) {
      let todo = commandsToHandle[uuids[i]];

      let command = todo.command;

      if (this.isMeshEnabledCommand(command) === true && MapProvider.meshEnabled ) {
        this._extractMeshCommand(state, todo, targetNetworkId, targetStoneId, markAsInitialized, directCommands, meshNetworks);
      }
      else {
        this._extractDirectCommand(todo, targetStoneId, markAsInitialized, directCommands);
      }
    }

    return { directCommands, meshNetworks };
  }

  extractConnectionTargets(state) {
    // This will determine if there are high priority commands to filter for, and if so return only those. If not, returns all.
    let commandsToHandle = this._getCommandsToHandle(state);

    let directTargets = {};
    let allRelayTargets = {};
    let relayOnlyTargets = {};
    let sphereMap = {};

    let uuids = Object.keys(commandsToHandle);
    for (let i = 0; i < uuids.length; i++) {
      let todo : batchCommandEntry = commandsToHandle[uuids[i]];

      let sphere = state.spheres[todo.sphereId]; if (!sphere) { continue; }
      let stone  = sphere.stones[todo.stoneId];  if (!stone)  { continue; }

      let command = todo.command;

      sphereMap[todo.stoneId] = todo.sphereId;

      if (this.isMeshEnabledCommand(command) === true && MapProvider.meshEnabled ) {
        directTargets[todo.stoneId] = true;
        let allMembersInNetwork = MeshUtil.getStonesInNetwork(state, todo.sphereId, stone.config.meshNetworkId);

        for (let j = 0; j < allMembersInNetwork.length; j++) {
          allRelayTargets[allMembersInNetwork[j].id] = true;
        }
      }
      else {
        directTargets[todo.stoneId] = true;
      }
    }

    let relayTargetIds = Object.keys(allRelayTargets);
    for ( let i = 0; i < relayTargetIds.length; i++ ) {
      if (!directTargets[relayTargetIds[i]]) {
        relayOnlyTargets[relayTargetIds[i]] = true;
      }
    }

    return { directTargets, relayOnlyTargets, sphereMap };
  }


  _getCommandsToHandle(state) : batchCommands {
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

        let sphere = state.spheres[currentTodo.sphereId]; if (!sphere) { continue; }
        let stone  = sphere.stones[currentTodo.stoneId];  if (!stone)  { continue; }

        let meshNetworkId = stone.config.meshNetworkId;
        if (meshNetworkId) {
          highPriorityMeshNetworks[meshNetworkId] = true;
        }
      }
    }

    // Now that we know there is a high priority command, we fill it based on priority or whether or not it belongs to the same stone or mesh.
    if (highPriorityActive) {
      for (let i = 0; i < uuids.length; i++) {
        let currentTodo = this.commands[uuids[i]];

        let sphere = state.spheres[currentTodo.sphereId]; if (!sphere) { continue; }
        let stone  = sphere.stones[currentTodo.stoneId];  if (!stone)  { continue; }

        let meshNetworkId = stone.config.meshNetworkId;
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
const _getPayloadFromCommand = (batchCommand : batchCommandEntry, stoneConfig) => {
  let payload;
  let command = batchCommand.command;

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