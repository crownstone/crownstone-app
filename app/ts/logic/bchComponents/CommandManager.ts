// import {LOGd, LOGe}         from '../../logging/Log'
// import {MeshUtil} from "../../util/MeshUtil";
// import { xUtil } from "../../util/StandAloneUtil";
// import { BCH_ERROR_CODES } from "../../Enums";
// import { core } from "../../core";
//
//
// /**
//  * This can be used to batch commands over the mesh or 1:1 to the Crownstones.
//  */
// export class CommandManager {
//   commands  : batchCommands = {};
//
//   load(stone, stoneId: string, sphereId: string, command: commandInterface, priority: boolean, attempts: number, options: batchCommandEntryOptions) : Promise<bchReturnType> {
//     if (stone.config.locked === true && (command.type === "multiSwitch" || command.type === "turnOn")) {
//       return new Promise((resolve, reject) => { reject({code: BCH_ERROR_CODES.STONE_IS_LOCKED, message:"Stone is Locked"}); });
//     }
//     else {
//       return new Promise((resolve, reject) => {
//         // remove duplicates from list.
//         this._clearDuplicates(stoneId, sphereId, command);
//         let uuid = xUtil.getUUID();
//         let shortUuid = xUtil.getShortUUID();
//         this.commands[uuid] = {
//           priority: priority,
//           handle:   stone.config.handle,
//           sphereId: sphereId,
//           stoneId:  stoneId,
//           command:  command,
//           commandUuid: shortUuid,
//           attempts: attempts,
//           options:  options,
//           timestamp: Date.now(),
//           cleanup:  () => { this.commands[uuid] = undefined; delete this.commands[uuid]; },
//           promise:  { resolve: resolve, reject: reject, pending: false }
//         };
//         core.eventBus.emit("BatchCommandHandlerLoadAction");
//       });
//     }
//   }
//
//   /**
//    * Remove duplicate entries from the commands
//    * @param stoneId
//    * @param sphereId
//    * @param command
//    * @private
//    */
//   _clearDuplicates(stoneId, sphereId, command : commandInterface) {
//     let uuids = Object.keys(this.commands);
//
//     let clean = (todo) => {
//       LOGd.bch("BatchCommandHandler: removing duplicate entry for ", stoneId, command.type, todo);
//       todo.promise.reject({code: BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE, message:"Removed because of duplicate"});
//       todo.cleanup();
//     };
//
//     for (let i = 0; i < uuids.length; i++) {
//       let todo = this.commands[uuids[i]];
//
//       if (todo.sphereId === sphereId && todo.stoneId === stoneId) {
//         let conflictingCommand = todo.command.type === command.type ||
//                                  todo.command.type === 'multiSwitch' && command.type === 'turnOn' ||
//                                  todo.command.type === 'turnOn'      && command.type === 'multiSwitch';
//         if (conflictingCommand) {
//           let duplicate = false;
//           switch(todo.command.type) {
//             case 'multiSwitch':
//             case 'turnOn':
//             case 'getBootloaderVersion':
//             case 'getFirmwareVersion':
//             case 'getHardwareVersion':
//             case 'commandFactoryReset':
//             case 'sendNoOp':
//             case 'sendMeshNoOp':
//             case 'meshSetTime':
//             case 'setTime':
//             case 'setSunTimes':
//             case 'clearErrors':
//             case 'lockSwitch':
//             case 'setSwitchCraft':
//             case 'allowDimming':
//             case 'setTapToToggle':
//             case 'setTapToToggleThresholdOffset':
//             case 'setMeshChannel':
//             case 'setupPulse':
//               duplicate = true;
//               break
//             case 'addBehaviour':
//             case 'updateBehaviour':
//             case 'removeBehaviour':
//             case 'syncBehaviour':
//             case 'getBehaviour':
//               duplicate = xUtil.deepCompare(todo.command, command);
//               break;
//             case 'registerTrackedDevice':
//               if (command.type === "registerTrackedDevice") {
//                 duplicate = todo.command.trackingNumber === command.trackingNumber;
//               }
//               break;
//             default:
//               duplicate = true;
//           }
//
//           if (duplicate) {
//             if (todo.promise.pending === false) {
//               clean(todo);
//             } else {
//               LOGd.bch("BatchCommandHandler: Detected pending duplicate entry for ", stoneId, command.type);
//             }
//           }
//         }
//       }
//     }
//   }
//
//
//   isMeshEnabledCommand(command : commandInterface) {
//     switch (command.type) {
//       case 'multiSwitch':
//         return true;
//       default:
//         return false;
//     }
//   }
//
//
//   _extractDirectCommand(todo, targetStoneId, directCommands : directCommands) {
//     // apply filter if required.
//     if (targetStoneId !== null && targetStoneId !== todo.stoneId) {
//       return;
//     }
//
//     // create the data fields for each sphere if they have not been created yet.
//     if (directCommands[todo.sphereId] === undefined) { directCommands[todo.sphereId] = []; }
//
//     directCommands[todo.sphereId].push(todo);
//   }
//
//   _extractMeshCommand(state, todo : batchCommandEntry, targetNetworkId, targetStoneId, meshNetworks : sphereMeshNetworks) {
//     let command = todo.command;
//     let sphere = state.spheres[todo.sphereId]; if (!sphere) { return; }
//     let stone  = sphere.stones[todo.stoneId];  if (!stone)  { return; }
//     let stoneConfig = stone.config;
//
//     if (stoneConfig.meshNetworkId === null || stoneConfig.meshNetworkId === undefined) {
//       return;
//     }
//
//     // apply filter if required.
//     if (targetNetworkId !== null) {
//       // if we are not in the required mesh network AND this is not the target stone, cancel
//       if (targetNetworkId !== stoneConfig.meshNetworkId && targetStoneId !== todo.stoneId) {
//         return;
//       }
//     }
//     else if (targetStoneId !== null && targetStoneId !== todo.stoneId) {
//       // this is not the target stone. Ignore.
//       return;
//     }
//
//     // create the data fields for each sphere if they have not been created yet.
//     if (meshNetworks[todo.sphereId]   === undefined) { meshNetworks[todo.sphereId]   = {}; }
//
//     // this is a function to ensure that we do not create a field in the meshNetwork
//     if (meshNetworks[todo.sphereId][stoneConfig.meshNetworkId] === undefined) {
//       meshNetworks[todo.sphereId][stoneConfig.meshNetworkId] = {
//         keepAlive:      [],
//         keepAliveState: [],
//         multiSwitch:    []
//       };
//     }
//
//     let payload = _getPayloadFromCommand(todo, stoneConfig);
//     switch (command.type) {
//       case 'multiSwitch':
//         meshNetworks[todo.sphereId][stoneConfig.meshNetworkId].multiSwitch.push(payload);
//         break;
//       default:
//         LOGe.bch("CommandManager: Invalid command received. This should not happen!");
//     }
//   }
//
//
//   /**
//    *
//    * If a target network id is provided, the filter will only allow stones which match that id unless the stoneId specifically matches the targetStoneId
//    * If only a targetStoneId is provided, the filter will allow only matching stoneIds
//    *
//    * @param state
//    * @param state
//    * @param addMeshEnabledCommands
//    * @param targetStoneId     // database id of stone. If provided, we only put todos for this stone in the list.
//    * @param addMeshEnabledCommands
//    * @returns directCommadns
//    * @private
//    */
//   extractDirectCommands(state, targetStoneId : string = null, addMeshEnabledCommands = true) {
//     // This will determine if there are high priority commands to filter for, and if so return only those. If not, returns all.
//     let commandsToHandle = this._getCommandsToHandle(state);
//     let directCommands : directCommands = {};
//
//     let uuids = Object.keys(commandsToHandle);
//     for (let i = 0; i < uuids.length; i++) {
//       let todo = commandsToHandle[uuids[i]];
//
//       let sphere = state.spheres[todo.sphereId]; if (!sphere) { continue; }
//       let stone  = sphere.stones[todo.stoneId];  if (!stone)  { continue; }
//       let stoneConfig = stone.config;
//
//       // we will not handle mesh commands if this crownstone is in a mesh network. (assuming mesh is globally enabled)
//       if (this.isMeshEnabledCommand(todo.command) && !addMeshEnabledCommands && stoneConfig.meshNetworkId !== null && stoneConfig.meshNetworkId !== undefined) {
//         continue;
//       }
//
//       this._extractDirectCommand(todo, targetStoneId, directCommands);
//     }
//
//     return directCommands;
//   }
//
//   /**
//    *
//    * If a target network id is provided, the filter will only allow stones which match that id unless the stoneId specifically matches the targetStoneId
//    * If only a targetStoneId is provided, the filter will allow only matching stoneIds
//    *
//    * @param state
//    * @param state
//    * @param targetNetworkId
//    * @param allowRelayOnly
//    * @param state
//    * @param targetNetworkId
//    * @param allowRelayOnly
//    * @param targetStoneId     // database id of stone. If provided, we only put todos for this stone in the list.
//    * @param targetNetworkId
//    * @param allowRelayOnly
//    * @returns directCommadns
//    * @private
//    */
//   extractMeshCommands(state, targetStoneId : string = null, targetNetworkId : string = null, allowRelayOnly : boolean = false) {
//     // This will determine if there are high priority commands to filter for, and if so return only those. If not, returns all.
//     let commandsToHandle = this._getCommandsToHandle(state);
//     let meshCommands : sphereMeshNetworks = {};
//
//     let uuids = Object.keys(commandsToHandle);
//     for (let i = 0; i < uuids.length; i++) {
//       let todo = commandsToHandle[uuids[i]];
//       if (!this.isMeshEnabledCommand(todo.command)) {
//         continue;
//       }
//       this._extractMeshCommand(state, todo, targetNetworkId, targetStoneId, meshCommands)
//     }
//
//
//     if (allowRelayOnly) {
//       return meshCommands;
//     }
//
//     // at this point, we only perform mesh commands if this is a direct connection as well. This will change in the future.
//     // because of this current limitation (connect directly and send full mesh payload to every node you directly connect to)
//     // we check now if there is a command for the targetStoneId in here. If not, return empty list.
//     let sphereIds = Object.keys(meshCommands);
//     for (let i = 0; i < sphereIds.length; i++) {
//       let meshNetworkIds = Object.keys(meshCommands[sphereIds[i]]);
//       for (let j = 0; j < meshNetworkIds.length; j++) {
//         let commands = meshCommands[sphereIds[i]][meshNetworkIds[j]];
//         let commandTypes = Object.keys(commands);
//         for (let k = 0; k < commandTypes.length; k++) {
//           let commandArray = commands[commandTypes[k]];
//           for (let l = 0; l < commandArray.length; l++) {
//             let command = commandArray[l];
//             if (command.stoneId === targetStoneId) {
//               return meshCommands;
//             }
//           }
//         }
//       }
//     }
//
//     // we only return the mesh commands in the check above (the evil looking loops).
//     return {};
//   }
//
//   extractConnectionTargets(state) : { directTargets: targetData, relayOnlyTargets: targetData } {
//     // This will determine if there are high priority commands to filter for, and if so return only those. If not, returns all.
//     let commandsToHandle = this._getCommandsToHandle(state);
//
//     let directTargets = {};
//     let allRelayTargets = {};
//     let relayOnlyTargets = {};
//     let sphereMap = {};
//
//     let uuids = Object.keys(commandsToHandle);
//     for (let i = 0; i < uuids.length; i++) {
//       let todo : batchCommandEntry = commandsToHandle[uuids[i]];
//
//       let sphere = state.spheres[todo.sphereId]; if (!sphere) { continue; }
//       let stone  = sphere.stones[todo.stoneId];  if (!stone)  { continue; }
//
//       let command = todo.command;
//
//       sphereMap[todo.stoneId] = todo.sphereId;
//
//       if (this.isMeshEnabledCommand(command) === true) {
//         directTargets[todo.stoneId] = todo.sphereId;
//         let allMembersInNetwork = MeshUtil.getStonesInNetwork(state, todo.sphereId, stone.config.meshNetworkId);
//
//         for (let j = 0; j < allMembersInNetwork.length; j++) {
//           allRelayTargets[allMembersInNetwork[j].id] = todo.sphereId;
//         }
//       }
//       else {
//         directTargets[todo.stoneId] = todo.sphereId;
//       }
//     }
//
//     let relayTargetIds = Object.keys(allRelayTargets);
//     for ( let i = 0; i < relayTargetIds.length; i++ ) {
//       let targetId = relayTargetIds[i];
//       if (!directTargets[targetId]) {
//         relayOnlyTargets[targetId] = allRelayTargets[targetId];
//       }
//     }
//
//     return { directTargets, relayOnlyTargets };
//   }
//
//
//   /**
//    * This method will collect all commands we require from te current this.commands by taking high priority into account.
//    * @param state
//    * @returns {batchCommands}
//    * @private
//    */
//   _getCommandsToHandle(state) : batchCommands {
//     // this is the list we will iterate over and process.
//     let todoList = this.commands;
//
//     // first we check if there is a high priority element in the list.
//     let uuids = Object.keys(todoList);
//     let highPriorityCommands : batchCommands = {};
//     let highPriorityCrownstones = {};
//     let highPriorityMeshNetworks = {};
//     let highPriorityActive = false;
//
//     // loop over all commands to look for a high priority one. If there is, also store the stoneId and meshNetworkId if available.
//     // if a crownstone has a high priority command, also do the accompanying low priority ones if it has any.
//     for (let i = 0; i < uuids.length; i++) {
//       let currentTodo = this.commands[uuids[i]];
//       if (currentTodo.priority === true) {
//         highPriorityActive = true;
//         highPriorityCrownstones[currentTodo.stoneId] = true;
//
//         let sphere = state.spheres[currentTodo.sphereId]; if (!sphere) { continue; }
//         let stone  = sphere.stones[currentTodo.stoneId];  if (!stone)  { continue; }
//
//         let meshNetworkId = stone.config.meshNetworkId;
//         if (meshNetworkId) {
//           highPriorityMeshNetworks[meshNetworkId] = true;
//         }
//       }
//     }
//
//     // Now that we know there is a high priority command, we fill it based on priority or whether or not it belongs to the same stone or mesh.
//     if (highPriorityActive) {
//       for (let i = 0; i < uuids.length; i++) {
//         let currentTodo = this.commands[uuids[i]];
//
//         let sphere = state.spheres[currentTodo.sphereId]; if (!sphere) { continue; }
//         let stone  = sphere.stones[currentTodo.stoneId];  if (!stone)  { continue; }
//
//         let meshNetworkId = stone.config.meshNetworkId;
//         if (currentTodo.priority === true || highPriorityCrownstones[currentTodo.stoneId] || (meshNetworkId !== null && highPriorityMeshNetworks[meshNetworkId])) {
//           highPriorityCommands[uuids[i]] = this.commands[uuids[i]];
//         }
//       }
//
//       // if there are high priority tasks, we switch the todoList from the full set to the high priority subset.
//       todoList = highPriorityCommands;
//     }
//
//     return todoList;
//   }
//
//
//   highPriorityCommandAvailable() : boolean {
//     // first we check if there is a high priority element in the list.
//     let uuids = Object.keys(this.commands);
//
//     // loop over all commands to look for a high priority one.
//     for (let i = 0; i < uuids.length; i++) {
//       if (this.commands[uuids[i]].priority === true) {
//         return true;
//       }
//     }
//     return false;
//   }
//
//   commandsAvailable() : boolean {
//     return Object.keys(this.commands).length > 0
//   }
//
//   forceCleanAllCommands() {
//     let uuids = Object.keys(this.commands);
//     for (let i = 0; i < uuids.length; i++) {
//       this.commands[uuids[i]].promise.resolve({ data: null });
//       this.commands[uuids[i]].cleanup();
//     }
//   }
// }
//
//
//
// /**
//  * Extract the payload from the commands for the 4 supported states.
//  * @param batchCommand
//  * @param stoneConfig
//  * @returns {any}
//  * @private
//  */
// const _getPayloadFromCommand = (batchCommand : batchCommandEntry, stoneConfig) => {
//   let payload;
//   let command = batchCommand.command;
//
//   if (command.type === 'multiSwitch') {
//     payload = {
//       stoneId: batchCommand.stoneId,
//       commandUuid: batchCommand.commandUuid,
//       attempts: batchCommand.attempts,
//       timestamp: batchCommand.timestamp,
//       crownstoneId: stoneConfig.crownstoneId,
//       options: batchCommand.options,
//       handle: stoneConfig.handle,
//       state: command.state,
//       // state: command.type === 'turnOn' ? 255 : Math.max(0,Math.min(100,100*command.state)),
//       cleanup: batchCommand.cleanup,
//       promise: batchCommand.promise
//     };
//   }
//   return payload;
// };