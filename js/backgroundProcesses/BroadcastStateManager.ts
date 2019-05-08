import { Util } from "../util/Util";
import { Bluenet } from "../native/libInterface/Bluenet";
import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { SphereUtil } from "../util/SphereUtil";
import { core } from "../core";


class BroadcastStateManagerClass {
  _initialized : boolean = false;
  _advertising : boolean = false;
  _advertisingEnabled : boolean = false;
  _sphereIdInLocationState : string = null;


  init() {
    // set event listener on:
    // - the tap to toggle change
    // - rssi offset change
    // - location state change (load on init)
    // We do not need to watch the foreground-background, this is done automatically
    // We need to start advertising when the peripheral is ready.
    if (this._initialized === false) {
      let state = core.store.getState();
      this._advertisingEnabled = state.development.broadcasting_enabled;

      console.log("INITIALIZING BroadcastStateManagerClass");
      core.eventBus.on("databaseChange", (data) => {
        let change = data.change;
        if (change.changeAppSettings || change.changeDeviceData) {
          this._reloadDevicePreferences();
        }
        if (change.changeDeveloperData) {
          this._reloadAdvertisingState();
          this._handleActiveSphereUpdate();
          this._reloadDevicePreferences();
        }

        if (change.updateActiveSphere) {
          this._handleActiveSphereUpdate();
        }
      });

      core.eventBus.on("enterSphere", (enteringSphereId) => {
        this._handleEnterSphere(enteringSphereId);
      });

      core.eventBus.on("exitSphere", (exitSphereId) => {
        this._handleExitSphere(exitSphereId);
      });

      //TODO: have this respond to location changed, not just sphere changes

      this._reloadAdvertisingState();
      this._handleActiveSphereUpdate();
      this._reloadDevicePreferences();
      this._initialized = true;
    }
  }


  /**
   * We navigated to a sphere in the overview.
   * @private
   */
  _handleActiveSphereUpdate() {
    if (this._advertisingEnabled === false) { return; }

    let state = core.store.getState();

    let amountOfPresentSpheres = SphereUtil.getAmountOfPresentSpheres(state);
    let presentSphere = SphereUtil.getPresentSphere(state);
    let activeSphereData = SphereUtil.getActiveSphere(state);

    // if there is 1 active sphere, ignore any and all switching of locationState

    // if there are 0 active spheres, we dont care what the user does. Stop broadcasting.
    if (amountOfPresentSpheres === 0) {
      return this._stopAdvertising();
    }
    else if (amountOfPresentSpheres === 1) {
      if (presentSphere.sphereId) {
        this._updateLocationState(presentSphere.sphereId);
      }
    }
    else {
      if (activeSphereData.sphere.state.present === false) {
        // do nothing since we are not in the new active sphere
      }
      else {
        // the sphere we navigated to is present, and there are more than 1 present spheres:
        this._updateLocationState(activeSphereData.sphereId);
      }
    }
  }



  _handleEnterSphere(sphereId) {
    if (this._advertisingEnabled === false) { return; }

    let state = core.store.getState();

    let amountOfSpheres = Object.keys(state.spheres).length;
    let activeSphereData = SphereUtil.getActiveSphere(state);

    if (amountOfSpheres === 0) {
      return this._stopAdvertising();
    }

    // this means we received an enter sphere event from the OS
    if (amountOfSpheres === 1) {
      // we only have one sphere, apply the state!
      return this._updateLocationState(sphereId);
    }

    // now handling the case where amountOfSpheres > 1

    // the active sphere has priority as long as it is present.
    if (activeSphereData.sphere.state.present) {
      // if the sphere that is active is also present, we set the locationState to that one.
      this._updateLocationState(activeSphereData.sphereId);
    }
    else {
      // if the sphere we are focusing on is not present, we set the locationState for the newly entered sphere
      this._updateLocationState(sphereId);
    }
  }


  /**
   * Handling an exit sphere event from the location handler
   * @param sphereId
   * @private
   */
  _handleExitSphere(sphereId) {
    if (this._advertisingEnabled === false) { return; }

    let state = core.store.getState();
    let amountOfPresentSpheres = SphereUtil.getAmountOfPresentSpheres(state);
    let activeSphereData = SphereUtil.getActiveSphere(state);

    if (amountOfPresentSpheres === 0) {
      console.log("Stopping the broadcasting. Leaving: ",state.spheres[sphereId].config.name);
      return this._stopAdvertising();
    }

    if (sphereId === this._sphereIdInLocationState) {
      // we are broadcasting the sphere that we are leaving, change it to another present sphere, preferably the active one.
      if (activeSphereData.sphere.state.present) {
        // if the sphere that is active is also present, we set the locationState to that one.
        this._updateLocationState(activeSphereData.sphereId);
      }
      else {
        let presentSphereData = SphereUtil.getPresentSphere(state);
        if (presentSphereData.sphereId) {
          // set another sphere that we're present in as our target.
          this._updateLocationState(presentSphereData.sphereId);
        }
      }
    }
  }



  _updateLocationState(sphereId) {
    if (this._advertising === false) {
      this._startAdvertising();
    }

    let state = core.store.getState();
    console.log("Settings Sphere As Present:",state.spheres[sphereId].config.name);
    this._sphereIdInLocationState = sphereId;
    Bluenet.setLocationState(0, 0, 0, sphereId);
  }

  _reloadAdvertisingState() {
    let state = core.store.getState();
    this._advertisingEnabled = state.development.broadcasting_enabled;
    if (this._advertisingEnabled) {
      this._startAdvertising();
    }
    else {
      this._stopAdvertising();
    }
  }

  _startAdvertising() {
    BluenetPromiseWrapper.isPeripheralReady()
      .then(() => {
        console.log("Bluenet.startAdvertising()");
        this._advertising = true;
        Bluenet.startAdvertising();
      });
  }

  _stopAdvertising() {
    BluenetPromiseWrapper.isPeripheralReady()
      .then(() => {
        console.log("Bluenet.stopAdvertising()");
        this._sphereIdInLocationState = null;
        this._advertising = false;
        Bluenet.stopAdvertising();
      });
  }

  _reloadDevicePreferences() {
    let state = core.store.getState();

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

export const BroadcastStateManager = new BroadcastStateManagerClass();