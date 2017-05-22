import { NativeBus } from '../native/libInterface/NativeBus';
import { Bluenet  }  from '../native/libInterface/Bluenet';
import { LOG } from '../logging/Log'
import { HIGH_FREQUENCY_SCAN_MAX_DURATION } from '../ExternalConfig'
import { Util } from './Util'

import { SingleCommand } from '../logic/SingleCommand'


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
      let highFrequencyRequestUUID = Util.getUUID();
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
      let highFrequencyRequestUUID = Util.getUUID();
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
















