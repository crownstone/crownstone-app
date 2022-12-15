import { Bluenet  }  from '../native/libInterface/Bluenet';
import {LOG, LOGd} from '../logging/Log'
import { HIGH_FREQUENCY_SCAN_MAX_DURATION } from '../ExternalConfig'

import {Scheduler} from "../logic/Scheduler";
import { xUtil } from "./StandAloneUtil";
import { core } from "../Core";


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
    BleUtil.cancelSearch();
    BleUtil.cancelSetupSearch();
  },

  cancelSearch:        function() { BleUtil._cancelSearch(BleUtil.pendingSearch); },
  cancelSetupSearch:   function() { BleUtil._cancelSearch(BleUtil.pendingSetupSearch); },

  getNearestSetupCrownstone: function(timeoutMilliseconds) {
    BleUtil.cancelSetupSearch();

    Bluenet.subscribeToNearest();
    return BleUtil._getNearestCrownstoneFromEvent(core.nativeBus.topics.nearestSetup, BleUtil.pendingSetupSearch, timeoutMilliseconds)
  },

  getNearestCrownstone: function(timeoutMilliseconds) {
    BleUtil.cancelSearch();

    Bluenet.subscribeToNearest();
    return BleUtil._getNearestCrownstoneFromEvent(core.nativeBus.topics.nearest, BleUtil.pendingSearch, timeoutMilliseconds)
  },

  _getNearestCrownstoneFromEvent: function(event, stateContainer, timeoutMilliseconds = 10000) {
    LOGd.info("_getNearestCrownstoneFromEvent: LOOKING FOR NEAREST");
    return new Promise((resolve, reject) => {
      let measurementMap = {};
      let highFrequencyRequestUUID = xUtil.getUUID();
      BleUtil.startHighFrequencyScanning(highFrequencyRequestUUID);

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
          BleUtil._cancelSearch(stateContainer);
          BleUtil.stopHighFrequencyScanning(highFrequencyRequestUUID);
          resolve(nearestItem);
        }
      };

      stateContainer.unsubscribe = core.nativeBus.on(event, sortingCallback);

      // if we cant find something in 10 seconds, we fail.
      stateContainer.timeout = Scheduler.scheduleCallback(() => {
        BleUtil.stopHighFrequencyScanning(highFrequencyRequestUUID);
        BleUtil._cancelSearch(stateContainer);
        reject(new Error("_getNearestCrownstoneFromEvent: Nothing Near"));
      }, timeoutMilliseconds, '_getNearestCrownstoneFromEvent stateContainer.timeout');
    })
  },

  _detect: function(handle, topic) : Promise<crownstoneAdvertisement> {
    return new Promise((resolve, reject) => {
      let count = 0;
      let highFrequencyRequestUUID = xUtil.getUUID();
      BleUtil.startHighFrequencyScanning(highFrequencyRequestUUID);

      let cleanup = {unsubscribe:()=>{}, timeout: undefined};
      let sortingCallback = (advertisement) => {
        LOG.info("detectCrownstone: Advertisement in detectCrownstone", handle, advertisement);

        if (advertisement.handle === handle)
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
        BleUtil.stopHighFrequencyScanning(highFrequencyRequestUUID);
        resolve(advertisement);
      };

      LOGd.info("detectCrownstone: Subscribing To ", topic);
      cleanup.unsubscribe = core.nativeBus.on(topic, sortingCallback);

      // if we cant find something in 10 seconds, we fail.
      cleanup.timeout = Scheduler.scheduleCallback(() => {
        BleUtil.stopHighFrequencyScanning(highFrequencyRequestUUID);
        cleanup.unsubscribe();
        reject(new Error());
      }, 10000, 'detectCrownstone timeout');
    })
  },

  detectCrownstone: async function(stoneHandle) : Promise<boolean> {
    BleUtil.cancelSearch();
    let advertisement : crownstoneAdvertisement = await BleUtil._detect(stoneHandle, core.nativeBus.topics.advertisement);
    return advertisement.serviceData.setupMode;
  },

  detectSetupCrownstone: function(stoneHandle) : Promise<crownstoneAdvertisement> {
    BleUtil.cancelSetupSearch();
    return BleUtil._detect(stoneHandle, core.nativeBus.topics.setupAdvertisement);
  },



  // /**
  //  *
  //  * @param bleHandle     Handle used to connect to Crownstone
  //  * @param referenceId   Id of the matching keyset. This is usually a SphereId in our app.
  //  */
  // getProxy: function (bleHandle : string, referenceId : string) {
  //   return new DirectCommand(bleHandle, referenceId);
  // },

  /**
   *
   * @param id
   * @param noTimeout   | Bool or timeout in millis
   * @returns {function()}
   */
  startHighFrequencyScanning: function(id, noTimeout : boolean | number = false) {
    let enableTimeout = noTimeout === false;
    let timeoutDuration = HIGH_FREQUENCY_SCAN_MAX_DURATION;
    if (typeof noTimeout === 'number' && noTimeout > 0) {
      timeoutDuration = noTimeout;
      enableTimeout = true;
    }

    if (BleUtil.highFrequencyScanUsers[id] === undefined) {
      if (Object.keys(BleUtil.highFrequencyScanUsers).length === 0) {
        LOGd.info("Starting HF Scanning!");
        Bluenet.startScanningForCrownstones();
      }
      BleUtil.highFrequencyScanUsers[id] = {timeout: undefined};
    }

    if (enableTimeout === true) {
      if (typeof BleUtil.highFrequencyScanUsers[id].timeout === 'function') {
        BleUtil.highFrequencyScanUsers[id].timeout();
        BleUtil.highFrequencyScanUsers[id].timeout = null;
      }
      BleUtil.highFrequencyScanUsers[id].timeout = Scheduler.scheduleCallback(() => {
        BleUtil.stopHighFrequencyScanning(id);
      }, timeoutDuration, 'BleUtil.highFrequencyScanUsers[id].timeout');
    }

    return () => { BleUtil.stopHighFrequencyScanning(id) };
  },

  stopHighFrequencyScanning: function(id) {
    if (BleUtil.highFrequencyScanUsers[id] !== undefined) {
      if (typeof BleUtil.highFrequencyScanUsers[id].timeout === 'function') {
        BleUtil.highFrequencyScanUsers[id].timeout();
        BleUtil.highFrequencyScanUsers[id].timeout = null;
      }
      delete BleUtil.highFrequencyScanUsers[id];
      if (Object.keys(BleUtil.highFrequencyScanUsers).length === 0) {
        LOGd.info("Stopping HF Scanning!");
        Bluenet.startScanningForCrownstonesUniqueOnly();
      }
    }
  },

  highFrequencyScanUsed: function() {
    return Object.keys(BleUtil.highFrequencyScanUsers).length > 0;
  }

};
















