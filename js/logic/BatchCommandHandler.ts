import { eventBus }              from '../util/EventBus'
import { Util }                  from '../util/Util'
import { BlePromiseManager }     from './BlePromiseManager'
import { BluenetPromiseWrapper } from '../native/libInterface/BluenetPromise';
import { LOG }                   from '../logging/Log'
import { Scheduler }             from './Scheduler'
import { MeshHelper }            from './MeshHelper'


/**
 * This can be used to batch commands over the mesh or 1:1 to the Crownstones.
 */
class BatchCommandHandlerClass {
  commands  : batchCommands = {};
  sphereId  : any;

  constructor() { }


  /**
   * @param { Object } stone              // Redux Stone Object
   * @param { String } stoneId            // StoneId,
   * @param { String } sphereId           // sphereId,
   * @param { commandInterface } command  // Object containing a command that is in the BluenetPromise set
   * @param { Number } attempts           // sphereId,
   */
  load(stone, stoneId, sphereId, command : commandInterface, attempts : number = 1) {
    LOG.verbose("BatchCommandHandler: Loading Command,", stoneId, stone.config.name, command);
    return this._load(stone, stoneId, sphereId, command, false, attempts );
  }

  /**
   * @param { Object } stone              // Redux Stone Object
   * @param { String } stoneId            // StoneId,
   * @param { String } sphereId           // sphereId,
   * @param { commandInterface } command  // Object containing a command that is in the BluenetPromise set
   * @param { Number } attempts           // sphereId,
   */
  loadPriority(stone, stoneId, sphereId, command : commandInterface, attempts : number = 1) {
    LOG.verbose("BatchCommandHandler: Loading High Priority Command,", stoneId, stone.config.name, command);
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
   * @returns {{directCommands: {}, meshNetworks: sphereMeshNetworks}}
   * @private
   */
  _extractTodo(targetStoneId : string = null, targetNetworkId : string = null) {
    let commandsToHandle = this._getCommandsToHandle();

    let directCommands : directCommands = {};
    let meshNetworks : sphereMeshNetworks = {};

    let uuids = Object.keys(commandsToHandle);
    for (let i = 0; i < uuids.length; i++) {
      let todo = commandsToHandle[uuids[i]];

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

      let payload = this._getPayloadFromCommand(todo);

      // mesh not supported / no mesh detected for this stone
      if (stoneConfig.meshNetworkId === null || stoneConfig.meshNetworkId === undefined) {
        // handle this 1:1
        directCommands[todo.sphereId].push(todo);
      }
      else {
        if (meshNetworks[todo.sphereId][stoneConfig.meshNetworkId] === undefined) {
          meshNetworks[todo.sphereId][stoneConfig.meshNetworkId] = {
            keepAlive:      [],
            keepAliveState: [],
            setSwitchState: [],
            multiSwitch:    [],
            other:          []
          };
        }

        if (command.commandName === 'keepAlive') {
          meshNetworks[todo.sphereId][stoneConfig.meshNetworkId].keepAlive.push(payload);
        }
        else if (command.commandName === 'keepAliveState') {
          meshNetworks[todo.sphereId][stoneConfig.meshNetworkId].keepAliveState.push(payload);
        }
        else if (command.commandName === 'setSwitchState') {
          meshNetworks[todo.sphereId][stoneConfig.meshNetworkId].setSwitchState.push(payload);
        }
        else if (command.commandName === 'multiSwitch') {
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
   * Extract the payload from the commands for the 4 supported states.
   * @param batchCommand
   * @returns {any}
   * @private
   */
  _getPayloadFromCommand(batchCommand : batchCommandEntry) {
    let payload;
    let command = batchCommand.command;
    let stoneConfig = batchCommand.stone.config;

    if (command.commandName === 'keepAlive') {
      payload = {cleanup: batchCommand.cleanup, promise: batchCommand.promise};
    }
    else if (command.commandName === 'keepAliveState') {
      payload = {
        crownstoneId: stoneConfig.crownstoneId,
        handle: stoneConfig.handle,
        changeState: command.changeState,
        state: command.state,
        attempts: batchCommand.attempts,
        timeout: command.timeout,
        cleanup: batchCommand.cleanup,
        promise: batchCommand.promise
      };
    }
    else if (command.commandName === 'setSwitchState') {
      payload = {
        crownstoneId: stoneConfig.crownstoneId,
        handle: stoneConfig.handle,
        state: command.state,
        attempts: batchCommand.attempts,
        cleanup: batchCommand.cleanup,
        promise: batchCommand.promise
      };
    }
    else if (command.commandName === 'multiSwitch') {
      payload = {
        crownstoneId: stoneConfig.crownstoneId,
        handle: stoneConfig.handle,
        state: command.state,
        intent: command.intent,
        timeout: command.timeout,
        attempts: batchCommand.attempts,
        cleanup: batchCommand.cleanup,
        promise: batchCommand.promise
      };
    }

    return payload;
  }


  /**
   * Convert all the todos to an array of event topics we can listen to.
   * These events are triggered by advertisements or ibeacon messages.
   * @returns {Array}
   * @private
   */
  _getObjectsToScan() {
    let { directCommands, meshNetworks } = this._extractTodo();

    // get sphereIds of the spheres we need to do things in.
    let meshSphereIds = Object.keys(meshNetworks);
    let directSphereIds = Object.keys(directCommands);
    let topicsToScan = [];

    // find all topics in the mesh sphereId
    meshSphereIds.forEach((sphereId) => {
      let meshNetworkIds = Object.keys(meshNetworks[sphereId]);
      meshNetworkIds.forEach((networkId) => {
        LOG.info("BatchCommandHandler: meshNetworkCommands for sphere", sphereId, ", command:", meshNetworks[sphereId][networkId]);
        topicsToScan.push({ sphereId: sphereId, topic: Util.events.getMeshTopic(sphereId, networkId) });
      });
    });

    // find all the topics for individual crownstones.
    directSphereIds.forEach((sphereId) => {
      directCommands[sphereId].forEach((command) => {
        LOG.info("BatchCommandHandler: directCommands for sphere:", sphereId, " stone:", command.stoneId, ", command:", command.command);
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
              case 'keepAlive':
                actionPromise = BluenetPromiseWrapper.keepAlive();
                break;
              case 'keepAliveState':
                actionPromise = BluenetPromiseWrapper.keepAliveState(command.changeState, command.state, command.timeout);
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

        LOG.info("BatchCommandHandler: No topics to scan during BatchCommandHandler execution");
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

          LOG.error("ERROR DURING EXECUTE", err);
          reject(err);
        })
        .catch((err) => {
          // this fallback catches errors in the attemptHandler.
          LOG.error("FATAL ERROR DURING EXECUTE", err);
          reject(err);
        })
    })
  }

  _connectAndHandleCommands(crownstoneToHandle : connectionInfo) {
    return new Promise((resolve, reject) => {
      LOG.info("BatchCommandHandler: connecting to ", crownstoneToHandle);
      BluenetPromiseWrapper.connect(crownstoneToHandle.handle)
        .then(() => {
          LOG.info("BatchCommandHandler: Connected to ", crownstoneToHandle);
          return this._handleAllCommandsForStone(crownstoneToHandle);
        })
        // .then(() => {
        //   // check if we should to add a keepalive since we're connected anyway
        //   if (KeepAliveHandler.timeUntilNextTrigger() < 0.5 * KEEPALIVE_INTERVAL * 1000 ) {
        //     KeepAliveHandler.fireTrigger();
        //     return this._handleAllCommandsForStone(connectedCrownstone)
        //   }
        // })
        .then(() => {
          return new Promise((disconnectResolve, disconnectReject) => {
            BluenetPromiseWrapper.disconnect()
              .then(() => {
                disconnectResolve()
              })
              .catch((err) => {
                LOG.warn("BatchCommandHandler: Could not normally disconnect from device.", err);
                return BluenetPromiseWrapper.phoneDisconnect();
              })
              .then(() => {
                disconnectResolve();
              })
              .catch((err) => {
                LOG.warn("BatchCommandHandler: Could not phone disconnect from device.", err);
                disconnectResolve();
              })
          });
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
          LOG.error("ERROR DURING EXECUTE", err);
          // TODO: make this a 'safeDisconnect' in bluenetPromise
          new Promise((disconnectResolve, disconnectReject) => {
            BluenetPromiseWrapper.phoneDisconnect()
              .then(() => {
                disconnectResolve();
              })
              .catch((err) => {
                LOG.warn("BatchCommandHandler: Could not phone disconnect from device.", err);
                disconnectResolve();
              })
          })
          .then(() => {
            reject(err);
          })
        })
    })
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
      command.attempts -= 1;
      if (command.attempts <= 0) {
        command.promise.reject(err);
        command.cleanup();
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
      networkTodo.setSwitchState.forEach(handleAttempt);
      networkTodo.multiSwitch.forEach(handleAttempt);
      networkTodo.other.forEach(handleAttempt);
    });
  }


  execute() {
    this._execute(false);
  }

  executePriority() {
    eventBus.emit('PriorityExecute');
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
    LOG.info("BatchCommandHandler: Scheduling command in promiseManager");
    let actionPromise = () => {
      LOG.info("BatchCommandHandler: Executing!");
      return this._searchAndHandleCommands();
    };

    let promiseRegistration = null;

    if (priority) { promiseRegistration = BlePromiseManager.registerPriority.bind(BlePromiseManager); }
    else          { promiseRegistration = BlePromiseManager.register.bind(BlePromiseManager); }

    promiseRegistration(actionPromise, {from: 'BatchCommandHandler: executing.'})
      .catch((err) => {
        // disable execution and forward the error
        LOG.error("BatchCommandHandler: Error completing promise.", err);
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

        LOG.warn("No stones found before timeout.");
        reject("No stones found before timeout.");
      }, timeout, 'Looking for target...');


      // if we're busy with a low priority command, we will stop the search if a high priority execute comes in.
      if (highPriorityActive !== true) {
        unsubscribeListeners.push(eventBus.on('PriorityExecute', () => {
          LOG.debug("Stopped listening for Crownstones due to Priority Execute.");
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
          LOG.debug("Got a notification:", data);
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