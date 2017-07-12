import { eventBus }              from '../util/EventBus'
import { Util }                  from '../util/Util'
import { BlePromiseManager }     from './BlePromiseManager'
import { BluenetPromiseWrapper } from '../native/libInterface/BluenetPromise';
import { LOG }                   from '../logging/Log'
import { Scheduler }             from './Scheduler'
import { MeshHelper }            from './MeshHelper'
import {DISABLE_NATIVE, MESH_ENABLED}          from '../ExternalConfig'
import {Permissions} from "../backgroundProcesses/Permissions";


/**
 * This can be used to batch commands over the mesh or 1:1 to the Crownstones.
 */
class BatchCommandHandlerClass {
  commands  : batchCommands = {};
  store: any;
  sphereId  : any;
  activePromiseId : string = null;


  constructor() {}

  _loadStore(store) {
    this.store = store;
  }

  /**
   * @param { Object } stone              // Redux Stone Object
   * @param { String } stoneId            // StoneId,
   * @param { String } sphereId           // sphereId,
   * @param { commandInterface } command  // Object containing a command that is in the BluenetPromise set
   * @param { Number } attempts           // sphereId,
   * @param { string } label              // explain where the command comes from,
   */
  load(stone, stoneId, sphereId, command : commandInterface, attempts : number = 1, label = '') {
    LOG.verbose("BatchCommandHandler: Loading Command, sphereId:",sphereId," stoneId:", stoneId, stone.config.name, command, label);
    return this._load(stone, stoneId, sphereId, command, false, attempts );
  }

  /**
   * @param { Object } stone              // Redux Stone Object
   * @param { String } stoneId            // StoneId,
   * @param { String } sphereId           // sphereId,
   * @param { commandInterface } command  // Object containing a command that is in the BluenetPromise set
   * @param { Number } attempts           // sphereId,
   * @param { string } label              // explain where the command comes from,
   */
  loadPriority(stone, stoneId, sphereId, command : commandInterface, attempts : number = 1, label = '') {
    LOG.verbose("BatchCommandHandler: Loading High Priority Command, sphereId:",sphereId," stoneId", stoneId, stone.config.name, command, label);
    return this._load(stone, stoneId, sphereId, command, true, attempts );
  }

  _load(stone, stoneId: string, sphereId: string, command: commandInterface, priority: boolean, attempts: number) {
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
        initialized: false,
        cleanup:  () => { this.commands[uuid] = undefined; delete this.commands[uuid]; },
        promise:  { resolve: resolve, reject: reject, pending: false}
      };
    });
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
    for (let i = 0; i < uuids.length; i++) {
      let todo = this.commands[uuids[i]];
      if (todo.sphereId === sphereId && todo.stoneId === stoneId && todo.command.commandName === command.commandName) {
        if (todo.promise.pending === false) {
          LOG.warn("BatchCommandHandler: removing duplicate entry for ", stoneId, command.commandName);
          todo.promise.reject("Removed because of duplicate");
          todo.cleanup();
        }
        else {
          LOG.warn("BatchCommandHandler: Detected pending duplicate entry for ", stoneId, command.commandName);
        }
      }
    }
  }


  _isHighPriority() : boolean {
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
  _extractTodo(targetStoneId : string = null, targetNetworkId : string = null, markAsInitialized = false) {
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


  /**
   * Convert all the todos to an array of event topics we can listen to.
   * These events are triggered by advertisements or ibeacon messages.
   * @returns {Array}
   * @private
   */
  _getObjectsToScan() {
    let { directCommands, meshNetworks } = this._extractTodo(null, null, true);

    // get sphereIds of the spheres we need to do things in.
    let meshSphereIds = Object.keys(meshNetworks);
    let directSphereIds = Object.keys(directCommands);
    let topicsToScan = [];

    // find all topics in the mesh sphereId
    meshSphereIds.forEach((sphereId) => {
      let meshNetworkIds = Object.keys(meshNetworks[sphereId]);
      meshNetworkIds.forEach((networkId) => {
        LOG.info("BatchCommandHandler: meshNetworkCommands for sphere", sphereId, ", command:", meshNetworks[sphereId][networkId], this.activePromiseId);
        topicsToScan.push({ sphereId: sphereId, topic: Util.events.getMeshTopic(sphereId, networkId) });
      });
    });

    // find all the topics for individual crownstones.
    directSphereIds.forEach((sphereId) => {
      directCommands[sphereId].forEach((command) => {
        LOG.info("BatchCommandHandler: directCommands for sphere:", sphereId, " stone:", command.stoneId, ", command:", command.command, this.activePromiseId);
        topicsToScan.push({ sphereId: sphereId, topic: Util.events.getCrownstoneTopic(sphereId, command.stoneId) });
      });
    });

    return topicsToScan;
  }


  /**
   * This will commands one by one to the connected Crownstone.
   * @param connectionInfo
   * @returns { Promise<T> }
   */
  _handleAllCommandsForStone(connectionInfo: connectionInfo) {
    return new Promise((resolve, reject) => {
      let { directCommands, meshNetworks } = this._extractTodo(connectionInfo.stoneId, connectionInfo.meshNetworkId);

      // check if we have to perform any mesh commands for this Crownstone.
      let meshSphereIds = Object.keys(meshNetworks);
      let promise = null;
      for (let i = 0; i < meshSphereIds.length; i++) {
        let networksInSphere = meshNetworks[meshSphereIds[i]];
        let meshNetworkIds = Object.keys(networksInSphere);
        // pick the first network to handle
        if (meshNetworkIds.length > 0) {
          let helper = new MeshHelper(meshSphereIds[i], meshNetworkIds[i], networksInSphere[meshNetworkIds[0]]);
          promise = helper.performAction();
          break;
        }
      }

      // if we did not have a mesh command to handle, try the direct commands.
      if (promise === null) {
        let directSphereIds = Object.keys(directCommands);
        let actionPromise = null;
        let performedAction = null;
        for (let i = 0; i < directSphereIds.length; i++) {
          let commandsInSphere = directCommands[directSphereIds[i]];
          if (commandsInSphere.length > 0) {
            let action = directCommands[directSphereIds[i]][0];
            let command = action.command;
            performedAction = action;
            switch (command.commandName) {
              case 'getFirmwareVersion':
                actionPromise = BluenetPromiseWrapper.getFirmwareVersion();
                break;
              case 'getHardwareVersion':
                actionPromise = BluenetPromiseWrapper.getHardwareVersion();
                break;
              case 'getErrors':
                actionPromise = BluenetPromiseWrapper.getErrors();
                break;
              case 'clearErrors':
                // TODO: wait for fix on firmware to just disable a single error.
                // actionPromise = BluenetPromiseWrapper.clearErrors(command.clearErrorJSON);
                actionPromise = BluenetPromiseWrapper.restartCrownstone();
                break;
              case 'setTime':
                actionPromise = BluenetPromiseWrapper.setTime(command.time);
                break;
              case 'getTime':
                actionPromise = BluenetPromiseWrapper.getTime();
                break;
              case 'keepAlive':
                actionPromise = BluenetPromiseWrapper.keepAlive();
                break;
              case 'keepAliveState':
                actionPromise = BluenetPromiseWrapper.keepAliveState(command.changeState, command.state, command.timeout);
                break;
              case 'clearSchedule':
                actionPromise = BluenetPromiseWrapper.clearSchedule(command.scheduleEntryIndex);
                break;
              case 'getAvailableScheduleEntryIndex':
                actionPromise = BluenetPromiseWrapper.getAvailableScheduleEntryIndex();
                break;
              case 'setSchedule':
                actionPromise = BluenetPromiseWrapper.setSchedule(command.scheduleConfig);
                break;
              case 'addSchedule':
                actionPromise = BluenetPromiseWrapper.addSchedule(command.scheduleConfig);
                break;
              case 'setSwitchState':
              case 'multiSwitch': // if it's a direct call, we just use the setSwitchState.
                actionPromise = BluenetPromiseWrapper.setSwitchState(command.state);
                break;
              default:
                performedAction = null;
            }
            break;
          }
        }

        // if the direct command is performed, clean up the command afterwards.
        if (actionPromise !== null) {
          // clean up by resolving the promises of the items contained in the mesh messages.
          promise = actionPromise.then((data) => {
            performedAction.promise.resolve(data);
            performedAction.cleanup();
          })
        }
      }


      // if there is something to do, perform the promise and schedule the next one so we will
      // handle all commands for this Crownstone.
      if (promise !== null) {
        promise
          .then(() => {
            // we assume the cleanup of the action(s) has been called.
            return this._handleAllCommandsForStone(connectionInfo);
          })
          .then(() => {
            resolve()
          })
          .catch((err) => {
            reject(err);
          })
      }
      else {
        resolve()
      }
    })
  }


  /**
   * This method will search for Crownstones using the topics provided by the _getObjectsToScan.
   * It will connect to the first responder and perform all commands for that Crownstone. It will then move on to the next one.
   * @returns {Promise<T>}
   */
  _searchAndHandleCommands() {
    return new Promise((resolve, reject) => {
      let topicsToScan = this._getObjectsToScan();
      if (topicsToScan.length === 0) {
        // Use the attempt handler to clean up after something fails.
        this.attemptHandler(null, 'Nothing to scan');

        LOG.info("BatchCommandHandler: No topics to scan during BatchCommandHandler execution", this.activePromiseId);
        resolve();

        // abort the rest of the method.
        return;
      }

      // if there is a high priority call that we need to do, ignore the rssi limit.
      let highPriorityActive = this._isHighPriority();
      let rssiScanThreshold = -91;
      if (highPriorityActive) {
        rssiScanThreshold = null;
      }

      let activeCrownstone = null;

      // scan for target
      this._searchScan(topicsToScan, rssiScanThreshold, highPriorityActive, 5000)
        .catch((err) => {
          // nothing found within -91. if this is a low priority call, we will attempt it without the rssi threshold.
          if (rssiScanThreshold !== null && highPriorityActive === false) {
            return this._searchScan(topicsToScan, null, false, 5000)
          }
          else {
            throw err;
          }
        })
        .then((crownstoneToHandle : connectionInfo) => {
          activeCrownstone = crownstoneToHandle;
          if (crownstoneToHandle === null) {
            // this happens during a priority interrupt
            return;
          }
          else {
            return this._connectAndHandleCommands(crownstoneToHandle);
          }
        })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          // Use the attempt handler to clean up after something fails.
          this.attemptHandler(activeCrownstone, err);

          // attempt to reschedule on failure.
          if (Object.keys(this.commands).length > 0) {
            this._scheduleNextStone();
          }

          reject(err);
        })
        .catch((err) => {
          // this fallback catches errors in the attemptHandler.
          LOG.error("BatchCommandHandler: FATAL ERROR DURING EXECUTE", err, this.activePromiseId);
          reject(err);
        })
    })
  }

  _connectAndHandleCommands(crownstoneToHandle : connectionInfo) {
    return new Promise((resolve, reject) => {
      LOG.info("BatchCommandHandler: connecting to ", crownstoneToHandle, this.activePromiseId);
      BluenetPromiseWrapper.connect(crownstoneToHandle.handle)
        .then(() => {
          LOG.info("BatchCommandHandler: Connected to ", crownstoneToHandle, this.activePromiseId);
          return this._handleAllCommandsForStone(crownstoneToHandle);
        })
        // .then(() => {
        //   if (Permissions.setStoneTime && this.store) {
        //     // check if we have to tell this crownstone what time it is.
        //     let state = this.store.getState();
        //     let lastTime = state.spheres[crownstoneToHandle.sphereId].stones[crownstoneToHandle.stoneId].config.lastUpdatedStoneTime;
        //     // if it is more than 5 hours ago, tell this crownstone the time.
        //     if (new Date().valueOf() - lastTime > 5 * 3600 * 1000) {
        //       // this will never halt the chain since it's optional.
        //       return BluenetPromiseWrapper.setTime(new Date().valueOf() / 1000)
        //         .then(() => {
        //           this.store.dispatch({type: "UPDATED_STONE_TIME", sphereId: crownstoneToHandle.sphereId, stoneId: crownstoneToHandle.stoneId})
        //         })
        //         .catch((err) => { LOG.warning("BatchCommandHandler: Could not set the time of Crownstone", err); })
        //     }
        //   }
        // })
        .then(() => {
          return BluenetPromiseWrapper.disconnectCommand()
        })
        .then(() => {
          if (Object.keys(this.commands).length > 0) {
            this._scheduleNextStone();
          }
        })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          BluenetPromiseWrapper.phoneDisconnect()
            .then(() => {
              reject(err);
            })
        })
    });
  }

  /**
   * This is invoked after something during the process fails.
   * It reduces the attempt counter in the affected processes by 1. If the attempt count is at 0, it will remove the command
   * from the list.
   * @param connectedCrownstone
   * @param err
   */
  attemptHandler(connectedCrownstone, err) {
    let handleAttempt = (command) => {
      // The command has to be initialized first.
      // This is required to avoid the cases where commands that are loaded while there is a pending process
      // If that pending process fails, anything that was loaded during that time would be cancelled as well.
      if (command.initialized === true) {
        command.attempts -= 1;
        if (command.attempts <= 0) {
          command.promise.reject(err);
          command.cleanup();
        }
      }
    };

    // if we did not find anything to connect to, we will reduce app open attempts.
    if (!connectedCrownstone) {
      connectedCrownstone = {stoneId: null, meshNetworkId: null};
    }

    let { directCommands, meshNetworks } = this._extractTodo(connectedCrownstone.stoneId, connectedCrownstone.meshNetworkId);
    let directCommandSpheres = Object.keys(directCommands);
    directCommandSpheres.forEach((sphereId) => {
      let commandsInSphere = directCommands[sphereId];
      commandsInSphere.forEach(handleAttempt);
    });

    let meshNetworkSpheres = Object.keys(meshNetworks);
    meshNetworkSpheres.forEach((sphereId) => {
      let networkTodo = meshNetworks[sphereId][connectedCrownstone.meshNetworkId];

      // only handle the attempts if there are any for this sphere.
      if (!networkTodo) {
        return;
      }

      networkTodo.keepAlive.forEach(handleAttempt);
      networkTodo.keepAliveState.forEach(handleAttempt);
      networkTodo.multiSwitch.forEach(handleAttempt);
      networkTodo.other.forEach(handleAttempt);
    });
  }


  execute() {
    this._execute(false);
  }

  executePriority() {
    eventBus.emit('PriorityCommandSubmitted');
    this._execute(true);
  }

  _scheduleNextStone() {
    this._scheduleExecute(false);
  }

  /**
   * @param { Boolean } priority        //  this will move any command to the top of the queue
   */
  _execute(priority) {
    this._scheduleExecute(priority);
  }

  _scheduleExecute(priority) {
    // HACK TO SUCCESSFULLY DO ALL THINGS WITH BHC WITHOUT NATIVE
    if (DISABLE_NATIVE === true) {
      Scheduler.scheduleCallback(() => {
        let uuids = Object.keys(this.commands);
        for (let i = 0; i < uuids.length; i++) {
          this.commands[uuids[i]].promise.resolve();
          this.commands[uuids[i]].cleanup();
        }
      }, 1500, "Fake native handling of BHC");
      return;
    }

    LOG.info("BatchCommandHandler: Scheduling command in promiseManager");
    let actionPromise = () => {
      this.activePromiseId = Util.getUUID();
      LOG.info("BatchCommandHandler: Executing!", this.activePromiseId);
      return this._searchAndHandleCommands();
    };

    let promiseRegistration = null;

    if (priority) { promiseRegistration = BlePromiseManager.registerPriority.bind(BlePromiseManager); }
    else          { promiseRegistration = BlePromiseManager.register.bind(BlePromiseManager); }

    promiseRegistration(actionPromise, {from: 'BatchCommandHandler: executing.'})
      .catch((err) => {
        // disable execution stop the error propagation since this is not returned anywhere.
        LOG.error("BatchCommandHandler: Error completing promise.", err, this.activePromiseId);
      });
  }



  /**
   * return Promise which will resolve to a handle to connect to.
   * If this returns null, the search has been cancelled prematurely.
   * @private
   */
  _searchScan(objectsToScan : any[], rssiThreshold = null, highPriorityActive = false, timeout = 5000) {
    return new Promise((resolve, reject) => {

      let unsubscribeListeners = [];

      let cleanup = () => {
        // remove all listeners
        unsubscribeListeners.forEach((unsubscribe) => {
          unsubscribe();
        });

        unsubscribeListeners = [];
      };

      // scheduled timeout in case we do not hear anything from the event
      let clearCleanupCallback = Scheduler.scheduleCallback(() => {
        // remove the listeners
        cleanup();

        LOG.warn("BatchCommandHandler: No stones found before timeout.");
        reject("No stones found before timeout.");
      }, timeout, 'Looking for target...');


      // if we're busy with a low priority command, we will stop the search if a high priority execute comes in.
      if (highPriorityActive !== true) {
        unsubscribeListeners.push(eventBus.on('PriorityCommandSubmitted', () => {
          LOG.info("BatchCommandHandler: Stopped listening for Crownstones due to Priority Execute.");
          // remove the listeners
          cleanup();

          // remove cleanup callback
          clearCleanupCallback();

          // resolve with the handle.
          resolve(null);
        }));
      }

      // cleanup timeout
      objectsToScan.forEach((topic) => {
        // data: { handle: stone.config.handle, id: stoneId, rssi: rssi }
        unsubscribeListeners.push( eventBus.on(topic.topic, (data) => {
          LOG.debug("BatchCommandHandler: Got an event:", data);
          if (rssiThreshold === null || data.rssi > rssiThreshold) {
            // remove the listeners
            cleanup();

            // remove cleanup callback
            clearCleanupCallback();

            // resolve with the handle.
            resolve({
              stoneId: data.stoneId,
              meshNetworkId: data.meshNetworkId || null,
              sphereId: topic.sphereId,
              handle: data.handle
            });
          }
        }));
      });
    })
  }

}

export const BatchCommandHandler = new BatchCommandHandlerClass();


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
      cleanup: batchCommand.cleanup,
      promise: batchCommand.promise
    };
  }
  else if (command.commandName === 'keepAliveState') {
    payload = {
      attempts: batchCommand.attempts,
      initialized: batchCommand.initialized,
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
      handle: stoneConfig.handle,
      state: command.state,
      cleanup: batchCommand.cleanup,
      promise: batchCommand.promise
    };
  }
  else if (command.commandName === 'multiSwitch') {
    payload = {
      attempts: batchCommand.attempts,
      initialized: batchCommand.initialized,
      crownstoneId: stoneConfig.crownstoneId,
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