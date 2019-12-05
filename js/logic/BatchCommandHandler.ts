import { Util }                  from '../util/Util'
import { BlePromiseManager }     from './BlePromiseManager'
import { BluenetPromiseWrapper } from '../native/libInterface/BluenetPromise';
import { LOGd, LOGe, LOGi, LOGv, LOGw } from '../logging/Log'
import { Scheduler }             from './Scheduler'
import { MeshHelper }            from './MeshHelper'
import { DISABLE_NATIVE, STONE_TIME_REFRESH_INTERVAL } from "../ExternalConfig";
import { StoneUtil }             from "../util/StoneUtil";
import { Permissions }           from "../backgroundProcesses/PermissionManager";
import { CommandManager }        from "./bchComponents/CommandManager";
import { StoneAvailabilityTracker }            from "../native/advertisements/StoneAvailabilityTracker";
import { BROADCAST_ERRORS, BroadcastCommandManager } from "./bchComponents/BroadcastCommandManager";
import { xUtil } from "../util/StandAloneUtil";
import { BCH_ERROR_CODES } from "../Enums";
import { core } from "../core";


/**
 * This can be used to batch commands over the mesh or 1:1 to the Crownstones.
 */
class BatchCommandHandlerClass {
  sphereId  : any;
  activePromiseId : string = null;

  _unsubscribeCloseListener : any = null;
  _removeCloseConnectionTimeout  : any = null;
  _unsubscribeLoadListener  : any = null;

  _commandHandler : CommandManager;

  constructor() {
    this._commandHandler = new CommandManager();
  }


  closeKeptOpenConnection() {
    core.eventBus.emit("BatchCommandHandlerCloseConnection");
  }

  /**
   * @param { Object } stone              // Redux Stone Object
   * @param { String } stoneId            // StoneId,
   * @param { String } sphereId           // sphereId,
   * @param { commandInterface } command  // Object containing a command that is in the BluenetPromise set
   * @param { batchCommandEntryOptions } options  // options
   * @param { number } attempts           // amount of times to try this command before failing
   * @param { string } label              // explain where the command comes from,
   */
  load(stone, stoneId, sphereId, command : commandInterface, options: batchCommandEntryOptions = {}, attempts: number = 1, label = '') : Promise<bchReturnType> {
    LOGi.bch("BatchCommandHandler: Loading Command, sphereId:",sphereId," stoneId:", stoneId, stone.config.name, command, label);
    return this._load(stone, stoneId, sphereId, command, options, false, attempts, label);
  }

  /**
   * @param { Object } stone              // Redux Stone Object
   * @param { String } stoneId            // StoneId,
   * @param { String } sphereId           // sphereId,
   * @param { commandInterface } command  // Object containing a command that is in the BluenetPromise set
   * @param { batchCommandEntryOptions } options  // options
   * @param { number } attempts           // amount of times to try this command before failing
   * @param { string } label              // explain where the command comes from,
   */
  loadPriority(stone, stoneId, sphereId, command : commandInterface, options: batchCommandEntryOptions = {}, attempts: number = 1, label = '') : Promise<bchReturnType>  {
    LOGi.bch("BatchCommandHandler: Loading High Priority Command, sphereId:",sphereId," stoneId", stoneId, stone.config.name, command, label);
    return this._load(stone, stoneId, sphereId, command, options, true, attempts, label);
  }


  _load(stone, stoneId, sphereId, command : commandInterface, options: batchCommandEntryOptions = {}, priority: boolean, attempts: number = 1, label = '') : Promise<bchReturnType>  {
    let commandSummary : commandSummary = { stone, stoneId, sphereId, command, priority, attempts, options };
    let state = core.store.getState();

    if (BroadcastCommandManager.canBroadcast(commandSummary) || state.development.broadcasting_enabled) {
      return BroadcastCommandManager.broadcast(commandSummary)
        .catch((err) => {
          if (err && err.fatal == false && err.message !== BROADCAST_ERRORS.BROADCAST_REMOVED_AS_DUPLICATE.message) {
            // this is a fallback to the handling in the classic batch command handler, this can happend if the user goes to the background for instance.
            return this._commandHandler.load(stone, stoneId, sphereId, command, priority, attempts, options);
          }
          else {
            throw err;
          }
        });
    }
    else {
      // handle in classic batch command handler
      return this._commandHandler.load( stone, stoneId, sphereId, command, priority,  attempts, options );
    }
  }

  /**
   * Convert all the todos to an array of event topics we can listen to.
   * These events are triggered by advertisements or ibeacon messages.
   * @returns {Array}
   * @private
   */
  _getTopicsFromTargets(directTargets : targetData) : incomingAdvertisementTopics[] {
    // get sphereIds of the spheres we need to do things in.
    let topicsToScan = [];

    // find all the topics for individual crownstones.
    let stoneIds = Object.keys(directTargets);
    stoneIds.forEach((stoneId) => {
      LOGd.bch("BatchCommandHandler: directCommands for sphere:", directTargets[stoneId], " stone:", stoneId, this.activePromiseId);
      topicsToScan.push({ sphereId: directTargets[stoneId], stoneId: stoneId, topic: Util.events.getCrownstoneTopic(directTargets[stoneId], stoneId) });
    });
    return topicsToScan;
  }


  /**
   * This will commands one by one to the connected Crownstone.
   * @param connectedStoneInfo
   * @param activeOptions
   * @param relayOnlyUsed
   * @returns { Promise<T> }
   */
  _handleAllCommandsForStone(connectedStoneInfo: connectionInfo, activeOptions : any = {}, relayOnlyUsed : boolean = false) {
    return new Promise((resolve, reject) => {

      // get everything we CAN and WILL do now with this Crownstone.
      let directCommands = this._commandHandler.extractDirectCommands(core.store.getState(), connectedStoneInfo.stoneId, relayOnlyUsed);

      let meshNetworks = this._commandHandler.extractMeshCommands(core.store.getState(), connectedStoneInfo.stoneId, connectedStoneInfo.meshNetworkId, relayOnlyUsed);
      // check if we have to perform any mesh commands for this Crownstone.
      let meshSphereIds = Object.keys(meshNetworks);
      let promise = null;
      for (let i = 0; i < meshSphereIds.length; i++) {
        let networksInSphere = meshNetworks[meshSphereIds[i]];
        let meshNetworkIds = Object.keys(networksInSphere);
        // pick the first network to handle
        if (meshNetworkIds.length > 0) {
          let helper = new MeshHelper(meshSphereIds[i], meshNetworkIds[i], networksInSphere[meshNetworkIds[0]], connectedStoneInfo.stoneId);
          promise = helper.performAction(relayOnlyUsed);

          // merge the active options with those of the mesh instructions.
          MeshHelper._mergeOptions(helper.activeOptions, activeOptions);
          break;
        }
      }

      // if we did not have a mesh command to handle, try the direct commands.
      if (promise === null) {
        let directSphereIds = Object.keys(directCommands);
        let actionPromise = null;
        let actionPromiseName = null;
        let performedAction = null;
        for (let i = 0; i < directSphereIds.length; i++) {
          let commandsInSphere = directCommands[directSphereIds[i]];
          if (commandsInSphere.length > 0) {
            let action = directCommands[directSphereIds[i]][0];
            let command = action.command;
            performedAction = action;
            // merge the active options with those of the mesh instructions.
            MeshHelper._mergeOptions(action.options, activeOptions);
            actionPromiseName = command.commandName;
            switch (command.commandName) {
              case 'getBootloaderVersion':
                actionPromise = BluenetPromiseWrapper.getBootloaderVersion();
                break;
              case 'getFirmwareVersion':
                actionPromise = BluenetPromiseWrapper.getFirmwareVersion();
                break;
              case 'getHardwareVersion':
                actionPromise = BluenetPromiseWrapper.getHardwareVersion();
                break;
              case 'clearErrors':
                actionPromise = BluenetPromiseWrapper.clearErrors(command.clearErrorJSON);
                // actionPromise = BluenetPromiseWrapper.restartCrownstone();
                break;
              case 'meshSetTime':
              case 'setTime':
                let timeToSet = command.time === undefined ? StoneUtil.nowToCrownstoneTime() : command.time;
                actionPromise = BluenetPromiseWrapper.meshSetTime(timeToSet);
                break;
              case 'getTime':
                actionPromise = BluenetPromiseWrapper.getTime();
                break;
              case 'commandFactoryReset':
                actionPromise = BluenetPromiseWrapper.commandFactoryReset();
                break;
              case 'sendNoOp':
                actionPromise = BluenetPromiseWrapper.sendNoOp();
                break;
              case 'setupPulse':
                actionPromise = BluenetPromiseWrapper.setupPulse();
                break;
              case 'sendMeshNoOp':
                actionPromise = BluenetPromiseWrapper.sendMeshNoOp();
                break;
              case 'lockSwitch':
                actionPromise = BluenetPromiseWrapper.lockSwitch(command.value);
                break;
              case 'setMeshChannel':
                actionPromise = BluenetPromiseWrapper.setMeshChannel(command.channel);
                break;
              case 'multiSwitch':
                let stoneSwitchPacket = {crownstoneId: connectedStoneInfo.stone.config.crownstoneId, timeout: command.timeout, intent: command.intent, state: command.state};
                actionPromise = BluenetPromiseWrapper.multiSwitch([stoneSwitchPacket])
                break;
              case 'toggle':
                actionPromise = BluenetPromiseWrapper.toggleSwitchState(command.stateForOn || 1.0);
                break;
              case 'setTapToToggle':
                actionPromise = BluenetPromiseWrapper.setTapToToggle(command.value);
                break;
              case 'setTapToToggleThresholdOffset':
                actionPromise = BluenetPromiseWrapper.setTapToToggleThresholdOffset(command.rssiOffset);
                break;
              case 'setSwitchCraft':
                actionPromise = BluenetPromiseWrapper.setSwitchCraft(command.value);
                break;
              case 'saveBehaviour':
                actionPromise = BluenetPromiseWrapper.saveBehaviour(command.behaviour);
                break;
              case 'updateBehaviour':
                actionPromise = BluenetPromiseWrapper.updateBehaviour(command.behaviour);
                break;
              case 'removeBehaviour':
                actionPromise = BluenetPromiseWrapper.removeBehaviour(command.index);
                break;
              case 'getBehaviour':
                actionPromise = BluenetPromiseWrapper.getBehaviour(command.index);
                break;
              case 'syncBehaviour':
                actionPromise = BluenetPromiseWrapper.syncBehaviours(command.behaviours);
                break;
              case 'allowDimming':
                actionPromise = BluenetPromiseWrapper.allowDimming(command.value);
                break;
              default:
                LOGe.bch("BatchCommandHandler: Error: COULD NOT PERFORM ACTION", commandsInSphere, action);
                return reject("Failed to handle command");
                performedAction = null;
            }
            break;
          }
        }

        // if the direct command is performed, clean up the command afterwards.
        if (actionPromise !== null) {
          // clean up by resolving the promises of the items contained in the mesh messages.
          promise = actionPromise.then((data) => {
            LOGi.bch("BatchCommandHandler:", actionPromiseName, "finalized successfully.");
            performedAction.promise.resolve({data:data});
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
            return this._handleAllCommandsForStone(connectedStoneInfo, activeOptions, relayOnlyUsed);
          })
          .then(() => {
            resolve(activeOptions);
          })
          .catch((err) => {
            reject(err);
          })
      }
      else {
        resolve(activeOptions);
      }
    })
  }


  /**
   * This searches for very recent readings of Crownstones that are near before we start to search for them.
   * @param rssiScanThreshold
   * @param directTargets
   * @returns {any}
   * @private
   */
  _getConnectionTarget(rssiScanThreshold, directTargets) : Promise<connectionInfo> {
    return new Promise((resolve, reject) => {
      let state = core.store.getState();

      let nearestDirect = StoneAvailabilityTracker.getNearestStoneId(directTargets, 2, rssiScanThreshold);
      if (!nearestDirect && rssiScanThreshold !== null) { nearestDirect = StoneAvailabilityTracker.getNearestStoneId(directTargets,    2); }

      let foundId = nearestDirect;
      let foundSphereId = directTargets[nearestDirect];

      if (nearestDirect) {
        LOGi.bch("BatchCommandHandler: Found stone to directly connect to:", nearestDirect);
      }
      else {
        LOGi.bch("BatchCommandHandler: No relevant stones found in the scan history for the last few seconds");
      }

      if (foundId) {
        let sphere = state.spheres[foundSphereId];
        let stone = sphere.stones[foundId];

        return resolve({
          sphereId :      foundSphereId,
          stoneId:        foundId,
          stone:          stone,
          meshNetworkId:  stone.config.meshNetworkId,
          handle:         stone.config.handle
        });
      }

      LOGv.bch("BatchCommandHandler:", this._commandHandler.commands);
      reject({code: BCH_ERROR_CODES.NO_STONES_FOUND, message:"No stones found in connection target obtaining"});
    });
  }



  /**
   * This method will search for Crownstones using the topics provided by the _getTopicsFromTargets.
   * It will connect to the first responder and perform all commands for that Crownstone. It will then move on to the next one.
   * @returns {Promise<T>}
   */
  _searchAndHandleCommands(options? : batchCommandEntryOptions) {
    return new Promise((resolve, reject) => {
      // we record the time here to enable failing of failed commands by the attemptHandler that were loaded before this time.
      let executionTimestamp = new Date().valueOf();

      let executingPromiseId = this.activePromiseId;

      let state = core.store.getState();
      let { directTargets, relayOnlyTargets } = this._commandHandler.extractConnectionTargets(state);

      // We will not use the relayOnlyTargets for now since the handling of the mesh should be improved for this.
      // However, we will send the entire mesh payload to each stone. This gives us the redundancy of the old system (individual connections),
      // while keeping the performance improvement of the mesh.
      let topicsToScan = this._getTopicsFromTargets(directTargets);
      if (topicsToScan.length === 0) {
        // Use the attempt handler to clean up after something fails.
        this.attemptHandler(null, executionTimestamp,'Nothing to scan');

        LOGi.bch("BatchCommandHandler: No topics to scan during BatchCommandHandler execution", this.activePromiseId);
        resolve();

        // abort the rest of the method.
        return;
      }

      // if there is a high priority call that we need to do, ignore the rssi limit.
      let highPriorityActive = this._commandHandler.highPriorityCommandAvailable();
      let rssiScanThreshold = -91;
      if (highPriorityActive) {
        rssiScanThreshold = null;
      }

      let activeCrownstone = null;
      let relayOnlyUsed = false;
      let allowMeshRelay = true;

      if (options && options.onlyAllowDirectCommand === true) {
        allowMeshRelay = false;
      }


      // get a connection target
      this._getConnectionTarget(rssiScanThreshold, directTargets)
        .catch(() => {
          if (this.activePromiseId !== executingPromiseId) { throw BCH_ERROR_CODES.TASK_HAS_BEEN_SUPERSEDED; }
          // cant find a crownstone in the recent scans, look for one now.
          return this._searchScan(topicsToScan, rssiScanThreshold, highPriorityActive, 5000)
        })
        .catch((err) => {
          if (this.activePromiseId !== executingPromiseId) { throw BCH_ERROR_CODES.TASK_HAS_BEEN_SUPERSEDED; }
          if (allowMeshRelay === false) {
            throw err;
          }
          // if the search scan has failed to yield directly connectable targets, we try the mesh targets
          relayOnlyUsed = true;
          return this._getConnectionTarget(rssiScanThreshold, relayOnlyTargets)
        })
        .catch((err) => {
          if (this.activePromiseId !== executingPromiseId) { throw BCH_ERROR_CODES.TASK_HAS_BEEN_SUPERSEDED; }
          // we have not found any mesh targets in the last few scans either
          relayOnlyUsed = false;
          // nothing found within -91. if this is a low priority call, we will attempt it without the rssi threshold.
          if (rssiScanThreshold !== null && highPriorityActive === false) {
            return this._searchScan(topicsToScan, null, false, 5000)
          }
          else {
            throw err;
          }
        })
        .then((crownstoneToHandle : connectionInfo) => {
          if (this.activePromiseId !== executingPromiseId) { throw BCH_ERROR_CODES.TASK_HAS_BEEN_SUPERSEDED; }
          activeCrownstone = crownstoneToHandle;
          if (crownstoneToHandle === null) {
            // this happens during a priority interrupt
            return;
          }
          else {
            return this._connectAndHandleCommands(crownstoneToHandle, highPriorityActive, relayOnlyUsed, executingPromiseId);
          }
        })
        .then(() => {
          resolve({data:null});
        })
        .catch((err) => {
          LOGi.bch("BatchCommandHandler: Failed to execute", err, executingPromiseId);
          // Use the attempt handler to clean up after something fails.
          this.attemptHandler(activeCrownstone, executionTimestamp, err);

          if (this.activePromiseId !== executingPromiseId) { throw BCH_ERROR_CODES.TASK_HAS_BEEN_SUPERSEDED; }

          // attempt to reschedule on failure.
          if (this._commandHandler.commandsAvailable()) {
            this._scheduleNextStone();
          }
          reject(err);
        })
        .catch((err) => {
          // this fallback catches errors in the attemptHandler.
          LOGe.bch("BatchCommandHandler: FATAL ERROR DURING EXECUTE", err, executingPromiseId);
          reject(err);
        })
    })
  }

  _connectAndHandleCommands(crownstoneToHandle : connectionInfo, highPriorityActive: boolean, relayOnlyUsed: boolean, executingPromiseId: string) {
    return new Promise((resolve, reject) => {
      LOGi.bch("BatchCommandHandler: connecting to ", crownstoneToHandle.stone.config.name, executingPromiseId);
      BluenetPromiseWrapper.connect(crownstoneToHandle.handle, crownstoneToHandle.sphereId, highPriorityActive)
        .then(() => {
          if (this.activePromiseId !== executingPromiseId) { throw BCH_ERROR_CODES.TASK_HAS_BEEN_SUPERSEDED; }
          LOGi.bch("BatchCommandHandler: Connected to ", crownstoneToHandle.stone.config.name, executingPromiseId);
          return this._handleAllCommandsForStone(crownstoneToHandle, {}, relayOnlyUsed);
        })
        .then((optionsOfPerformedActions : batchCommandEntryOptions) => {
          if (this.activePromiseId !== executingPromiseId) { throw BCH_ERROR_CODES.TASK_HAS_BEEN_SUPERSEDED; }
          if (optionsOfPerformedActions.keepConnectionOpen === true) {
            return this._keepConnectionOpen(optionsOfPerformedActions, crownstoneToHandle, true);
          }
        })
        .then(() => {
          if (this.activePromiseId !== executingPromiseId) { throw BCH_ERROR_CODES.TASK_HAS_BEEN_SUPERSEDED; }
          if (Permissions.inSphere(crownstoneToHandle.sphereId).setStoneTime && core.store) {
            // check if we have to tell this crownstone what time it is.
            let state = core.store.getState();
            let stone = state.spheres[crownstoneToHandle.sphereId].stones[crownstoneToHandle.stoneId];
            let lastTime = stone.lastUpdated.stoneTime;
            // if it is more than 5 hours ago, tell this crownstone the time.
            if (new Date().valueOf() - lastTime > STONE_TIME_REFRESH_INTERVAL || stone.state.timeSet === false) {
              // this will never halt the chain since it's optional.
              return BluenetPromiseWrapper.setTime(StoneUtil.nowToCrownstoneTime())
                .then(() => {
                  core.store.dispatch({type: "UPDATED_STONE_TIME", sphereId: crownstoneToHandle.sphereId, stoneId: crownstoneToHandle.stoneId})
                })
                .catch((err) => {
                  LOGw.bch("BatchCommandHandler: Could not set the time of Crownstone", err);
                });
            }
            else {
              LOGd.bch("BatchCommandHandler: Decided not to set the time because delta time:", new Date().valueOf() - lastTime, ' ms.');
            }
          }
          else {
            LOGd.bch("BatchCommandHandler: Decided not to set the time Permissions.setStoneTime:", Permissions.inSphere(crownstoneToHandle.sphereId).setStoneTime, Permissions.inSphere(crownstoneToHandle.sphereId).setStoneTime && core.store);
          }
        })
        .then(() => {
          return BluenetPromiseWrapper.disconnectCommand();
        })
        .then(() => {
          if (this._commandHandler.commandsAvailable()) {
            this._scheduleNextStone();
          }
        })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          // In case the disconnect event triggers a bug, we return this promise and reject the error in either case.
          // This will ensure the promise manager will NEVER stall.
          return BluenetPromiseWrapper.phoneDisconnect()
            .then((disconnectErr) => {
              reject(err);
            })
        })
        .catch((err) => {
          // this handles an error during the phoneDisconnect
          reject(err);
        })
    });
  }

  _keepConnectionOpen(options, crownstoneToHandle : connectionInfo, original: boolean) {
    return new Promise((resolve, reject) => {
      let scheduleCloseTimeout = (timeout) => {
        this._removeCloseConnectionTimeout = Scheduler.scheduleCallback(() => {
          this._cleanKeepOpen();
          resolve();
        }, timeout, 'Close connection in BHC due to timeout.');
      };

      if (original) {
        let timeout = options.keepConnectionOpenTimeout || 5000;
        scheduleCloseTimeout(timeout);
      }

      this._unsubscribeCloseListener = core.eventBus.on("BatchCommandHandlerCloseConnection", () => {
        this._cleanKeepOpen();
        resolve();
      });

      this._unsubscribeLoadListener = core.eventBus.on("BatchCommandHandlerLoadAction", () => {
        // remove all listeners before moving on.
        this._cleanKeepOpen();

        this._handleAllCommandsForStone(crownstoneToHandle)
          .then((optionsOfPerformedActions : batchCommandEntryOptions) => {
            if (optionsOfPerformedActions.keepConnectionOpenTimeout && optionsOfPerformedActions.keepConnectionOpenTimeout > 0) {
              if (typeof this._removeCloseConnectionTimeout === 'function') {
                this._removeCloseConnectionTimeout();
                this._removeCloseConnectionTimeout = null;
              }
              scheduleCloseTimeout( optionsOfPerformedActions.keepConnectionOpenTimeout )
            }
            return this._keepConnectionOpen(options, crownstoneToHandle, false);
          })
          .then(() => {
            this._cleanKeepOpen();
            resolve();
          })
          .catch((err) => { reject(err); })
      });
    });
  }

  _cleanKeepOpen(includeTimeout: boolean = true) {
    if (typeof this._unsubscribeCloseListener === 'function') {
      this._unsubscribeCloseListener();
      this._unsubscribeCloseListener = null;
    }
    if (typeof this._unsubscribeLoadListener === 'function') {
      this._unsubscribeLoadListener();
      this._unsubscribeLoadListener = null;
    }

    if (includeTimeout) {
      if (typeof this._removeCloseConnectionTimeout === 'function') {
        this._removeCloseConnectionTimeout();
        this._removeCloseConnectionTimeout = null;
      }
    }
  }

  /**
   * This is invoked after something during the process fails.
   * It reduces the attempt counter in the affected processes by 1. If the attempt count is at 0, it will remove the command
   * from the list.
   * @param connectedCrownstone
   * @param executionTimestamp
   * @param err
   */
  attemptHandler(connectedCrownstone, executionTimestamp, err) {
    let handleAttempt = (command) => {
      // The command has to be initialized first.
      // This is required to avoid the cases where commands that are loaded while there is a pending process
      // If that pending process fails, anything that was loaded during that time would be cancelled as well.
      if (command.timestamp <= executionTimestamp) {
        command.attempts -= 1;
        if (command.attempts <= 0) {
          command.promise.reject(err);
          command.cleanup();
        }
      }
    };

    // if we did not find anything to connect to, we will reduce all open attempts.
    if (!connectedCrownstone) {
      connectedCrownstone = {stoneId: null, meshNetworkId: null};
    }

    // get all todos that would have been done to reduce their attempt counts.
    let directCommands = this._commandHandler.extractDirectCommands(core.store.getState(), connectedCrownstone.stoneId);
    let directCommandSphereIds = Object.keys(directCommands);
    directCommandSphereIds.forEach((sphereId) => {
      let commandsInSphere = directCommands[sphereId];
      commandsInSphere.forEach(handleAttempt);
    });
  }


  execute(options? : batchCommandEntryOptions) {
    this._execute(false, options);
  }

  executePriority(options? : batchCommandEntryOptions) {
    this._execute(true, options);
  }

  _scheduleNextStone() {
    this._scheduleExecute(false);
  }

  /**
   * @param { Boolean } priority        //  this will move any command to the top of the queue
   * @param options
   */
  _execute(priority, options? : batchCommandEntryOptions) {
    this._scheduleExecute(priority, options);
  }

  _scheduleExecute(priority, options? : batchCommandEntryOptions) {
    // HACK TO SUCCESSFULLY DO ALL THINGS WITH BHC WITHOUT NATIVE
    if (DISABLE_NATIVE === true) {
      Scheduler.scheduleCallback(() => {
        this._commandHandler.forceCleanAllCommands()
      }, 1500, "Fake native handling of BHC");
      return;
    }


    let promiseId = xUtil.getUUID();
    LOGi.bch("BatchCommandHandler: Scheduling command in promiseManager");
    let actionPromise = () => {
      this.activePromiseId = promiseId;
      LOGi.bch("BatchCommandHandler: Executing!", this.activePromiseId);
      return this._searchAndHandleCommands(options);
    };

    let promiseRegistration = null;

    if (priority) { promiseRegistration = BlePromiseManager.registerPriority.bind(BlePromiseManager); }
    else          { promiseRegistration = BlePromiseManager.register.bind(BlePromiseManager); }

    promiseRegistration(actionPromise, {from: 'BatchCommandHandler: executing ' + promiseId})
      .catch((err) => {
        // disable execution stop the error propagation since this is not returned anywhere.
        LOGe.bch("BatchCommandHandler: Error completing promise.", err, promiseId);
      });
  }



  /**
   * return Promise which will resolve to a handle to connect to.
   * If this returns null, the search has been cancelled prematurely.
   * @private
   */
  _searchScan(objectsToScan : any[], rssiThreshold = null, highPriorityActive = false, timeout = 5000) : Promise<connectionInfo> {
    return new Promise((resolve : (connectionInfo) => void, reject) => {

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

        LOGi.bch("BatchCommandHandler: None of the required stones found before timeout.");
        reject({code: BCH_ERROR_CODES.NO_STONES_FOUND, message:"None of the required stones found before timeout."});
      }, timeout, 'Looking for target...');


      // if we're busy with a low priority command, we will stop the search if a high priority execute comes in.
      if (highPriorityActive !== true) {
        unsubscribeListeners.push(core.eventBus.on('PriorityCommandSubmitted', () => {
          LOGi.bch("BatchCommandHandler: Stopped listening for Crownstones due to Priority Execute.");
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
        unsubscribeListeners.push( core.eventBus.on(topic.topic, (data : crownstoneTopicData) => {
          LOGd.bch("BatchCommandHandler: Got an event:", data.stoneId, data.rssi, data.handle);
          if (rssiThreshold === null || data.rssi > rssiThreshold) {
            // remove the listeners
            cleanup();

            // remove cleanup callback
            clearCleanupCallback();

            // resolve with the handle.
            resolve({
              stoneId: data.stoneId,
              stone: data.stone,
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