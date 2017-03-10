import { BlePromiseManager } from './BlePromiseManager'
import { BluenetPromiseWrapper, NativeBus, Bluenet, INTENTS } from '../native/Proxy';
import { LOG } from '../logging/Log'
import { Scheduler } from './Scheduler'
import { eventBus } from '../util/eventBus'
import { HIGH_FREQUENCY_SCAN_MAX_DURATION, KEEPALIVE_INTERVAL } from '../ExternalConfig'
import { Util } from '../util/Util'

import { SingleCommand } from './SingleCommand'
import { MeshHelper } from './MeshHelper'


/**
 * This can be used to batch commands over the mesh or 1:1 to the Crownstones.
 */
class BatchCommandHandlerClass {
  _initialized = false;
  commands : batchCommands = {};
  store : any;
  sphereId : any;

  constructor() { }

  loadStore(store) {
    LOG.info('LOADED STORE BatchCommandHandlerClass', this._initialized);
    if (this._initialized === false) {
      this.store = store;
    }
  }

  /**
   * @param { Object } stone              // Redux Stone Object
   * @param { String } stoneId            // StoneId,
   * @param { String } sphereId           // sphereId,
   * @param { commandInterface } command  // Object containing a command that is in the BluenetPromise set
   */
  load(stone, stoneId, sphereId, command : commandInterface) {
    LOG.verbose("BatchCommand: Loading command,", stoneId, stone.config.name, command);
    return new Promise((resolve, reject) => {
      let uuid = Util.getUUID();
      this.commands[uuid] = {
        handle: stone.config.handle,
        sphereId: sphereId,
        stoneId: stoneId,
        stone:stone,
        command: command,
        cleanup: () => { this.commands[uuid] = undefined; delete this.commands[uuid]; },
        promise:{ resolve: resolve, reject: reject }
      };
    });
  }


  _extractTodo() {
    let directCommands = [];
    let meshNetworks : meshNetworks = {};

    let uuids = Object.keys(this.commands);
    for (let i = 0; i < uuids.length; i++) {
      let todo = this.commands[uuids[i]];
      let command = todo.command;
      let stoneConfig = todo.stone.config;
      // mesh not supported / no mesh detected for this stone
      if (stoneConfig.meshNetworkId === null || stoneConfig.meshNetworkId === undefined) {
        // handle this 1:1
        directCommands.push({ ...todo });
      }
      else {
        if (meshNetworks[stoneConfig.meshNetworkId] === undefined) {
          meshNetworks[stoneConfig.meshNetworkId] = {
            keepAlive:      [],
            keepAliveState: [],
            setSwitchState: [],
            multiSwitch:    [],
            other:          []
          };
        }

        if (command.command === 'keepAlive') {
          meshNetworks[stoneConfig.meshNetworkId].keepAlive.push({cleanup: todo.cleanup, promise: todo.promise});
        }
        else if (command.command === 'keepAliveState') {
          meshNetworks[stoneConfig.meshNetworkId].keepAliveState.push({
            crownstoneId: stoneConfig.crownstoneId,
            handle: stoneConfig.handle,
            changeState: command.changeState,
            state: command.state,
            timeout: command.timeout,
            cleanup: todo.cleanup,
            promise: todo.promise
          });
        }
        else if (command.command === 'setSwitchState') {
          meshNetworks[stoneConfig.meshNetworkId].setSwitchState.push({
            crownstoneId: stoneConfig.crownstoneId,
            handle: stoneConfig.handle,
            state: command.state,
            cleanup: todo.cleanup,
            promise: todo.promise
          });
        }
        else if (command.command === 'multiSwitch') {
          meshNetworks[stoneConfig.meshNetworkId].multiSwitch.push({
            crownstoneId: stoneConfig.crownstoneId,
            handle: stoneConfig.handle,
            state: command.state,
            intent: command.intent,
            timeout: command.timeout,
            cleanup: todo.cleanup,
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
    }

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
    LOG.info("BatchCommand: Scheduling");
    let actionPromise = () => {
      LOG.info("BatchCommand: Executing!");

      let { directCommands, meshNetworks } = this._extractTodo();

      LOG.info("BatchCommand: directCommands:", directCommands);
      LOG.info("BatchCommand: meshNetworks:", meshNetworks);

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
          singleCommand.searchAndPerform(batchSettings, this.store.getState(), BluenetPromiseWrapper[command.commandString], command.props, priority)
            .then(() => {
              command.promise.resolve();
            })
            .catch((err) => {
              command.promise.reject(err);
            })
        );
      });

      // instant resolve. We just use this promise to ensure that the execution of execute is in the promise handler queue.
      return new Promise((resolve, reject) => {
        resolve();
      })
    };

    // return Promise.all(promises)
    //   .then(() => {
    //     this._reset();
    //   });

    let details = {from: 'BatchCommandHandler: executing.'};
    if (priority) {
      return BlePromiseManager.registerPriority(actionPromise, details);
    }
    else {
      return BlePromiseManager.register(actionPromise, details);
    }
  }

  _reset() {
    this.commands = [];
  }

}

export const BatchCommandHandler = new BatchCommandHandlerClass();