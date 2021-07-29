import { Bluenet } from "../native/libInterface/Bluenet";
import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { SphereUtil } from "../util/SphereUtil";
import { core } from "../Core";
import { LOGi } from "../logging/Log";
import { DataUtil } from "../util/DataUtil";
import { TrackingNumberManager } from "./TrackingNumberManager";
import { AppState } from "react-native";
import { Scheduler } from "../logic/Scheduler";


class BroadcastStateManagerClass {
  _initialized : boolean = false;
  _advertising : boolean = false;
  _sphereIdInLocationState : string = null;

  updatePreferencesWhenActive = false;

  _listeners = [];

  _locationUidInLocationState = 0;

  _presentLocationInSphere = {};

  init() {
    // set event listener on:
    // - the tap to toggle change
    // - rssi offset change
    // - location state change (load on init)
    // We do not need to watch the foreground-background, this is done automatically
    // We need to start advertising when the peripheral is ready.
    if (this._initialized === false) {
      // console.log("INITIALIZING BroadcastStateManagerClass");
      this._listeners.push(core.eventBus.on("databaseChange", (data) => {
        let change = data.change;
        let reloadActiveSphereUpdate = false;
        let reloadDevicePreferences  = false;

        if (change.changeAppSettings || change.changeDeviceData || change.deviceTrackingTokenCycled || change.deviceTrackingTokenTried) {
          reloadDevicePreferences = true;
        }
        if (change.changeDeveloperData) {
          reloadDevicePreferences  = true;
          reloadActiveSphereUpdate = true;
          this._reloadAdvertisingState();
        }

        if (change.updateActiveSphere) {
          reloadActiveSphereUpdate = true;
        }

        if (reloadDevicePreferences)  {
          if (AppState.currentState !== 'active') {
            this.updatePreferencesWhenActive = true;
          }
          else {
            this._reloadDevicePreferences();
          }
        }
        if (reloadActiveSphereUpdate) { this._handleActiveSphereUpdate(); }
      }));

      this._listeners.push(core.eventBus.on("enterSphere", (enteringSphereId) => {
        LOGi.info("BroadcastStateManager: processing enter sphere", enteringSphereId)
        this._handleEnter(enteringSphereId);
        TrackingNumberManager.updateMyDeviceTrackingRegistration(enteringSphereId)
      }));

      this._listeners.push(core.eventBus.on("exitSphere", (exitSphereId) => {
        delete this._presentLocationInSphere[exitSphereId]
        LOGi.info("BroadcastStateManager: processing exit sphere");
        this._handleExitSphere(exitSphereId);
      }));

      this._listeners.push(core.nativeBus.on(core.nativeBus.topics.enterRoom, (data) => {// data = {region: sphereId, location: locationId}
        this._presentLocationInSphere[data.region] = data.location;
        LOGi.info("BroadcastStateManager: processing enter room in sphere", data.region, " location", data.location);
        this._handleEnter(data.region, data.location);
        TrackingNumberManager.updateMyDeviceTrackingRegistration(data.region);
      }));


      this._listeners.push(core.eventBus.on('AppStateChange', (appState) => {
        if (appState === 'active') {
          if (this.updatePreferencesWhenActive) {
            this.updatePreferencesWhenActive = false;
            this._reloadDevicePreferences()
          }
        }
      }));

      Bluenet.initBroadcasting();

      this._reloadAdvertisingState();
      this._handleActiveSphereUpdate();
      this._reloadDevicePreferences();
      this._initialized = true;
    }
  }

  destroy() {
    this._listeners.forEach((unsub) => { unsub() })
    this._stopAdvertising();
  }


  /**
   * We navigated to a sphere in the overview.
   * @private
   */
  _handleActiveSphereUpdate() {
    let state = core.store.getState();

    let amountOfPresentSpheres = SphereUtil.getAmountOfPresentSpheres(state);
    let presentSphere = SphereUtil.getPresentSphere(state);
    let activeSphereData = SphereUtil.getActiveSphere(state);

    // if there is 1 active sphere, ignore any and all switching of locationState

    // if there are 0 active spheres, we dont care what the user does. Stop broadcasting.
    if (amountOfPresentSpheres === 0) {
      if (activeSphereData.sphereId !== null) {
        let locationId = this._presentLocationInSphere[activeSphereData.sphereId] || null;
        return this._updateLocationState(activeSphereData.sphereId, locationId);
      }
      return this._stopAdvertising();
    }
    else if (amountOfPresentSpheres === 1) {
      if (presentSphere.sphereId) {
        let locationId = this._presentLocationInSphere[presentSphere.sphereId] || null;
        this._updateLocationState(presentSphere.sphereId, locationId);
      }
    }
    else {
      if (activeSphereData.sphere.state.present === false) {
        // do nothing since we are not in the new active sphere
      }
      else {
        // the sphere we navigated to is present, and there are more than 1 present spheres:
        let locationId = this._presentLocationInSphere[activeSphereData.sphereId] || null;
        this._updateLocationState(activeSphereData.sphereId, locationId);
      }
    }
  }



  _handleEnter(sphereId, locationId = null) {
    let state = core.store.getState();

    let amountOfSpheres = Object.keys(state.spheres).length;
    let activeSphereData = SphereUtil.getActiveSphere(state);

    if (amountOfSpheres === 0) {
      return this._stopAdvertising();
    }

    // this means we received an enter sphere event from the OS
    if (amountOfSpheres === 1) {
      // we only have one sphere, apply the state!
      return this._updateLocationState(sphereId, locationId);
    }

    // now handling the case where amountOfSpheres > 1

    // the active sphere has priority as long as it is present.
    if (activeSphereData?.sphere?.state?.present) {
      if (activeSphereData.sphereId === sphereId && locationId) {
        return this._updateLocationState(activeSphereData.sphereId, locationId);
      }
      // if the sphere that is active is also present, we set the locationState to that one.
      this._updateLocationState(activeSphereData.sphereId);
    }
    else {
      // if the sphere we are focusing on is not present, we set the locationState for the newly entered sphere
      this._updateLocationState(sphereId, locationId);
    }
  }


  /**
   * Handling an exit sphere event from the location handler
   * @param sphereId
   * @private
   */
  _handleExitSphere(sphereId) {
    let state = core.store.getState();
    let amountOfPresentSpheres = SphereUtil.getAmountOfPresentSpheres(state);
    let activeSphereData = SphereUtil.getActiveSphere(state);

    if (amountOfPresentSpheres === 0) {
      LOGi.info("Stopping the broadcasting. Leaving: ",state.spheres[sphereId].config.name);
      this._updateLocationState(activeSphereData.sphereId);
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



  /**
   * This uid will allow a user to "claim" a switch of a Crownstone to avoid alternatingly flickering between two broadcast commands.
   * @private
   */
  _getDeviceUID(state, sphere) {
    let device = DataUtil.getDevice(state);
    let deviceUID = 0;
    if (device) {
      deviceUID = device.uid || 0;
    }


    let userIndex = 0;
    if (sphere.users) {
      let sphereUserIds = Object.keys(sphere.users).sort();
      userIndex = sphereUserIds.indexOf(state.user.userId);

      if (userIndex === -1) {
        sphereUserIds.push(state.user.userId);
        sphereUserIds.sort();
        userIndex = sphereUserIds.indexOf(state.user.userId);
      }
    }

    // The format of the device token is as follows (bits)
    //
    // | 0 | 0 0 | 0 0 0 0 0 |
    //
    // first is wearable true: false (MSB)
    // second is the device index
    // third is the user index
    //
    // This method will force this format.
    return (userIndex % 32) + ((deviceUID % 4) << 5);
  }

  _updateLocationState(sphereId, locationId = null) {
    if (this._advertising === false) {
      this._startAdvertising();
    }

    let state = core.store.getState();
    let sphere = state.spheres[sphereId];
    let sphereUID = 0;
    let deviceUID = 0;
    let locationUID = 0;
    let profileId = 0;

    if (sphere) {
      deviceUID = this._getDeviceUID(state, sphere);

      let location = sphere.locations[locationId];
      locationUID  = location ? location.config.uid : 0;
      sphereUID    = sphere.config.uid;

      LOGi.info("Setting Sphere As Present:", sphere.config.name);
    }
    else {
      LOGi.info("Setting Custom Sphere As Present");
    }
    this._sphereIdInLocationState = sphereId;
    this._locationUidInLocationState = locationUID;

    LOGi.info("BroadcastStateManager: Setting Location State", "sphereUID", sphereUID, "locationUID", locationUID, "profileId", profileId, "deviceUID", deviceUID, "sphereId", sphereId)
    Bluenet.setLocationState(sphereUID, locationUID, profileId, deviceUID, sphereId);
  }


  _reloadAdvertisingState() {
    this._startAdvertising();
  }

  _startAdvertising() {
    BluenetPromiseWrapper.isPeripheralReady()
      .then(() => {
        LOGi.info("Bluenet.startAdvertising()");
        this._advertising = true;
        Bluenet.startAdvertising();
      });
  }

  _stopAdvertising() {
    BluenetPromiseWrapper.isPeripheralReady()
      .then(() => {
        LOGi.info("Bluenet.stopAdvertising()");
        this._sphereIdInLocationState = null;
        this._advertising = false;
        Bluenet.stopAdvertising();
      });
  }


  _reloadDevicePreferences() {
    let preferences = DataUtil.getDevicePreferences();
    LOGi.info("Bluenet.setDevicePreferences", preferences.rssiOffset, preferences.tapToToggleEnabled, preferences.ignoreForBehaviour, preferences.randomDeviceToken, preferences.activeRandomDeviceToken, preferences.useTimeBasedNonce, AppState.currentState);


    // if the active token is not the same as the random token and we have the possibility to change it (app is active (on screen))
    // we update the active token. This active token is used to always keep track of the last token that could have been broadcast in the background.
    if (preferences.activeRandomDeviceToken !== preferences.randomDeviceToken && AppState.currentState === "active") {
      let state = core.store.getState();
      core.store.dispatch({type:"SET_ACTIVE_RANDOM_DEVICE_TOKEN", deviceId: DataUtil.getDeviceIdFromState(state, state.user.appIdentifier), data: { activeRandomDeviceToken: preferences.randomDeviceToken }});
    }

    Bluenet.setDevicePreferences(
      preferences.rssiOffset,
      preferences.tapToToggleEnabled,
      preferences.ignoreForBehaviour,
      preferences.randomDeviceToken,
      preferences.useTimeBasedNonce
    );
  }

  getCurrentLocationUID() {
    return this._locationUidInLocationState;
  }

  getSphereInLocationState() {
    return this._sphereIdInLocationState;
  }



}

export const BroadcastStateManager = new BroadcastStateManagerClass();