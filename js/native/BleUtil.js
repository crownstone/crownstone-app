import { BlePromiseManager } from '../logic/BlePromiseManager'
import { BluenetPromises, NativeBus, Bluenet, INTENTS } from './Proxy';
import { LOG } from '../logging/Log'
import { Scheduler } from '../logic/Scheduler'
import { eventBus } from '../util/eventBus'
import { HIGH_FREQUENCY_SCAN_MAX_DURATION, KEEPALIVE_INTERVAL } from '../ExternalConfig'
import { getUUID, Util } from '../util/Util'


export const BleUtil = {
  pendingSearch: {},
  pendingSetupSearch: {},
  highFrequencyScanUsers: {},

  _cancelSearch: function(stateContainer) {
    if (stateContainer.timeout) {
      clearTimeout(stateContainer.timeout);
    }
    if (stateContainer.unsubscribe) {
      stateContainer.unsubscribe();
    }
    delete stateContainer.unsubscribe;
    delete stateContainer.timeout;
  },
  cancelAllSearches: function() {
    this.cancelSearch();
    this.cancelSetupSearch();
  },
  cancelSearch:        function() { this._cancelSearch(this.pendingSearch); },
  cancelSetupSearch:   function() { this._cancelSearch(this.pendingSetupSearch); },


  getNearestSetupCrownstone: function(timeoutMilliseconds) {
    this.cancelSetupSearch();
    return this._getNearestCrownstoneFromEvent(NativeBus.topics.nearestSetup, this.pendingSetupSearch, timeoutMilliseconds)
  },

  getNearestCrownstone: function(timeoutMilliseconds) {
    this.cancelSearch();
    return this._getNearestCrownstoneFromEvent(NativeBus.topics.nearest, this.pendingSearch, timeoutMilliseconds)
  },

  _getNearestCrownstoneFromEvent: function(event, stateContainer, timeoutMilliseconds = 10000) {
    LOG.debug("_getNearestCrownstoneFromEvent: LOOKING FOR NEAREST");
    return new Promise((resolve, reject) => {
      let measurementMap = {};
      let highFrequencyRequestUUID = getUUID();
      this.startHighFrequencyScanning(highFrequencyRequestUUID);

      let sortingCallback = (nearestItem) => {
        if (typeof nearestItem == 'string') {
          nearestItem = JSON.parse(nearestItem);
        }

        LOG.info("_getNearestCrownstoneFromEvent: nearestItem", nearestItem, event);

        if (measurementMap[nearestItem.handle] === undefined) {
          measurementMap[nearestItem.handle] = {count: 0, rssi: nearestItem.rssi};
        }

        measurementMap[nearestItem.handle].count += 1;

        if (measurementMap[nearestItem.handle].count == 3) {
          LOG.info('_getNearestCrownstoneFromEvent: RESOLVING', nearestItem);
          this._cancelSearch(stateContainer);
          this.stopHighFrequencyScanning(highFrequencyRequestUUID);
          resolve(nearestItem);
        }
      };

      stateContainer.unsubscribe = NativeBus.on(event, sortingCallback);

      // if we cant find something in 10 seconds, we fail.
      stateContainer.timeout = setTimeout(() => {
        this.stopHighFrequencyScanning(highFrequencyRequestUUID);
        this._cancelSearch(stateContainer);
        reject("_getNearestCrownstoneFromEvent: Nothing Near");
      }, timeoutMilliseconds);
    })
  },

  detectCrownstone: function(stoneHandle) {
    this.cancelSearch();
    return new Promise((resolve, reject) => {
      let count = 0;
      let highFrequencyRequestUUID = getUUID();
      this.startHighFrequencyScanning(highFrequencyRequestUUID);

      let cleanup = {unsubscribe:()=>{}, timeout: undefined};
      let sortingCallback = (advertisement) => {
        LOG.info("detectCrownstone: Advertisement in detectCrownstone", stoneHandle, advertisement);

        if (advertisement.handle === stoneHandle)
          count += 1;

        // three consecutive measurements before timeout is OK
        if (count == 2)
          finish(advertisement);
      };

      let finish = (advertisement) => {
        clearTimeout(cleanup.timeout);
        cleanup.unsubscribe();
        this.stopHighFrequencyScanning(highFrequencyRequestUUID);
        resolve(advertisement.setupPackage);
      };

      LOG.debug("detectCrownstone: Subscribing TO ", NativeBus.topics.advertisement);
      cleanup.unsubscribe = NativeBus.on(NativeBus.topics.advertisement, sortingCallback);

      // if we cant find something in 10 seconds, we fail.
      cleanup.timeout = setTimeout(() => {
        this.stopHighFrequencyScanning(highFrequencyRequestUUID);
        cleanup.unsubscribe();
        reject(false);
      }, 10000);
    })
  },

  getProxy: function (bleHandle, sphereId, stoneId) {
    return new SingleCommand(bleHandle, sphereId, stoneId);
  },

  // getMeshProxy: function (bleHandle) {
  //   return new MeshCommand(bleHandle)
  // },

  /**
   *
   * @param id
   * @param noTimeout   | Bool or timeout in millis
   * @returns {function()}
   */
  startHighFrequencyScanning: function(id, noTimeout = false) {
    let enableTimeout = noTimeout === false;
    let timeoutDuration = HIGH_FREQUENCY_SCAN_MAX_DURATION;
    if (typeof noTimeout === 'number' && noTimeout > 0) {
      timeoutDuration = noTimeout;
      enableTimeout = true;
    }

    if (this.highFrequencyScanUsers[id] === undefined) {
      if (Object.keys(this.highFrequencyScanUsers).length === 0) {
        LOG.debug("Starting HF Scanning!");
        Bluenet.startScanningForCrownstones();
      }
      this.highFrequencyScanUsers[id] = {timeout: undefined};
    }

    if (enableTimeout === true) {
      clearTimeout(this.highFrequencyScanUsers[id].timeout);
      this.highFrequencyScanUsers[id].timeout = setTimeout(() => {
        this.stopHighFrequencyScanning(id);
      }, timeoutDuration);
    }

    return () => { this.stopHighFrequencyScanning(id) };
  },

  stopHighFrequencyScanning: function(id) {
    if (this.highFrequencyScanUsers[id] !== undefined) {
      clearTimeout(this.highFrequencyScanUsers[id].timeout);
      delete this.highFrequencyScanUsers[id];
      if (Object.keys(this.highFrequencyScanUsers).length === 0) {
        LOG.debug("Stopping HF Scanning!");
        Bluenet.startScanningForCrownstonesUniqueOnly();
      }
    }
  }

};

/**
 * This can be used to batch commands over the mesh or 1:1 to the Crownstones.
 */
export class BatchCommand {
  constructor(store, sphereId) {
    this.commands = [];

    this.store = store;
    this.sphereId = sphereId;
  }


  /**
   *
   * @param { Object } stone          // Redux Stone Object
   * @param { String } stoneId        // StoneId,
   * @param { String } commandString  // String of a command that is in the BluenetPromise set
   * @param { Array }  props          // Array of props that are fed into the BluenetPromise
   */
  load(stone, stoneId, commandString, props = []) {
    return new Promise((resolve, reject) => {
      this.commands.push({handle: stone.config.handle, stoneId: stoneId, stone:stone, commandString:commandString, props: props, promise:{resolve, reject}})
    });
  }


  _extractTodo() {
    let directCommands = [];
    let meshNetworks = {};

    this.commands.forEach((todo) => {
      let stoneConfig = todo.stone.config;
      // mesh not supported / no mesh detected for this stone
      if (stoneConfig.meshNetworkId === null || stoneConfig.meshNetworkId === undefined) {
        // handle this 1:1
        directCommands.push({ ...todo });
      }
      else {
        meshNetworks[stoneConfig.meshNetworkId] = {
          keepAlive:[],
          keepAliveState:[],
          setSwitchState: {},
          other: []
        };
        // create arrays for each of the intents
        let intentKeys = Object.keys(INTENTS);
        intentKeys.forEach((key) => {
          meshNetworks[stoneConfig.meshNetworkId].setSwitchState[INTENTS[key]] = [];
        });

        if (todo.commandString === 'keepAlive') {
          meshNetworks[stoneConfig.meshNetworkId].keepAlive.push({handle: stoneConfig.handle, props: [], promise: todo.promise});
        }
        else if (todo.commandString === 'keepAliveState') {
          meshNetworks[stoneConfig.meshNetworkId].keepAliveState.push({
            crownstoneId: stoneConfig.crownstoneId,
            handle: stoneConfig.handle,
            changeState: todo.props[0],
            state: todo.props[1],
            timeout: todo.props[2],
            promise: todo.promise
          });
        }
        else if (todo.commandString === 'setSwitchState') {
          meshNetworks[stoneConfig.meshNetworkId].setSwitchState[todo.props[2]].push({
            crownstoneId: stoneConfig.crownstoneId,
            handle: stoneConfig.handle,
            state: todo.props[0],
            timeout: todo.props[1],
            promise: todo.promise
          });
        }
        else {
          // handle the command via the mesh or 1:1
          // meshNetworks[stoneConfig.meshNetworkId].other.push({ ...todo });

          // currently we forward all other commands to direct calls, todo: over mesh.
          directCommands.push({ ...todo });
        }
      }
    });

    return { directCommands, meshNetworks };
  }

  /**
   * @param { Object } batchSettings    //  {
   *                                    //    immediate: Boolean     // do not search before handling command.
   *                                    //    rssiThreshold: Number  // when using search, minimum rssi threshold to start
   *                                    //    highSpeed: Boolean     // if true, the search is performed with high speed scanning instead of a db lookup.
   *                                    //    timeout: Number        // Amount of time a search can take.
   *                                    //    timesToRetry: Number   // Amount of times we should retry a search or command.
   *                                    //  }
   * @param { Boolean } priority        //  this will move any command to the top of the queue
   */
  execute(batchSettings = {}, priority = true) {
    let { directCommands, meshNetworks } = this._extractTodo();
    let promises = [];

    let meshNetworkIds = Object.keys(meshNetworks);
    meshNetworkIds.forEach((networkId) => {
      let helper = new MeshHelper(this.store, this.sphereId, networkId, meshNetworks[networkId]);
      promises.push(helper.process(batchSettings, priority));
    });

    directCommands.forEach((command) => {
      let singleCommand = new SingleCommand(command.handle, this.sphereId, command.stoneId);
      LOG.info("BatchCommand: performing direct command:", command.commandString, command.props);
      promises.push(
        singleCommand.searchAndPerform(batchSettings, this.store.getState(), BluenetPromises[command.commandString], command.props, priority)
          .then(() => {
            command.promise.resolve();
          })
          .catch((err) => {
            command.promise.reject(err);
          })
      );
    });

    return Promise.all(promises);
  }

}


class MeshHelper {
  constructor(store, sphereId, meshNetworkId, meshInstruction) {
    this.store = store;
    this.sphereId = sphereId;
    this.meshNetworkId = meshNetworkId;
    this.meshInstruction = meshInstruction;
    this.targets = this._getConnectionTargets();

    // this.performAdditionalKeepAlive = ( this.meshInstruction.keepAlive.length > 0 || this.meshInstruction.keepAliveState.length > 0 ) === false;
  }

  /**
   * Search the commands for all possible targets.
   * @param commands
   * @returns {{}}targets
   * @private
   */
  _getTargetsFromCommands(commands) {
    let targets = {};
    if (commands && Array.isArray(commands)) {
      commands.forEach((command) => {
        if (command.handle) {
          targets[command.handle] = true;
        }
      })

    }
    return targets
  }

  /**
   * This method return an object of handles as keys. It prioritizes handles that are used for more responsive events.
   * @returns {{}}
   * @private
   */
  _getConnectionTargets() {
    let targets = {};
    targets = { ...targets, ...this._getTargetsFromCommands(this.meshInstruction.setSwitchState[INTENTS.manual])};
    targets = { ...targets, ...this._getTargetsFromCommands(this.meshInstruction.setSwitchState[INTENTS.enter])};

    if (Object.keys(targets) > 0) {
      return targets;
    }

    targets = { ...targets, ...this._getTargetsFromCommands(this.meshInstruction.setSwitchState[INTENTS.exit])};
    targets = { ...targets, ...this._getTargetsFromCommands(this.meshInstruction.setSwitchState[INTENTS.sphereEnter])};
    targets = { ...targets, ...this._getTargetsFromCommands(this.meshInstruction.setSwitchState[INTENTS.sphereExit])};

    if (Object.keys(targets) > 0) {
      return targets;
    }

    targets = { ...targets, ...this._getTargetsFromCommands(this.meshInstruction.keepAliveState)};
    targets = { ...targets, ...this._getTargetsFromCommands(this.meshInstruction.keepAlive)};

    if (Object.keys(targets) > 0) {
      return targets;
    }

    targets = { ...targets, ...this._getTargetsFromCommands(this.meshInstruction.other)};

    return targets;
  }

  /**
   * @param { Object } searchSettings //  {
   *                                  //    immediate: Boolean     // do not search before handling command.
   *                                  //    rssiThreshold: Number  // when using search, minimum rssi threshold to start
   *                                  //    highSpeed: Boolean     // if true, the search is performed with high speed scanning instead of a db lookup.
   *                                  //    timeout: Number        // Amount of time a search can take.
   *                                  //    timesToRetry: Number   // Amount of times we should retry a search or command.
   *                                  //  }
   * @param { Number } rssiThreshold
   */
  _search(searchSettings, rssiThreshold = null) {
    if (searchSettings.immediate === true) {
      return this._searchDatabase(rssiThreshold)
    }
    else {
      let topic = 'updateMeshNetwork_'+this.sphereId+this.meshNetworkId;
      return this._searchScan(this.store.getState(), topic, rssiThreshold, searchSettings.timeout);
    }
  }

  /**
   * return Promise which will resolve to a handle to connect to.
   * @private
   */
  _searchScan(state, topic, rssiThreshold = null, timeout = 5000) {
    let stones = Util.mesh.getStonesInNetwork(state, this.sphereId, this.meshNetworkId);

    return new Promise((resolve, reject) => {
      // data: { handle: stone.config.handle, id: stoneId, rssi: rssi }
      let unsubscribeListener = eventBus.on(topic, (data) => {
        if (rssiThreshold === null || data.rssi > rssiThreshold) {
          // remove current listener
          unsubscribeListener();

          // remove cleanup callback
          clearCleanupCallback();

          // resolve with the handle.
          resolve(data.handle);
        }
      });

      // scheduled timeout in case the
      let clearCleanupCallback = Scheduler.scheduleCallback(() => {
        // remove the listener
        unsubscribeListener();

        reject(new Error("No stones found before timeout."));
      }, timeout, 'Looking for MeshNetwork:'+this.meshNetworkId)
    })
  }

  /**
   * return Promise which will resolve to a handle to connect to.
   * @private
   */
  _searchDatabase(rssiThreshold = null) {
    return new Promise((resolve, reject) => {
      let state = this.store.getState();
      let stones = Util.mesh.getStonesInNetwork(state, this.sphereId, this.meshNetworkId, rssiThreshold);

      if (stones.length === 0) {
        reject(new Error("No stones available with threshold: " + rssiThreshold));
      }
      else {
        let bestRssi = -1000;
        let bestRssiStoneHandle = null;
        let bestTargetRssi = -1000;
        let bestTargetRssiStoneHandle = null;

        for (let i = 0; i < stones.length; i++) {
          if (stones[i].stone.config.handle) {
            if (this.targets[stones[i].id] === true) {
              if (bestTargetRssi < stones[i].stone.config.rssi) {
                bestTargetRssi = stones[i].stone.config.rssi;
                bestTargetRssiStoneHandle = stones[i].stone.config.handle;
              }
            }
            if (bestRssi < stones[i].stone.config.rssi) {
              bestRssi = stones[i].stone.config.rssi;
              bestRssiStoneHandle = stones[i].stone.config.handle;
            }
          }
        }

        // if one of the targets is in range, see if we want to connect to that.
        if (bestTargetRssiStoneHandle !== null) {
          // if the best rssi is really much better than the best target, use the best one for a more reliable connection
          if (bestRssi - bestTargetRssi > 20 && bestTargetRssiStoneHandle < -85) {
            resolve(bestRssiStoneHandle);
          }
          else {
            resolve(bestTargetRssiStoneHandle);
          }
        }
        else {
          resolve(bestRssiStoneHandle)
        }
      }
    })
  }

  /**
   * Process the mesh request
   * @param { Object } batchSettings      //  {
   *                                      //    immediate: Boolean     // do not search before handling command.
   *                                      //    rssiThreshold: Number  // when using search, minimum rssi threshold to start
   *                                      //    highSpeed: Boolean     // if true, the search is performed with high speed scanning instead of a db lookup.
   *                                      //    timeout: Number        // Amount of time a search can take.
   *                                      //    timesToRetry: Number   // Amount of times we should retry a search or command.
   *                                      //  }
   * @param { Boolean } [priorityCommand] // moves the command to the top of the queue
   * @param { Number }  [attempt]         // if the attempt number < timesToRetry, we retry
   */
  process(batchSettings, priorityCommand = true, attempt = 0) {
    let actionPromise = () => {
      return new Promise((resolve, reject) => {
        this._containedPromises = [];
        this._search(batchSettings, batchSettings.rssiThreshold)
          .catch(() => {
            // could not find any node withing a -90 threshold
            LOG.error('MeshHelper: Could not find any nodes of the mesh network:', this.meshNetworkId, 'within -90 db. Attempting removal of threshold...');
            return this._search(batchSettings, null);
          })
          .catch(() => {
            LOG.error('MeshHelper: Can not connect to any node in the mesh network: ', this.meshNetworkId);
            throw new Error('Can not connect to any node in the mesh network: ' + this.meshNetworkId);
          })
          .then((handle) => {
            return BluenetPromises.connect(handle)
          })
          .then(() => {
            return this._handleSetSwitchStateCommands();
          })
          .then(() => {
            return this._handleOtherCommands();
          })
          .then(() => {
            return this._handleKeepAliveCommands();
          })
          .then(() => {
            return BluenetPromises.disconnect();
          })
          .then(() => {
            LOG.mesh('MeshHelper: completed disconnecting, resolving children');
            this._resolveContainedPromises();
          })
          .catch((err) => {
            LOG.error("MeshHelper: mesh command Error:", err);
            if (batchSettings.timesToRetry !== undefined && batchSettings.timesToRetry > attempt) {
              LOG.mesh('MeshHelper: failed (', err, '). Attempting retry.');
              return this.process(batchSettings, priorityCommand, attempt + 1);
            }
            else {
              return new Promise((resolveOnRetry, rejectOnRetry) => {
                rejectOnRetry(err)
              })
            }
          })
          .then(() => {
            LOG.mesh('MeshHelper: completed. Resolving.');
            resolve();
          })
          .catch((err) => {
            this._rejectContainedPromises();
            BluenetPromises.phoneDisconnect().then(() => {
              reject(err)
            }).catch(() => {
              reject(err)
            });
          });
      })
    };

    let details = {from: 'MeshHelper: connecting to ' + this.meshNetworkId + '.'};
    if (priorityCommand) {
      return BlePromiseManager.registerPriority(actionPromise, details);
    }
    else {
      return BlePromiseManager.register(actionPromise, details);
    }
  }

  _resolveContainedPromises() {
    this._containedPromises.forEach((promise) => {
      promise.resolve();
    })
  }

  _rejectContainedPromises() {
    this._containedPromises.forEach((promise) => {
      promise.reject();
    })
  }

  _handleSetSwitchStateCommands() {
    let switchStateInstructions = this.meshInstruction.setSwitchState;

    let orderedIntents = [INTENTS.manual, INTENTS.enter, INTENTS.exit, INTENTS.sphereEnter, INTENTS.sphereExit];

    for (let i = 0; i < orderedIntents.length; i++) {
      let intent = orderedIntents[i];
      this._handleSetSwitchState(switchStateInstructions[intent], intent);
    }
  }

  _handleSetSwitchState(instructionSet, intent) {
    if (instructionSet.length > 1) {
      // get data from set
      let stoneSwitchPackets = [];
      instructionSet.forEach((instruction) => {
        if (instruction.crownstoneId && instruction.timeout && instruction.state) {
          // add the promise of this part of the payload to the list that we will need to resolve or reject
          this._containedPromises.push( instruction.promise );

          // add the this part of the payload to the message
          stoneSwitchPackets.push({crownstoneId: instruction.crownstoneId, timeout: instruction.timeout, state: instruction.state})
        }
        else {
          LOG.error("MeshHelper: Invalid instruction, required crownstoneId, timeout, state. Got:", instruction);
        }
      });

      // update the used channels.
      LOG.mesh('MeshHelper: Dispatching ', 'multiSwitch', intent, stoneSwitchPackets);
      return BluenetPromises('multiSwitch', stoneSwitchPackets, intent);
    }
    else if (instructionSet.length === 1) {
      let instruction = instructionSet[0];

      // push the command over the mesh to a single target.
      LOG.mesh('MeshHelper: Dispatching ', 'meshCommandSetSwitchState', [instruction.crownstoneId], instruction.state, intent);
      return BluenetPromises('meshCommandSetSwitchState', [instruction.crownstoneId], instruction.state, intent);
    }
  }

  _handleOtherCommands() {
    return new Promise((resolve, reject) => {
      LOG.mesh('MeshHelper: Other commands are not implemented.');
    })
  }

  _handleKeepAliveCommands() {
    // TODO: check adding additional keepAlive if none is provided.

    if (this.meshInstruction.keepAliveState.length > 0) {
      let keepAliveInstructions = this.meshInstruction.keepAliveState;
      // get data from set
      let stoneKeepAlivePackets = [];
      let timeout = 2.5*KEEPALIVE_INTERVAL;
      keepAliveInstructions.forEach((instruction) => {
        if (instruction.crownstoneId && instruction.timeout && instruction.state && instruction.changeState) {
          // add the promise of this part of the payload to the list that we will need to resolve or reject
          this._containedPromises.push( instruction.promise );

          timeout = Math.max(timeout, instruction.timeout);
          stoneKeepAlivePackets.push({crownstoneId: instruction.crownstoneId, action: instruction.changeState, state: instruction.state})
        }
        else {
          LOG.error("MeshHelper: Invalid keepAlive instruction, required crownstoneId, timeout, state, changeState. Got:", instruction);
        }
      });

      // update the used channels.
      LOG.mesh('MeshHelper: Dispatching ', 'keepAlive', stoneKeepAlivePackets);
      return BluenetPromises('meshKeepAliveState', timeout, stoneKeepAlivePackets);
    }
    else if (this.meshInstruction.keepAlive.length > 0) {
      LOG.mesh('MeshHelper: Dispatching meshKeepAlive');

      // add the promise of this part of the payload to the list that we will need to resolve or reject
      this.meshInstruction.keepAlive.forEach((instruction) => {
          this._containedPromises.push( instruction.promise );
      });

      return BluenetPromises('meshKeepAlive');
    }
    return new Promise((resolve, reject) => {resolve()});
  }
}



class SingleCommand {
  constructor(handle, sphereId, stoneId) {
    this.sphereId = sphereId;
    this.stoneId = stoneId;
    this.handle = handle;
  }

  /**
   * Connect, perform action, disconnect
   * @param action --> a bleAction from Proxy
   * @param props  --> array of properties
   * @returns {*}
   */
  perform(action, props = []) {
    LOG.info("SingleCommand: connecting to " +  this.handle + " doing this: ", action, " with props ", props);
    return this.performCommand(action,props, false);
  }

  performPriority(action, props = []) {
    LOG.info("SingleCommand: HIGH PRIORITY: connecting to " +  this.handle + " doing this: ", action, " with props ", props);
    return this.performCommand(action, props, true)
  }


  /**
   *
   * @param { Object } searchSettings   //  {
   *                                    //    immediate: Boolean     // do not search before handling command.
   *                                    //    rssiThreshold: Number  // when using search, minimum rssi threshold to start
   *                                    //    highSpeed: Boolean     // if true, the search is performed with high speed scanning instead of a db lookup.
   *                                    //    timeout: Number        // Amount of time a search can take.
   *                                    //    timesToRetry: Number   // Amount of times we should retry a search or command.
   *                                    //  }
   * @param { Object }   state          // Redux state
   * @param { Function } action         // BluenetPromise function
   * @param { Array }    props
   * @param { Boolean }  priorityCommand
   */
  searchAndPerform(searchSettings, state, action, props, priorityCommand) {
    if (searchSettings.immediate === true) {
      LOG.verbose("SingleCommand: Immediate trigger requested");
      let rssiThreshold = searchSettings.rssiThreshold || -90;
      if (state.spheres[this.sphereId].stones[this.stoneId].config.disabled === false) {
        if (state.spheres[this.sphereId].stones[this.stoneId].config.rssi >= rssiThreshold) {
          LOG.info('SingleCommand: Performing immediate action. Known Rssi = ', state.spheres[this.sphereId].stones[this.stoneId].config.rssi);
          return this.performCommand(action, props, priorityCommand);
        }
        else {
          LOG.warn('SingleCommand: Performing immediate action with less than target RSSI (',rssiThreshold, ') using:', state.spheres[this.sphereId].stones[this.stoneId].config.rssi);
          return this.performCommand(action, props, priorityCommand);
        }
      }
      else {
        // search regardless?
        return new Promise((resolve, reject) => {reject(new Error("Can not connect to disabled Crownstone"))});
      }
    }
    else {
      LOG.verbose("SingleCommand: Search trigger requested", action);
      let topic = 'update_' + this.sphereId + '_' + this.stoneId;
      return this._searchScan(topic, searchSettings.rssiThreshold, searchSettings.timeout)
        .catch(() => {
          // could not find any node withing a -90 threshold
          LOG.warn('SingleCommand: Could not find the target crownstone within -90 db. Attempting removal of threshold...');
          return this._search(searchSettings, null);
        })
        .catch(() => {
          LOG.error('SingleCommand: Can not connect to the target Crownstone.');
          throw new Error('Can not connect to the target Crownstone.');
        })
        .then((handle) => {
          LOG.info('SingleCommand: Found Crownstone.');
          return this.performCommand(action, props, priorityCommand);
        })
    }
  }


  _searchScan(topic, rssiThreshold = null, timeout = 5000) {
    return new Promise((resolve, reject) => {
      // data: { handle: stone.config.handle, id: stoneId, rssi: rssi }
      let unsubscribeListener = eventBus.on(topic, (data) => {
        if (rssiThreshold === null || data.rssi > rssiThreshold) {
          // remove current listener
          unsubscribeListener();

          // remove cleanup callback
          clearCleanupCallback();

          // resolve with the handle.
          resolve(data.handle);
        }
      });

      // scheduled timeout in case the
      let clearCleanupCallback = Scheduler.scheduleCallback(() => {
        // remove the listener
        unsubscribeListener();

        reject(new Error("No stones found before timeout."));
      }, timeout, 'Looking for Crownstone');
    })
  }

  performCommand(action, props = [], priorityCommand) {
    let actionPromise = () => {
      if (this.handle) {
        return BluenetPromises.connect(this.handle)
          .then(() => { LOG.info("SingleCommand: connected, performing: ", action, props); return action.apply(this, props); })
          .catch((err) => {
            if (err === 'NOT_CONNECTED') {
              return BluenetPromises.connect(this.handle)
                .then(() => { LOG.info("SingleCommand: second attempt, performing: ", action, props); return action.apply(this, props); })
            }
          })
          .then(() => { LOG.info("SingleCommand: completed", action, 'disconnecting'); return BluenetPromises.disconnect(); })
          .catch((err) => {
            LOG.error("SingleCommand: BLE Single command Error:", err);
            return new Promise((resolve,reject) => {
              BluenetPromises.phoneDisconnect().then(() => { reject(err) }).catch(() => { reject(err) });
            })
          })
      }
      else {
        return new Promise((resolve, reject) => {
          reject("SingleCommand: cant connect, no handle available.");
        })
      }
    };

    let details = { from: 'SingleCommand: connecting to ' + this.handle + ' doing this: ' + action + ' with props ' + props };

    if (priorityCommand) {
      return BlePromiseManager.registerPriority(actionPromise, details);
    }
    else {
      return BlePromiseManager.register(actionPromise, details);
    }
  }
}











