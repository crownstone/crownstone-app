import { BlePromiseManager } from './BlePromiseManager'
import { BluenetPromiseWrapper, NativeBus, Bluenet, INTENTS } from '../native/Proxy';
import { LOG } from '../logging/Log'
import { Scheduler } from './Scheduler'
import { eventBus } from '../util/eventBus'
import { HIGH_FREQUENCY_SCAN_MAX_DURATION, KEEPALIVE_INTERVAL } from '../ExternalConfig'
import { Util } from '../util/Util'

export class SingleCommand {
  sphereId : any;
  stoneId  : any;
  handle   : any;

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
          return this._searchScan(topic, null, searchSettings.timeout)
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
        return BluenetPromiseWrapper.connect(this.handle)
          .then(() => { LOG.info("SingleCommand: connected, performing: ", action, props); return action.apply(this, props); })
          .catch((err) => {
            if (err === 'NOT_CONNECTED') {
              return BluenetPromiseWrapper.connect(this.handle)
                .then(() => { LOG.info("SingleCommand: second attempt, performing: ", action, props); return action.apply(this, props); })
            }
          })
          .then(() => { LOG.info("SingleCommand: completed", action, 'disconnecting'); return BluenetPromiseWrapper.disconnect(); })
          .catch((err) => {
            LOG.error("SingleCommand: BLE Single command Error:", err);
            return new Promise((resolve,reject) => {
              BluenetPromiseWrapper.phoneDisconnect().then(() => { reject(err) }).catch(() => { reject(err) });
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

