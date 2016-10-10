import { BlePromiseManager } from '../logic/BlePromiseManager'
import { BleActions, NativeBus, Bluenet } from './Proxy';
import { LOG, LOGDebug, LOGError } from '../logging/Log'
import { HIGH_FREQUENCY_SCAN_MAX_DURATION } from '../ExternalConfig'
import { getUUID } from '../util/util'


export const BLEutil = {
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

  getNearestSetupCrownstone: function(timeout) {
    this.cancelSetupSearch();
    return this._getNearestCrownstoneFromEvent(NativeBus.topics.nearestSetup, this.pendingSetupSearch, timeout)
      .then((nearestItem) => {return new SetupCrownstone(nearestItem.handle);})
  },

  getNearestSetupCrownstoneHandle: function(timeout) {
    this.cancelSetupSearch();
    return this._getNearestCrownstoneFromEvent(NativeBus.topics.nearestSetup, this.pendingSetupSearch, timeout)
  },

  getNearestCrownstone: function(timeout) {
    this.cancelSearch();
    return this._getNearestCrownstoneFromEvent(NativeBus.topics.nearest, this.pendingSearch, timeout)
  },

  _getNearestCrownstoneFromEvent: function(event, stateContainer, timeout = 10000) {
    LOGDebug("LOOKING FOR NEAREST")
    return new Promise((resolve, reject) => {
      let measurementMap = {};
      let highFrequencyRequestUUID = getUUID();
      this.startHighFrequencyScanning(highFrequencyRequestUUID);

      let sortingCallback = (nearestItem) => {
        //LOG("advertisement in nearest", nearestItem)

        if (typeof nearestItem == 'string') {
          nearestItem = JSON.parse(nearestItem);
        }

        LOG("nearestItem", nearestItem, event);

        if (measurementMap[nearestItem.handle] === undefined) {
          measurementMap[nearestItem.handle] = {count: 0, rssi: nearestItem.rssi};
        }

        measurementMap[nearestItem.handle].count += 1;

        if (measurementMap[nearestItem.handle].count == 3) {
          LOG('RESOLVING', nearestItem);
          this._cancelSearch(stateContainer);
          this.stopHighFrequencyScanning(highFrequencyRequestUUID);
          resolve(nearestItem);
        }
      };

      LOG("for nearest, subbing to ", event)
      stateContainer.unsubscribe = NativeBus.on(event, sortingCallback);

      // if we cant find something in 10 seconds, we fail.
      stateContainer.timeout = setTimeout(() => {
        this.stopHighFrequencyScanning(highFrequencyRequestUUID);
        this._cancelSearch(stateContainer);
        reject("Nothing Near");
      }, timeout);
    })
  },

  detectCrownstone: function(stoneHandle) {
    LOGDebug("DETECTING")
    this.cancelSearch();
    return new Promise((resolve, reject) => {
      let count = 0;
      let highFrequencyRequestUUID = getUUID();
      this.startHighFrequencyScanning(highFrequencyRequestUUID);

      let cleanup = {unsubscribe:()=>{}, timeout: undefined};
      let sortingCallback = (advertisement) => {
        LOG("advertisement in detect", advertisement)

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

      LOGDebug("SUBBING TO ", NativeBus.topics.advertisement);
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

  startHighFrequencyScanning: function(id, noTimeout = false) {
    let timeoutDuration = HIGH_FREQUENCY_SCAN_MAX_DURATION;
    if (typeof noTimeout === 'number' && noTimeout > 0) {
      timeoutDuration = noTimeout;
    }

    if (this.highFrequencyScanUsers[id] === undefined) {
      if (Object.keys(this.highFrequencyScanUsers).length === 0) {
        LOGDebug("Starting HF Scanning!");
        Bluenet.startScanningForCrownstones();
      }
      this.highFrequencyScanUsers[id] = {timeout: undefined};
    }

    if (noTimeout === false) {
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
        LOGDebug("Stopping HF Scanning!");
        Bluenet.startScanningForCrownstonesUniqueOnly();
      }
    }
  }

};


class SingleCommand {
  constructor(bleHandle) {
    this.bleHandle = bleHandle;
  }

  /**
   * Connect, perform action, disconnect
   * @param action --> a bleAction from Proxy
   * @param prop   --> Optional property
   * @returns {*}
   */
  perform(action, prop) {
    LOG("connecting to ", this.bleHandle, "doing this: ", action, "with prop", prop)
    return BlePromiseManager.register(() => {
      return BleActions.connect(this.bleHandle)
        .then(() => { return action(prop); })
        .then(() => { return BleActions.disconnect(); })
        .catch((err) => {
          LOG("BLE Error:", err);
          return new Promise((resolve,reject) => {
            BleActions.phoneDisconnect().then(reject).catch(reject);
          })
        })
    }, {from:'perform on singleCommand'});
  }
}

export class SetupCrownstone {
  constructor(bleHandle) {
    this.bleHandle = bleHandle;
  }

  connect() {
    return BleActions.connect(this.bleHandle);
  }

  disconnect() {
    return BleActions.phoneDisconnect();
  }

  getMACAddress() {
    return BleActions.getMACAddress();
  }

  getHandle() {
    return this.bleHandle;
  }

  setup(data) {
    let dataString = data;
    if (typeof dataString === 'object') {
      dataString = JSON.stringify(data);
    }
    return BleActions.setupCrownstone(dataString);
  }
}