import { BlePromiseManager } from '../logic/BlePromiseManager'
import { BluenetPromises, NativeBus, Bluenet, INTENTS, MESH_CHANNELS } from './Proxy';
import { LOG } from '../logging/Log'
import { Scheduler } from '../logic/Scheduler'
import { eventBus } from '../util/eventBus'
import { HIGH_FREQUENCY_SCAN_MAX_DURATION } from '../ExternalConfig'
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

  getProxy: function (bleHandle) {
    return new SingleCommand(bleHandle)
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
class BatchCommand {
  constructor(store, sphereId) {
    this.commands = [];

    this.store = store;
    this.sphereId = sphereId;
  }


  /**
   *
   * @param { Object } stone          // Redux Stone Object
   * @param { String } commandString  // String of a command that is in the BluenetPromise set
   * @param { Array }  props          // Array of props that are fed into the BluenetPromise
   */
  load(stone, commandString, props) {
    this.commands.push({handle: stone.config.handle, stone:stone, commandString:commandString, props: props})
  }


  /**
   *
   * @param { Object } searchSettings   //  {
   *                                    //    immediate: Boolean     // do not search before handling command.
   *                                    //    rssiThreshold: Number  // when using search, minimum rssi threshold to start
   *                                    //    highSpeed: Boolean     // if true, the search is performed with high speed scanning instead of a db lookup.
   *                                    //    timeout: Number        // Amount of time a search can take.
   *                                    //  }
   * @param { Boolean } priority        //  this will move any command to the top of the queue
   */
  execute(searchSettings = {}, priority = true) {
    let { directCommands, meshNetworks } = this._extractTodo();

    let meshNetworkIds = Object.keys(meshNetworks);
    meshNetworkIds.forEach((networkId) => {
      let promiseGenerator = () => { return new Promise((resolve, reject) => {

        let helper = new MeshHelper(this.store, this.sphereId, networkId, meshNetworks[networkId]);
        if (searchSettings.immediate === true) {

        }
        else {

        }
      })};

      // search for stone in network, alternatively target stone

      // create payload format

      // send

      // disconnect

      // handle error
    });

    directCommands.forEach((networkId) => {

    });


  }

  _extractTodo() {
    let directCommands = [];
    let meshNetworks = {};

    this.commands.forEach((todo) => {
      let stoneConfig = todo.stone.config;
      // mesh not supported / no mesh detected for this stone
      if (stoneConfig.meshNetworkId === null) {
        // handle this 1:1
        directCommands.push({ ...todo })
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
          meshNetworks[stoneConfig.meshNetworkId].keepAlive.push({handle: stoneConfig.handle});
        }
        else if (todo.commandString === 'keepAliveState') {
          meshNetworks[stoneConfig.meshNetworkId].keepAliveState.push({
            crownstoneId: stoneConfig.crownstoneId,
            handle: stoneConfig.handle,
            timeout: todo.props.timeout,
            state: todo.props.state,
            changeState: todo.props.changeState,
          });
        }
        else if (todo.commandString === 'setSwitchState') {
          meshNetworks[stoneConfig.meshNetworkId].setSwitchState[todo.props.intent].push({
            crownstoneId: stoneConfig.crownstoneId,
            handle: stoneConfig.handle,
            timeout: todo.props.timeout,
            state: todo.props.state,
          });
        }
        else {
          // handle the command via the mesh or 1:1
          meshNetworks[stoneConfig.meshNetworkId].other.push({ ...todo });
        }
      }
    });

    return { directCommands, meshNetworks };
  }

}


class MeshHelper {
  constructor(store, sphereId, meshNetworkId, meshInstruction) {
    this.store = store;
    this.sphereId = sphereId;
    this.meshNetworkId = meshNetworkId;
    this.meshInstruction = meshInstruction;
    this.targets = this._getConnectionTargets();


    this.channelsUsed = {};
    this.performAdditionalKeepalive = (this.meshInstruction.keepAlive.length > 0 || this.meshInstruction.keepAliveState.length > 0) === false;
  }

  /**
   * Search the commands for all possible targets.
   * @param commands
   * @returns {{}}
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
    targets = { ...targets, ...this._getTargetsFromCommands(this.meshInstruction.setSwitchState[INTENTS.roomEnter])};

    if (Object.keys(targets) > 0) {
      return targets;
    }

    targets = { ...targets, ...this._getTargetsFromCommands(this.meshInstruction.setSwitchState[INTENTS.roomExit])};
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
   *                                  //  }
   * @param { Number } rssiThreshold
   */
  search(searchSettings, rssiThreshold = null) {
    if (searchSettings.immediate === true) {
      return this._searchDatabase(rssiThreshold)
    }
    else {
      return this._searchScan(rssiThreshold, searchSettings.timeout);
    }
  }

  /**
   * return Promise which will resolve to a handle to connect to.
   * @private
   */
  _searchScan(rssiThreshold = null, timeout = 5000) {
    let state = this.store.getState();
    let stones = Util.mesh.getStonesInNetwork(state, this.sphereId, this.meshNetworkId);

    return new Promise((resolve, reject) => {
      // data: { handle: stone.config.handle, id: stoneId, rssi: rssi }
      let unsubscribeListener = eventBus.on('updateMeshNetwork_'+this.sphereId+this.meshNetworkId, (data) => {
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
   * @param { Object } searchSettings  //  {
   *                                   //    immediate: Boolean     // do not search before handling command.
   *                                   //    rssiThreshold: Number  // when using search, minimum rssi threshold to start
   *                                   //    highSpeed: Boolean     // if true, the search is performed with high speed scanning instead of a db lookup.
   *                                   //    timeout: Number        // Amount of time a search can take.
   *                                   //  }
   */
  process(searchSettings) {
    return new Promise((resolve, reject) => {
      this.search(searchSettings, -90)
        .catch(() => {
          // could not find any node withing a -90 threshold
          LOG.error('MeshHelper: Could not find any nodes of the mesh network:', this.meshNetworkId, 'within -90 db. Attempting removal of threshold...');
          return this.search(searchSettings, null);
        })
        .catch(() => {
          LOG.error('MeshHelper: Can not connect to any node in the mesh network: ', this.meshNetworkId);
          throw new Error('Can not connect to any node in the mesh network: ' + this.meshNetworkId);
        })
        .then((handle) => {
          return BluenetPromises.connect(handle)
        })
        .then(() => { return this._handleSetSwitchStateCommands(); })
        .then(() => { return this._handleOtherCommands();          })
        .then(() => { return this._handleKeepAliveCommands();      })
        .then(() => {
          LOG.mesh('MeshHelper: completed disconnecting');
          resolve();
          return BluenetPromises.disconnect();
        })
        .catch((err) => {
          LOG.error("MeshHelper: BLE Single command Error:", err);
          BluenetPromises.phoneDisconnect().then(() => { reject(err) }).catch(() => { reject(err) });
        });

        // first handle the enter events
        //    if connected, process all we can over this connection
        //    we need to do switches, keepalives any time (if t < x)

        // then handle an other

        // then handle a keep alive ( state ? )

        // then loop back around
    })



  }

  _handleSetSwitchStateCommands() {
    let switchStateInstructions = this.meshInstruction.setSwitchState;

    let orderedIntents = [INTENTS.manual, INTENTS.enter, INTENTS.exit, INTENTS.sphereEnter, INTENTS.sphereExit];

    // used to keep track of used channels so we can introduce a delay to ensure propagation
    let channelsUsed = {};

    for (let i = 0; i < orderedIntents.length; i++) {
      let intent = orderedIntents[i];
      this._handleSetSwitchState(switchStateInstructions[intent], intent, channelsUsed);
    }
  }

  _handleSetSwitchState(instructionSet, intent) {
    if (instructionSet.length > 1) {
      // get data from set
      let stoneSwitchPackets = [];
      instructionSet.forEach((instruction) => {
        if (instruction.crownstoneId && instruction.timeout && instruction.state) {
          stoneSwitchPackets.push({crownstoneId: instruction.crownstoneId, timeout: instruction.timeout, state: instruction.state})
        }
        else {
          LOG.error("MeshHelper: Invalid instruction, required crownstoneId, timeout, state. Got:", instruction);
        }
      });

      // update the used channels.
      this.channelsUsed[MESH_CHANNELS.batchSwitch] = new Date().valueOf();
      LOG.mesh('MeshHelper: Dispatching ', 'batchSwitch', intent, stoneSwitchPackets);
      return BluenetPromises('batchSwitch', intent, stoneSwitchPackets);
    }
    else if (instructionSet.length === 1) {
      let instruction = instructionSet[0];

      // update the used channels.
      this.channelsUsed[MESH_CHANNELS.command] = new Date().valueOf();

      // push the command over the mesh to a single target.
      LOG.mesh('MeshHelper: Dispatching ', 'batchCommandSetSwitchState', [instruction.crownstoneId], instruction.state, intent);
      return BluenetPromises('batchCommandSetSwitchState', [instruction.crownstoneId], instruction.state, intent)
    }
  }

  _handleOtherCommands() {
    return new Promise((resolve, reject) => {

    })
  }

  _handleKeepAliveCommands() {
    return new Promise((resolve, reject) => {

    })
  }


  // search

  // construct messages

  // connect

  // send 1

  // keepalive (?)

  // send more
}



class SingleCommand {
  constructor(handle) {
    this.handle = handle;
  }

  /**
   * Connect, perform action, disconnect
   * @param action --> a bleAction from Proxy
   * @param props  --> array of properties
   * @returns {*}
   */
  perform(action, props = []) {
    LOG.info("BLEProxy: connecting to " +  this.handle + " doing this: ", action, " with props ", props);
    return this._perform(action,props, false);
  }

  performPriority(action, props = []) {
    LOG.info("BLEProxy: HIGH PRIORITY: connecting to " +  this.handle + " doing this: ", action, " with props ", props);
    return this._perform(action, props, true)
  }

  _perform(action, props, priorityCommand) {
    let actionPromise = () => {
      if (this.handle) {
        return BluenetPromises.connect(this.handle)
          .then(() => { LOG.info("BLEProxy: connected, performing: ", action); return action.apply(this, props); })
          .then(() => { LOG.info("BLEProxy: completed", action, 'disconnecting'); return BluenetPromises.disconnect(); })
          .catch((err) => {
            LOG.error("BLEProxy: BLE Single command Error:", err);
            return new Promise((resolve,reject) => {
              BluenetPromises.phoneDisconnect().then(() => { reject(err) }).catch(() => { reject(err) });
            })
          })
      }
      else {
        return new Promise((resolve, reject) => {
          reject("BLEProxy: cant connect, no handle available.");
        })
      }
    };

    let details = {from: 'BLEProxy: connecting to ' + this.handle + ' doing this: ' + action + ' with props ' + props};

    if (priorityCommand) {
      return BlePromiseManager.registerPriority(actionPromise, details);
    }
    else {
      return BlePromiseManager.register(actionPromise, details);
    }
  }
}











