import { BlePromiseManager } from './BlePromiseManager'
import { BluenetPromiseWrapper, NativeBus, Bluenet, INTENTS } from '../native/Proxy';
import { LOG } from '../logging/Log'
import { Scheduler } from './Scheduler'
import { eventBus } from '../util/eventBus'
import { HIGH_FREQUENCY_SCAN_MAX_DURATION, KEEPALIVE_INTERVAL } from '../ExternalConfig'
import { Util } from '../util/Util'


export class MeshHelper {
  store : any;
  sphereId : any;
  meshNetworkId : any;
  meshInstruction : any;
  targets : any;
  _containedPromises : any;

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
    targets = { ...targets, ...this._getTargetsFromCommands(this.meshInstruction.setSwitchState)};
    targets = { ...targets, ...this._getTargetsFromCommands(this.meshInstruction.multiSwitch)};

    if (Object.keys(targets).length > 0) {
      return targets;
    }

    targets = { ...targets, ...this._getTargetsFromCommands(this.meshInstruction.keepAliveState)};
    targets = { ...targets, ...this._getTargetsFromCommands(this.meshInstruction.keepAlive)};

    if (Object.keys(targets).length > 0) {
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
          .then((handle : string) => {
            return BluenetPromiseWrapper.connect(handle)
          })
          .then(() => {
            return this._handleSetSwitchStateCommands();
          })
          .then(() => {
            return this._handleMultiSwitchCommands();
          })
          .then(() => {
            return this._handleOtherCommands();
          })
          .then(() => {
            return this._handleKeepAliveCommands();
          })
          .then(() => {
            return BluenetPromiseWrapper.disconnect();
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
            BluenetPromiseWrapper.phoneDisconnect().then(() => {
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

  _handleMultiSwitchCommands() {
    // TODO: check adding additional keepAlive if none is provided.

    if (this.meshInstruction.multiSwitch.length > 0) {
      let multiSwitchInstructions = this.meshInstruction.multiSwitch;
      //   // get data from set
      //   let stoneKeepAlivePackets = [];
      //   let timeout = 2.5*KEEPALIVE_INTERVAL;
      //   keepAliveInstructions.forEach((instruction) => {
      //     if (instruction.crownstoneId !== undefined && instruction.timeout !== undefined && instruction.state !== undefined && instruction.changeState !== undefined) {
      //       // add the promise of this part of the payload to the list that we will need to resolve or reject
      //       this._containedPromises.push( instruction.promise );
      //
      //       timeout = Math.max(timeout, instruction.timeout);
      //       stoneKeepAlivePackets.push({crownstoneId: instruction.crownstoneId, action: instruction.changeState, state: instruction.state})
      //     }
      //     else {
      //       LOG.error("MeshHelper: Invalid keepAlive instruction, required crownstoneId, timeout, state, changeState. Got:", instruction);
      //     }
      //   });
      //
      //   // update the used channels.
      //   LOG.mesh('MeshHelper: Dispatching ', 'keepAliveState', stoneKeepAlivePackets);
      //   return BluenetPromiseWrapper.meshKeepAliveState(timeout, stoneKeepAlivePackets);
      // }
      // else if (this.meshInstruction.keepAlive.length > 0) {
      //   LOG.mesh('MeshHelper: Dispatching meshKeepAlive');
      //
      //   // add the promise of this part of the payload to the list that we will need to resolve or reject when the mesh message is delivered.
      //   // these promises are loaded into the handler when load called.
      //   this.meshInstruction.keepAlive.forEach((instruction) => {
      //     this._containedPromises.push( instruction.promise );
      //   });
      //
      //   return BluenetPromiseWrapper.meshKeepAlive();
    }
    return new Promise((resolve, reject) => {resolve()});
  }

  _handleSetSwitchStateCommands() {
    return new Promise((resolve, reject) => {
      let switchStateInstructions = this.meshInstruction.setSwitchState;


      // OLD: requires new implementation
      // if (switchStateInstructions.length > 1) {
      //   // get data from set
      //   let stoneSwitchPackets = [];
      //   switchStateInstructions.forEach((instruction) => {
      //     if (instruction.crownstoneId !== undefined && instruction.timeout !== undefined && instruction.state !== undefined && instruction.intent !== undefined) {
      //       // add the promise of this part of the payload to the list that we will need to resolve or reject
      //       this._containedPromises.push( instruction.promise );
      //
      //       // add the this part of the payload to the message
      //       stoneSwitchPackets.push({crownstoneId: instruction.crownstoneId, timeout: instruction.timeout, state: instruction.state, intent: instruction.intent})
      //     }
      //     else {
      //       LOG.error("MeshHelper: Invalid multiSwitch instruction, required crownstoneId, timeout, state, intent. Got:", instruction);
      //     }
      //   });
      //
      //   // update the used channels.
      //   if (stoneSwitchPackets.length > 0) {
      //     LOG.mesh('MeshHelper: Dispatching ', 'multiSwitch', stoneSwitchPackets);
      //     return BluenetPromiseWrapper.multiSwitch(stoneSwitchPackets);
      //   }
      //   return new Promise((resolve, reject) => { reject("No switchStates to apply!") });
      // }
      // else if (switchStateInstructions.length === 1) {
      //   let instruction = switchStateInstructions[0];
      //
      //   if (instruction.crownstoneId !== undefined && instruction.state !== undefined && instruction.intent !== undefined) {
      //     // push the command over the mesh to a single target.
      //     LOG.mesh('MeshHelper: Dispatching ', 'meshCommandSetSwitchState', [instruction.crownstoneId], instruction.state, intent);
      //     return BluenetPromiseWrapper.meshCommandSetSwitchState([instruction.crownstoneId], instruction.state, intent);
      //   }
      //   else {
      //     LOG.error("MeshHelper: Invalid meshCommandSetSwitchState instruction, required crownstoneId, state, intent. Got:", instruction);
      //     return new Promise((resolve, reject) => { reject("No switchState to apply!") });
      //   }
      // }
      //
      // Promise.all(promises).then(() => {resolve()}).catch((err) => {reject(err);})
    })
  }

  _handleOtherCommands() {
    return new Promise((resolve, reject) => {
      // LOG.mesh('MeshHelper: Other commands are not implemented.');
      resolve();
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
        if (instruction.crownstoneId !== undefined && instruction.timeout !== undefined && instruction.state !== undefined && instruction.changeState !== undefined) {
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
      LOG.mesh('MeshHelper: Dispatching ', 'keepAliveState', stoneKeepAlivePackets);
      return BluenetPromiseWrapper.meshKeepAliveState(timeout, stoneKeepAlivePackets);
    }
    else if (this.meshInstruction.keepAlive.length > 0) {
      LOG.mesh('MeshHelper: Dispatching meshKeepAlive');

      // add the promise of this part of the payload to the list that we will need to resolve or reject when the mesh message is delivered.
      // these promises are loaded into the handler when load called.
      this.meshInstruction.keepAlive.forEach((instruction) => {
        this._containedPromises.push( instruction.promise );
      });

      return BluenetPromiseWrapper.meshKeepAlive();
    }
    return new Promise((resolve, reject) => {resolve()});
  }
}