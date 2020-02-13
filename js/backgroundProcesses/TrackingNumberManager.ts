import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { AppState } from "react-native";
import { StoneAvailabilityTracker } from "../native/advertisements/StoneAvailabilityTracker";
import { DataUtil } from "../util/DataUtil";
import { BroadcastStateManager } from "./BroadcastStateManager";
import { core } from "../core";
import { Scheduler } from "../logic/Scheduler";
import { LOGi } from "../logging/Log";

const TRIGGER_ID = "TrackingNumberManager";

class TrackingNumberManagerClass {
  initialized = false;
  canUseDynamicBackgroundBroadcasts = null;
  lastTimeTokenWasBumped = 0;
  lastTimeTokenWasCycled = 0;

  currentlyCyclingToken = false;

  constructor() {
    BluenetPromiseWrapper.canUseDynamicBackgroundBroadcasts()
      .then((result) => {
        this.canUseDynamicBackgroundBroadcasts = result;
      })
  }

  init() {
    if (this.initialized === false) {
      this.initialized = true;

      // update the registration token every hour.
      Scheduler.setRepeatingTrigger(TRIGGER_ID, {repeatEveryNSeconds:3600} );
      Scheduler.loadOverwritableCallback( TRIGGER_ID, "REGISTRATION_UPDATE", this.updateMyDeviceTrackingRegistrationInActiveSphere.bind(this), false);

      core.eventBus.on('AppStateChange', (appState) => {
        if (appState === 'active') {
          this.checkToCycle();
        }
      });

      if (AppState.currentState === 'active') {
        this.checkToCycle();
      }
    }
  }

  checkToCycle() {
    // do not do this too often.
    if (new Date().valueOf() - this.lastTimeTokenWasCycled < 16*60*1000) { // 16 hours
      return;
    }
    let sphereIdInLocationState = BroadcastStateManager.getSphereInLocationState();
    if (sphereIdInLocationState) {
      let state = core.store.getState();
      let sphere = state.spheres[sphereIdInLocationState];
      if (!sphere) return;
      if (sphere.state.present === true) {
        this.cycleMyDeviceTrackingToken(BroadcastStateManager.getSphereInLocationState());
      }
    }
  }

  cycleMyDeviceTrackingToken(sphereId) {
    if (this.canUseDynamicBackgroundBroadcasts === null) {
      BluenetPromiseWrapper.canUseDynamicBackgroundBroadcasts()
        .then((canUse) => {
          if (canUse) { return; }
          this._cycleMyDeviceTrackingToken(sphereId);
        })
    }
    else if (this.canUseDynamicBackgroundBroadcasts === false) {
      this._cycleMyDeviceTrackingToken(sphereId);
    }
  }


  updateMyDeviceTrackingRegistrationInActiveSphere() {
    // do not do this too often.
    if (new Date().valueOf() - this.lastTimeTokenWasBumped < 1800000) {
      return;
    }
    if (BroadcastStateManager.getSphereInLocationState() !== null) {
      this.updateMyDeviceTrackingRegistration(BroadcastStateManager.getSphereInLocationState());
    }
  }


  updateMyDeviceTrackingRegistration(sphereId) {
    if (this.canUseDynamicBackgroundBroadcasts === null) {
      BluenetPromiseWrapper.canUseDynamicBackgroundBroadcasts()
        .then((canUse) => {
          if (canUse) { return; }
          this._updateMyDeviceTrackingRegistration(sphereId);
        })
    }
    else if (this.canUseDynamicBackgroundBroadcasts === false) {
      this._updateMyDeviceTrackingRegistration(sphereId);
    }
  }


  _generateToken() {
    return Math.round(Math.random()*(1<<25));
  }

  _cycleMyDeviceTrackingToken(sphereId) {
    if (AppState.currentState === 'active') {
      LOGi.info("TrackingNumberManager: Cycling the deviceRandomTrackingToken...")
      // block other requests for registration based on the stored token.
      this.currentlyCyclingToken = true;

      // connect to check availability
      let preferences = DataUtil.getDevicePreferences(sphereId);
      let suggestedNewRandom = this._generateToken();
      this._broadcastUpdateTrackedDevice(sphereId, suggestedNewRandom);
      StoneAvailabilityTracker.sendCommandToNearestCrownstones(
        sphereId,
        {
          commandName : 'registerTrackedDevice',
          trackingNumber: preferences.trackingNumber,
          locationUID: () => { return BroadcastStateManager.getCurrentLocationUID(); },
          profileId: 0,
          rssiOffset: preferences.rssiOffset,
          ignoreForPresence: preferences.ignoreForBehaviour,
          tapToToggleEnabled: preferences.tapToToggleEnabled,
          deviceToken: suggestedNewRandom,
          ttlMinutes: 120
        },
        1)
        .then((promises: Promise<any>[]) => {
          return Promise.all(promises);
        })
        .then((results) => {
          // No error! store the new registered token!
          let state = core.store.getState();
          core.store.dispatch({type:"CYCLE_RANDOM_DEVICE_TOKEN", deviceId: DataUtil.getDeviceIdFromState(state, state.user.appIdentifier), data: { randomDeviceToken: suggestedNewRandom}})
          this.lastTimeTokenWasCycled = new Date().valueOf();
          LOGi.info("TrackingNumberManager: Finished Cycling the deviceRandomTrackingToken...")
          this.currentlyCyclingToken = false;
        })
        .catch((err) => {
          if (err === "ERR_ALREADY_EXISTS") {
            this._cycleMyDeviceTrackingToken(sphereId);
          }
          LOGi.info("TrackingNumberManager: Finished Cycling the deviceRandomTrackingToken with error...")
          this.currentlyCyclingToken = false;
        })
    }
    else {
      // do not cycle.
      return
    }
  }

  _broadcastUpdateTrackedDevice(sphereId, suggestedNewRandom=null) {
    this.lastTimeTokenWasBumped = new Date().valueOf();
    let preferences = DataUtil.getDevicePreferences(sphereId);
    BluenetPromiseWrapper.broadcastUpdateTrackedDevice(
      sphereId,
      preferences.trackingNumber,
      BroadcastStateManager.getCurrentLocationUID(),
      0,
      preferences.rssiOffset,
      preferences.ignoreForBehaviour,
      preferences.tapToToggleEnabled,
      suggestedNewRandom === null ? preferences.randomDeviceToken : suggestedNewRandom,
      120
    ).catch(()=>{})
  }


  _updateMyDeviceTrackingRegistration(sphereId) {
    let preferences = DataUtil.getDevicePreferences(sphereId);
    if (this.currentlyCyclingToken === false) {
      if (AppState.currentState === 'active') {
        // broadcast with update!
        if (preferences.randomDeviceTokenValidated) {
          this._broadcastUpdateTrackedDevice(sphereId);
        }
        else {
          this._cycleMyDeviceTrackingToken(sphereId);
        }
      }
      else {
        // connect to two crownstones to update registration
        StoneAvailabilityTracker.sendCommandToNearestCrownstones(
          sphereId,
          {
            commandName: 'registerTrackedDevice',
            trackingNumber: preferences.trackingNumber,
            locationUID: () => {
              return BroadcastStateManager.getCurrentLocationUID();
            },
            profileId: 0,
            rssiOffset: preferences.rssiOffset,
            ignoreForPresence: preferences.ignoreForBehaviour,
            tapToToggleEnabled: preferences.tapToToggleEnabled,
            deviceToken: preferences.randomDeviceToken,
            ttlMinutes: 120
          },
          2)
          .then(() => {
            this.lastTimeTokenWasBumped = new Date().valueOf();
          })
          .catch(() => {
          })
      }
    }
  }

}

export const TrackingNumberManager = new TrackingNumberManagerClass();