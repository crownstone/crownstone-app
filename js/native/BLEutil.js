import { NativeEventsBridge } from './NativeEventsBridge'
import { BlePromiseManager } from '../logic/BlePromiseManager'
import { BleActions, NativeEvents } from './Proxy';

export const BLEutil = {
  pendingSearch: {},

  cancelSearch: function() {
    if (this.pendingSearch.timeout) {
      clearTimeout(this.pendingSearch.timeout);
    }
    if (this.pendingSearch.unsubscribe) {
      this.pendingSearch.unsubscribe();
    }
    this.pendingSearch = {};
  },

  getNearestSetupCrownstone: function(near = true) {
    let distanceThreshold = -120;
    if (near === true) {
      distanceThreshold = -95; // keep low tx in mind
    }
    this.cancelSearch();
    return this._getNearestCrownstoneFromEvent(NativeEvents.ble.nearestSetupCrownstone, distanceThreshold).then((handle) => {return new SetupCrownstone(handle);})
  },

  getNearestCrownstone: function(near = true) {
    let distanceThreshold = -120;
    if (near === true) {
      distanceThreshold = -80;
    }
    this.cancelSearch();
    return this._getNearestCrownstoneFromEvent(NativeEvents.ble.nearestCrownstone, distanceThreshold)
  },

  _getNearestCrownstoneFromEvent: function(event, distanceThreshold) {
    return new Promise((resolve, reject) => {
      let count = 0;
      let lastHandle = '';
      let lastRSSI = -120;

      let sortingCallback = (nearestItem) => {
        if (typeof nearestItem == 'string') {
          nearestItem = JSON.parse(nearestItem);
        }

        console.log("nearestItem", nearestItem, event);

        // do not care for items too far away.
        if (nearestItem.rssi < distanceThreshold || nearestItem.rssi >= 0) {
          return;
        }

        // check if the new one is in fact nearer (with an uncertainty of 10db)
        if (nearestItem.handle === lastHandle && nearestItem.rssi >= lastRSSI-10) {
          count += 1;
          lastRSSI = nearestItem.rssi;
        }
        else {
          count  = 0;
        }

        // two consecutive measurements is OK
        if (count == 1)
          finish(lastHandle);

        lastHandle = nearestItem.handle;
      };

      let finish = (uuid) => {
        if (this.pendingSearch.timeout) {
          clearTimeout(this.pendingSearch.timeout);
        }
        this.pendingSearch.unsubscribe();
        this.pendingSearch = {};
        resolve(uuid);
      };
      this.pendingSearch.unsubscribe = NativeEventsBridge.bleEvents.on(event, (data) => {sortingCallback(data)});
      // if we cant find something in 10 seconds, we fail.
      this.pendingSearch.timeout = setTimeout(() => {
        this.pendingSearch.unsubscribe();
        this.pendingSearch = {};
        reject("Nothing Near");
      }, 10000);
    })
  },

  detectCrownstone: function(stoneHandle) {
    this.cancelSearch();
    return new Promise((resolve, reject) => {
      let count = 0;
      let unbind = {unsubscribe:()=>{}, timeout: undefined};
      let sortingCallback = (verifiedAdvertisement) => {
        if (verifiedAdvertisement.uuid === stoneHandle)
          count += 1;

        // three consecutive measurements before timeout is OK
        if (count == 2)
          finish(verifiedAdvertisement);
      };

      let finish = (verifiedAdvertisement) => {
        if (unbind.timeout) {
          clearTimeout(unbind.timeout);
        }
        unbind.unsubscribe();
        resolve(verifiedAdvertisement.setupPackage);
      };
      unbind.unsubscribe = NativeEventsBridge.bleEvents.on(NativeEvents.ble.verifiedAdvertisementData, sortingCallback);

      // if we cant find something in 10 seconds, we fail.
      unbind.timeout = setTimeout(() => {
        unbind.unsubscribe();
        reject(false);
      }, 10000);
    })
  },

  getProxy: function (bleHandle) {
    return new SingleCommand(bleHandle)
  },

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
    console.log("connecting to ", this.bleHandle, "doing this: ", action, "with prop", prop)
    return BlePromiseManager.register(() => {
      return BleActions.connect(this.bleHandle)
        .then(() => { return action(prop); })
        .then(() => { return BleActions.disconnect(); })
        .catch((err) => {
          console.log("BLE Error:", err);
          return BleActions.phoneDisconnect();
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

  getBluetoothId() {
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