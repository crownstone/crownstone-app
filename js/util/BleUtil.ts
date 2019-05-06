import { Bluenet  }  from '../native/libInterface/Bluenet';
import {LOG, LOGd} from '../logging/Log'
import { HIGH_FREQUENCY_SCAN_MAX_DURATION } from '../ExternalConfig'

import { DirectCommand } from '../logic/DirectCommand'
import {Scheduler} from "../logic/Scheduler";
import { xUtil } from "./StandAloneUtil";
import { core } from "../core";


export const BleUtil = {
  pendingSearch: {},
  pendingSetupSearch: {},
  highFrequencyScanUsers: {},

  _cancelSearch: function(stateContainer) {
    if (typeof stateContainer.timeout === 'function') {
      stateContainer.timeout();
      stateContainer.timeout = null;
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
    return this._getNearestCrownstoneFromEvent(core.nativeBus.topics.nearestSetup, this.pendingSetupSearch, timeoutMilliseconds)
  },

  getNearestCrownstone: function(timeoutMilliseconds) {
    this.cancelSearch();
    return this._getNearestCrownstoneFromEvent(core.nativeBus.topics.nearest, this.pendingSearch, timeoutMilliseconds)
  },

  _getNearestCrownstoneFromEvent: function(event, stateContainer, timeoutMilliseconds = 10000) {
    LOGd.info("_getNearestCrownstoneFromEvent: LOOKING FOR NEAREST");
    return new Promise((resolve, reject) => {
      let measurementMap = {};
      let highFrequencyRequestUUID = xUtil.getUUID();
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

      stateContainer.unsubscribe = core.nativeBus.on(event, sortingCallback);

      // if we cant find something in 10 seconds, we fail.
      stateContainer.timeout = Scheduler.scheduleCallback(() => {
        this.stopHighFrequencyScanning(highFrequencyRequestUUID);
        this._cancelSearch(stateContainer);
        reject("_getNearestCrownstoneFromEvent: Nothing Near");
      }, timeoutMilliseconds, '_getNearestCrownstoneFromEvent stateContainer.timeout');
    })
  },

  detectCrownstone: function(stoneHandle) {
    this.cancelSearch();
    return new Promise((resolve, reject) => {
      let count = 0;
      let highFrequencyRequestUUID = xUtil.getUUID();
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
        if (typeof cleanup.timeout === 'function') {
          cleanup.timeout();
          cleanup.timeout = null;
        }
        cleanup.unsubscribe();
        this.stopHighFrequencyScanning(highFrequencyRequestUUID);
        resolve(advertisement.setupPackage);
      };

      LOGd.info("detectCrownstone: Subscribing TO ", core.nativeBus.topics.advertisement);
      cleanup.unsubscribe = core.nativeBus.on(core.nativeBus.topics.advertisement, sortingCallback);

      // if we cant find something in 10 seconds, we fail.
      cleanup.timeout = Scheduler.scheduleCallback(() => {
        this.stopHighFrequencyScanning(highFrequencyRequestUUID);
        cleanup.unsubscribe();
        reject(false);
      }, 10000, 'detectCrownstone timeout');
    })
  },

  /**
   *
   * @param bleHandle     Handle used to connect to Crownstone
   * @param referenceId   Id of the matching keyset. This is usually a SphereId in our app.
   */
  getProxy: function (bleHandle : string, referenceId : string) {
    return new DirectCommand(bleHandle, referenceId);
  },

  /**
   *
   * @param id
   * @param noTimeout   | Bool or timeout in millis
   * @returns {function()}
   */
  startHighFrequencyScanning: function(id, noTimeout : boolean | number = false) {
    console.log("START SCANNING HF", id)
    let enableTimeout = noTimeout === false;
    let timeoutDuration = HIGH_FREQUENCY_SCAN_MAX_DURATION;
    if (typeof noTimeout === 'number' && noTimeout > 0) {
      timeoutDuration = noTimeout;
      enableTimeout = true;
    }

    if (this.highFrequencyScanUsers[id] === undefined) {
      if (Object.keys(this.highFrequencyScanUsers).length === 0) {
        LOGd.info("Starting HF Scanning!");
        Bluenet.startScanningForCrownstones();
      }
      this.highFrequencyScanUsers[id] = {timeout: undefined};
    }

    if (enableTimeout === true) {
      if (typeof this.highFrequencyScanUsers[id].timeout === 'function') {
        this.highFrequencyScanUsers[id].timeout();
        this.highFrequencyScanUsers[id].timeout = null;
      }
      this.highFrequencyScanUsers[id].timeout = Scheduler.scheduleCallback(() => {
        this.stopHighFrequencyScanning(id);
      }, timeoutDuration, 'this.highFrequencyScanUsers[id].timeout');
    }

    return () => { this.stopHighFrequencyScanning(id) };
  },

  stopHighFrequencyScanning: function(id) {
    console.log("STOP SCANNING HF", id)
    if (this.highFrequencyScanUsers[id] !== undefined) {
      if (typeof this.highFrequencyScanUsers[id].timeout === 'function') {
        this.highFrequencyScanUsers[id].timeout();
        this.highFrequencyScanUsers[id].timeout = null;
      }
      delete this.highFrequencyScanUsers[id];
      if (Object.keys(this.highFrequencyScanUsers).length === 0) {
        LOGd.info("Stopping HF Scanning!");
        Bluenet.startScanningForCrownstonesUniqueOnly();
      }
    }
  },

  highFrequencyScanUsed: function() {
    return Object.keys(this.highFrequencyScanUsers).length > 0;
  }

};
















