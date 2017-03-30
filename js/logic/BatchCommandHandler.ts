import { eventBus } from '../util/EventBus'
import { Util } from '../util/Util'
import { BlePromiseManager } from './BlePromiseManager'
import { BluenetPromiseWrapper } from '../native/Proxy';
import { LOG } from '../logging/Log'
import { Scheduler } from './Scheduler'
import { MeshHelper } from './MeshHelper'
import { KeepAliveHandler } from "../native/KeepAliveHandler";
import {KEEPALIVE_INTERVAL} from "../ExternalConfig";


/**
 * This can be used to batch commands over the mesh or 1:1 to the Crownstones.
 */
class BatchCommandHandlerClass {
  commands  : batchCommands = {};
  sphereId  : any;
  executing : boolean = false;

  constructor() { }


  /**
   * @param { Object } stone              // Redux Stone Object
   * @param { String } stoneId            // StoneId,
   * @param { String } sphereId           // sphereId,
   * @param { commandInterface } command  // Object containing a command that is in the BluenetPromise set
   * @param { Number } attempts           // sphereId,
   */
  load(stone, stoneId, sphereId, command : commandInterface, attempts : number = 1) {
    LOG.verbose("BatchCommand: Loading command,", stoneId, stone.config.name, command);
    return new Promise((resolve, reject) => {
      // remove duplicates from list.
      this._clearDuplicates(stoneId, sphereId, command);
      let uuid = Util.getUUID();
      this.commands[uuid] = {
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
          LOG.warn("BatchCommand: removing duplicate entry for ", stoneId, command.commandName);
          todo.promise.reject("Removed because of duplicate");
          todo.cleanup();
        }
        else {
          LOG.warn("BatchCommand: Detected pending duplicate entry for ", stoneId, command.commandName);
        }
      }
    }
  }

  /**
   * @param targetStoneId   // database id of stone. If provided, we only put todos for this stone in the list.
   * @param targetNetworkId   // Mesh network id of the Crownstone. If provided, we only put todos for this mesh network in the list.
   * @returns {{directCommands: {}, meshNetworks: sphereMeshNetworks}}
   * @private
   */
  _extractTodo(targetStoneId : string = null, targetNetworkId : string = null) {
    let directCommands : directCommands = {};
    let meshNetworks : sphereMeshNetworks = {};

    let uuids = Object.keys(this.commands);
    for (let i = 0; i < uuids.length; i++) {
      let todo = this.commands[uuids[i]];

      let command = todo.command;
      let stoneConfig = todo.stone.config;

      // filter on stoneId or targetNetworkId if one is provided
      // Not inverted for readability.
      if ((targetNetworkId === stoneConfig.meshNetworkId || !targetNetworkId) ||
          (targetStoneId   === todo.stoneId              || !targetStoneId)) {
        // pass
      }
      else {
        continue;
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
   * @param commands
   * @returns {any}
   * @private
   */
  _getPayloadFromCommand(commands : batchCommandEntry) {
    let payload;
    let command = commands.command;
    let stoneConfig = commands.stone.config;

    if (command.commandName === 'keepAlive') {
      payload = {cleanup: commands.cleanup, promise: commands.promise};
    }
    else if (command.commandName === 'keepAliveState') {
      payload = {
        crownstoneId: stoneConfig.crownstoneId,
        handle: stoneConfig.handle,
        changeState: command.changeState,
        state: command.state,
        timeout: command.timeout,
        cleanup: commands.cleanup,
        promise: commands.promise
      };
    }
    else if (command.commandName === 'setSwitchState') {
      payload = {
        crownstoneId: stoneConfig.crownstoneId,
        handle: stoneConfig.handle,
        state: command.state,
        cleanup: commands.cleanup,
        promise: commands.promise
      };
    }
    else if (command.commandName === 'multiSwitch') {
      payload = {
        crownstoneId: stoneConfig.crownstoneId,
        handle: stoneConfig.handle,
        state: command.state,
        intent: command.intent,
        timeout: command.timeout,
        cleanup: commands.cleanup,
        promise: commands.promise
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

    LOG.info("BatchCommand: directCommands from all spheres:", directCommands);
    LOG.info("BatchCommand: meshNetworks from all spheres:", meshNetworks);

    // get sphereIds of the spheres we need to do things in.
    let meshSphereIds = Object.keys(meshNetworks);
    let directSphereIds = Object.keys(directCommands);
    let topicsToScan = [];
    // find all topics in the mesh sphereId
    meshSphereIds.forEach((sphereId) => {
      let meshNetworkIds = Object.keys(meshNetworks[sphereId]);
      meshNetworkIds.forEach((networkId) => {
        topicsToScan.push({ sphereId: sphereId, topic: 'updateMeshNetwork_' + sphereId + '_' + networkId });
      });
    });

    // find all the topics for individual crownstones.
    directSphereIds.forEach((sphereId) => {
      directCommands[sphereId].forEach((command) => {
        topicsToScan.push({ sphereId: sphereId, topic: 'update_' + sphereId + '_' + command.stoneId });
      });
    });

    return topicsToScan;
  }


  /**
   * This will commands one by one to the connected Crownstone.
   * @param connectionInfo
   * @returns {Promise<T>}
   */
  _handleAllActionsForStone(connectionInfo: connectionInfo) {
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
          promise = actionPromise.then(() => {
              performedAction.promise.resolve();
              performedAction.cleanup();
            })
            .catch((err) => {
              performedAction.attempts -= 1;
              if (performedAction.attemps <= 0) {
                performedAction.promise.reject();
                performedAction.cleanup();
              }
              throw err;
            });
        }
      }


      if (promise !== null) {
        promise
          .then(() => {
            // we assume the cleanup of the action(s) has been called.
            return this._handleAllActionsForStone(connectionInfo);
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
  _connectAndPerformCommands() {
    return new Promise((resolve, reject) => {
      let topicsToScan = this._getObjectsToScan();
      if (topicsToScan.length === 0) {
        LOG.info("BatchCommand: No topics to scan during BatchCommandHandler execution");
        resolve();

        // abort the rest of the method.
        return;
      }

      let connectedCrownstone = null;
      // scan for target
      this._searchScan(topicsToScan, -90, 5000)
        .catch((err) => {
          return this._searchScan(topicsToScan, null, 5000)
        })
        .then((connectionInfo : connectionInfo) => {
          connectedCrownstone = connectionInfo;
          LOG.info("BatchCommandHandler: connecting to ", connectionInfo);
          return BluenetPromiseWrapper.connect(connectionInfo.handle);
        })
        .then(() => {
          LOG.info("BatchCommandHandler: Connected to ", connectedCrownstone);
          return this._handleAllActionsForStone(connectedCrownstone);
        })
        .then(() => {
          // check if we should to add a keepalive since we're connected anyway
          if (KeepAliveHandler.timeUntilNextTrigger() < 0.5 * KEEPALIVE_INTERVAL * 1000 ) {
            KeepAliveHandler.fireTrigger();
            return this._handleAllActionsForStone(connectedCrownstone)
          }
        })
        .then(() => {
          return BluenetPromiseWrapper.disconnect();
        })
        .then(() => {
          if (Object.keys(this.commands).length > 0) {
            return this._connectAndPerformCommands();
          }
        })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          LOG.error("ERROR DURING EXECUTE", err);
          BluenetPromiseWrapper.phoneDisconnect().catch((err) => {});
          reject();
        });
    })
  }


  /**
   * @param { Boolean } priority        //  this will move any command to the top of the queue
   */
  execute(priority = true) : Promise<any> {
    LOG.info("BatchCommand: Requesting execute");
    if (this.executing) {
      LOG.info("BatchCommand: Denied; pending.");
      return new Promise((resolve, reject) => { resolve() });
    }

    this.executing = true;

    LOG.info("BatchCommand: Scheduling");
    let actionPromise = () => {
      LOG.info("BatchCommand: Executing!");
      return this._connectAndPerformCommands()
        .then(() => {this.executing = false})
        .catch((err) => {this.executing = false; throw err;});
    };

    let details = {from: 'BatchCommandHandler: executing.'};
    if (priority) {
      return BlePromiseManager.registerPriority(actionPromise, details);
    }
    else {
      return BlePromiseManager.register(actionPromise, details);
    }
  }



  /**
   * return Promise which will resolve to a handle to connect to.
   * @private
   */
  _searchScan(objectsToScan : any[], rssiThreshold = null, timeout = 5000) {
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

        reject(new Error("No stones found before timeout."));
      }, timeout, 'Looking for target...');


      // cleanup timeout
      objectsToScan.forEach((topic) => {
        // data: { handle: stone.config.handle, id: stoneId, rssi: rssi }
        unsubscribeListeners.push( eventBus.on(topic.topic, (data) => {
          if (rssiThreshold === null || data.rssi > rssiThreshold) {
            // remove the listeners
            cleanup();

            // remove cleanup callback
            clearCleanupCallback();

            // resolve with the handle.
            resolve({
              stoneId: data.handle,
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