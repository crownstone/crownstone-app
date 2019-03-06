import { eventBus } from "../util/EventBus";
import { Util } from "../util/Util";
import { Bluenet } from "../native/libInterface/Bluenet";
import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { SphereUtil } from "../util/SphereUtil";


class BroadcastStateManagerClass {
  _store : any;
  _initialized : boolean = false;
  _advertising : boolean = false;

  constructor() {}

  loadStore(store) {
    this._store = store;
  }


  init() {
    // set event listener on:
    // - the tap to toggle change
    // - rssi offset change
    // - location state change (load on init)
    // We do not need to watch the foreground-background, this is done automatically
    // We need to start advertising when the peripheral is ready.
    if (this._initialized === false) {
      console.log("INITIALIZING BroadcastStateManagerClass")
      eventBus.on("databaseChange", (data) => {
        let change = data.change;
        if (change.changeAppSettings || change.changeDeviceData) {
          this._reloadDevicePreferences();
        }
        if (change.changeDeveloperData) {
          this._reloadAdvertisingState();
        }

        if (change.updateActiveSphere) {
          this._reloadLocationState();
        }
      });

      eventBus.on("enterSphere", (enteringSphereId) => {
        this._reloadLocationState(enteringSphereId);
      });

      //TODO: have this respond to location changed, not just sphere changes

      this._reloadAdvertisingState();
      this._reloadDevicePreferences();
      this._initialized = true;
    }
  }


  _reloadLocationState(enteringSphereId?: string) {
    let state = this._store.getState();

    let amountOfPresentSpheres = SphereUtil.getAmountOfPresentSpheres(state);
    let activeSphereData = SphereUtil.getActiveSphere(state);

    if (enteringSphereId) {
      // this means we received an enter sphere event from the OS
      if (amountOfPresentSpheres === 0 || (amountOfPresentSpheres === 1 && activeSphereData.sphereId === enteringSphereId)) {
        // TODO: sphereUID, locationUID, profileID are currently 0,0,0
        Bluenet.setLocationState(0, 0, 0, enteringSphereId);
      }
    }
    else {
      // we navigated to a sphere in the overview
      // if there is 1 active sphere, ignore any and all switching of locationState

      // if there are 0 active spheres, we dont care what the user does. Stop broadcasting.
      if (amountOfPresentSpheres === 0) {
        this._stopAdvertising();
      }
      else {
        if (this._advertising === false && state.development.broadcasting_enabled === true) {
          this._startAdvertising();
        }

        if (amountOfPresentSpheres > 1) {
          if (activeSphereData.sphere.state.present === false) {
            // do nothing.
          }
          else {
            // the sphere we navigated to is present, and there are more than 1 present spheres:
            Bluenet.setLocationState(0, 0, 0, activeSphereData.sphereId);
          }
        }
      }
    }

  }

  _reloadAdvertisingState() {
    let state = this._store.getState();
    if (state.development.broadcasting_enabled) {
      this._startAdvertising();
    }
    else {
      this._stopAdvertising();
    }
  }

  _startAdvertising() {
    BluenetPromiseWrapper.isPeripheralReady()
      .then(() => {
        console.log("Bluenet.startAdvertising()")
        this._advertising = true;
        Bluenet.startAdvertising();
      });
  }

  _stopAdvertising() {
    BluenetPromiseWrapper.isPeripheralReady()
      .then(() => {
        console.log("Bluenet.stopAdvertising()")
        this._advertising = false;
        Bluenet.stopAdvertising();
      });
  }

  _reloadDevicePreferences() {
    let state = this._store.getState();

    let rssiOffset = 0;
    let tapToToggleEnabled = state.app.tapToToggleEnabled;

    // get device for rssi offset
    let device = Util.data.getDevice(state);
    if (device) {
      rssiOffset = device.rssiOffset || 0;
    }
    Bluenet.setDevicePreferences(rssiOffset, tapToToggleEnabled);
  }

}

export const BroadcastStateManager = new BroadcastStateManagerClass()