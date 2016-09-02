import { NativeEventsBridge } from './NativeEventsBridge'
import { BlePromiseManager } from '../logic/BlePromiseManager'
import { BleActions, NativeEvents } from './Proxy';
import { mixin } from '../util/util';

let bleUtil = {
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

  getNearestSetupCrownstone: function() {
    this.cancelSearch();
    return this._getNearestCrownstoneFromEvent(NativeEvents.ble.nearestSetupCrownstone)
  },

  getNearestCrownstone: function() {
    this.cancelSearch();
    return this._getNearestCrownstoneFromEvent(NativeEvents.ble.nearestCrownstone)
  },

  _getNearestCrownstoneFromEvent: function(event) {
    return new Promise((resolve, reject) => {
      let count = 0;
      let lastUuid = '';

      let sortingCallback = (uuid) => {
        if (lastUuid === uuid) { count += 1; }
        else                   { count  = 0; }

        // two consecutive measurements is OK
        if (count == 1)
          finish(uuid);

        lastUuid = uuid;
      };

      let finish = (uuid) => {
        if (this.pendingSearch.timeout) {
          clearTimeout(this.pendingSearch.timeout);
        }
        this.pendingSearch.unsubscribe();
        this.pendingSearch = {};
        resolve(new SetupCrownstone(uuid));
      };
      this.pendingSearch.unsubscribe = NativeEventsBridge.bleEvents.on(event, (data) => {console.log("IN"); sortingCallback(data)});
      // if we cant find something in 10 seconds, we fail.
      this.pendingSearch.timeout = setTimeout(() => {
        this.pendingSearch.unsubscribe();
        this.pendingSearch = {};
        reject("Nothing Near");
      }, 10000);
    })
  },

  detectCrownstone: function(stone) {
    this.cancelSearch();
    return new Promise((resolve, reject) => {
      let count = 0;
      let unbind = {unsubscribe:()=>{}, timeout: undefined};
      let sortingCallback = (verifiedAdvertisement) => {
        if (verifiedAdvertisement.uuid === stone.config.bluetoothId)
          count += 1;

        // three consecutive measurements before timeout is OK
        if (count == 2)
          finish();
      };

      let finish = () => {
        if (unbind.timeout) {
          clearTimeout(unbind.timeout);
        }
        unbind.unsubscribe();
        resolve(true);
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

function getter() {
  let base = {};
  mixin(base,bleUtil);
  return base;
}

export const BLEutil = getter();

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
    return BlePromiseManager.register(() => {
      return BleActions.connect(this.bleHandle)
        .then(() => { return action(prop); })
        .then(() => { return BleActions.disconnect(); })
        .catch((err) => {
          console.log("switch Error:", err);
          return BleActions.phoneDisconnect();
        })
    }, {from:'connectAndSetSwitchState'});
  }
}

export class SetupCrownstone {
  constructor(bleHandle) {
    this.bleHandle = bleHandle;
  }

  connect() {
    return BleActions.connect(this.bleHandle);
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