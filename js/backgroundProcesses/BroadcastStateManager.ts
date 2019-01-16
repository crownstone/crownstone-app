import { eventBus } from "../util/EventBus";
import { Util } from "../util/Util";
import { Bluenet } from "../native/libInterface/Bluenet";
import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";


class BroadcastStateManagerClass {
  _store : any;
  _initialized : boolean = false;

  constructor() {

  }

  loadStore(store) {
    this._store = store;
    this._init()
  }


  _init() {
    // set event listener on:
    // - the tap to toggle change
    // - rssi offset change
    // - location state change (load on init)
    // We do not need to watch the foreground-background, this is done automatically
    // We need to start advertising when the peripheral is ready.
    if (this._initialized === false) {
      eventBus.on("databaseChange", (data) => {
        let change = data.change;
        if (change.changeAppSettings || change.changeDeviceData) {
          this._reloadDevicePreferences();
        }
        if (change.changeDeveloperData) {
          this._reloadAdvertisingState();
        }
      });

      this._reloadAdvertisingState();
      this._reloadDevicePreferences();
      this._initialized = true;
    }
  }


  _reloadAdvertisingState() {
    let state = this._store.getState();
    if (state.development.broadcasting_enabled) {
      BluenetPromiseWrapper.isPeripheralReady()
        .then(() => {
          // console.log("Bluenet.startAdvertising()")
          Bluenet.startAdvertising();
        });
    }
    else {
      BluenetPromiseWrapper.isPeripheralReady()
        .then(() => {
          // console.log("Bluenet.stopAdvertising()")
          Bluenet.stopAdvertising();
        });
    }
  }

  _reloadDevicePreferences() {
    let state = this._store.getState();

    let rssiOffset = 0;
    let tapToToggleEnabled = state.app.tapToToggleEnabled;

    // get device for rssi offset
    let device = Util.data.getDevice(state);
    if (device) {
      rssiOffset = device.rssiOffset;
    }

    Bluenet.setDevicePreferences(rssiOffset, tapToToggleEnabled);
  }

}

export const BroadcastStateManager = new BroadcastStateManagerClass()