import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { AppState } from "react-native";
import { StoneAvailabilityTracker } from "../native/advertisements/StoneAvailabilityTracker";
import { DataUtil } from "../util/DataUtil";
import { BroadcastStateManager } from "./BroadcastStateManager";
import { core } from "../core";
import { Scheduler } from "../logic/Scheduler";
import { LOGi } from "../logging/Log";
import { CommunicationWatchdog } from "./CommunicationWatchdog";

const TRIGGER_ID = "TrackingNumberManager";

class TrackingNumberManagerClass {
  initialized = false;
  canUseDynamicBackgroundBroadcasts = null;
  lastTimeTokenWasBumped = 0;
  lastTimeTokenWasCycled = 0;

  currentlyCyclingToken = false;
  _listeners = [];

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
      Scheduler.setRepeatingTrigger(TRIGGER_ID, {repeatEveryNSeconds: 3600} );
      Scheduler.loadOverwritableCallback( TRIGGER_ID, "REGISTRATION_UPDATE", this.updateMyDeviceTrackingRegistrationInActiveSphere.bind(this), false);

      core.eventBus.on('AppStateChange', (appState) => {
        if (appState === 'active') {
          // this.checkToCycle();
          this.updateMyDeviceTrackingRegistrationInActiveSphere();
        }
      });

      if (AppState.currentState === 'active') {
        // this.checkToCycle();
        this.updateMyDeviceTrackingRegistrationInActiveSphere();
      }
    }
  }

  // checkToCycle() {
  //   // do not do this too often.
  //   if (Date.now() - this.lastTimeTokenWasCycled < 16*60*1000) { // 16 hours
  //     return;
  //   }
  //   let sphereIdInLocationState = BroadcastStateManager.getSphereInLocationState();
  //   if (sphereIdInLocationState) {
  //     let state = core.store.getState();
  //     let sphere = state.spheres[sphereIdInLocationState];
  //     if (!sphere) return;
  //     if (sphere.state.present === true) {
  //       this.cycleMyDeviceTrackingToken(BroadcastStateManager.getSphereInLocationState());
  //     }
  //   }
  // }

  // cycleMyDeviceTrackingToken(sphereId) {
  //   LOGi.info("TrackingNumberManager: Cycle my device tracking registration for active sphere.");
  //   if (this.canUseDynamicBackgroundBroadcasts === null) {
  //     BluenetPromiseWrapper.canUseDynamicBackgroundBroadcasts()
  //       .then((canUse) => {
  //         if (canUse) { return; }
  //         this._cycleMyDeviceTrackingToken(sphereId);
  //       })
  //   }
  //   else if (this.canUseDynamicBackgroundBroadcasts === false) {
  //     this._cycleMyDeviceTrackingToken(sphereId);
  //   }
  // }


  updateMyDeviceTrackingRegistrationInActiveSphere() {
    LOGi.info("TrackingNumberManager: Update my device tracking registration for active sphere.");
    // do not do this too often.
    if (Date.now() - this.lastTimeTokenWasBumped < 1800000) { // 30 minuteus
      return;
    }
    if (BroadcastStateManager.getSphereInLocationState() !== null) {
      this.updateMyDeviceTrackingRegistration(BroadcastStateManager.getSphereInLocationState());
    }
  }


  updateMyDeviceTrackingRegistration(sphereId) {
    LOGi.info("TrackingNumberManager: Update my device tracking registration for sphere:", sphereId);
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


  _generateToken(token=null) {
    if (token === null) {
      token = Math.round(Math.random() * (1 << 24));
    }
    let state = core.store.getState();
    core.store.dispatch({type:"TRY_NEW_DEVICE_TOKEN", deviceId: DataUtil.getDeviceIdFromState(state, state.user.appIdentifier), data: { randomDeviceToken: token }})
    return token;
  }

  // _cycleMyDeviceTrackingToken(sphereId) {
  //   LOGi.info("TrackingNumberManager: Will cycle the deviceRandomTrackingToken. Appstate:", AppState.currentState);
  //   if (AppState.currentState === 'active') {
  //     LOGi.info("TrackingNumberManager: Cycling the deviceRandomTrackingToken...")
  //     // block other requests for registration based on the stored token.
  //     this.currentlyCyclingToken = true;
  //
  //     // connect to check availability
  //     let preferences = DataUtil.getDevicePreferences(sphereId);
  //     let originalToken = preferences.randomDeviceToken;
  //     let suggestedNewRandom = this._generateToken();
  //
  //     this._broadcastUpdateTrackedDevice(sphereId, suggestedNewRandom);
  //     StoneAvailabilityTracker.sendCommandToNearestCrownstones(
  //       sphereId,
  //       {
  //         commandName : 'registerTrackedDevice',
  //         trackingNumber: preferences.trackingNumber,
  //         locationUID: () => { return BroadcastStateManager.getCurrentLocationUID(); },
  //         profileId: 0,
  //         rssiOffset: preferences.rssiOffset,
  //         ignoreForPresence: preferences.ignoreForBehaviour,
  //         tapToToggleEnabled: preferences.tapToToggleEnabled,
  //         deviceToken: suggestedNewRandom,
  //         ttlMinutes: 120
  //       },
  //       1, 3)
  //       .then((promises: Promise<any>[]) => {
  //         return Promise.all(promises);
  //       })
  //       .then(() => {
  //         // No error! store the new registered token!
  //         let state = core.store.getState();
  //         core.store.dispatch({type:"CYCLE_RANDOM_DEVICE_TOKEN", deviceId: DataUtil.getDeviceIdFromState(state, state.user.appIdentifier), data: { randomDeviceToken: suggestedNewRandom}})
  //         this.lastTimeTokenWasCycled = Date.now();
  //         LOGi.info("TrackingNumberManager: Finished Cycling the deviceRandomTrackingToken!")
  //         this.currentlyCyclingToken = false;
  //       })
  //       .catch((err) => {
  //         LOGi.info("TrackingNumberManager: Finished Cycling the deviceRandomTrackingToken with error...", err)
  //         this.currentlyCyclingToken = false;
  //         if (err === "ERR_ALREADY_EXISTS") {
  //           LOGi.info("TrackingNumberManager: Retrying cycle of token", err)
  //           this._cycleMyDeviceTrackingToken(sphereId);
  //           return;
  //         }
  //
  //         // revert to old tracking token that WAS successfully set.
  //         let state = core.store.getState();
  //         core.store.dispatch({type:"CYCLE_RANDOM_DEVICE_TOKEN", deviceId: DataUtil.getDeviceIdFromState(state, state.user.appIdentifier), data: { randomDeviceToken: originalToken}});
  //         this._broadcastUpdateTrackedDevice(sphereId, originalToken);
  //       })
  //   }
  //   else {
  //     LOGi.info("TrackingNumberManager: Did not cycle due to Appstate:", AppState.currentState);
  //     // do not cycle.
  //     return
  //   }
  // }

  _broadcastUpdateTrackedDevice(sphereId, suggestedNewRandom=null) {
    this.lastTimeTokenWasBumped = Date.now();
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


  async _updateMyDeviceTrackingRegistration(sphereId) {
    LOGi.info("TrackingNumberManager: Executing device tracking registration update for sphere:", sphereId, "Current app state: ", AppState.currentState);
    let preferences = DataUtil.getDevicePreferences(sphereId);
    if (this.currentlyCyclingToken === false) {
      if (AppState.currentState === 'active') {
        // broadcast with update!
        if (preferences.randomDeviceTokenValidated || true) {
          this._broadcastUpdateTrackedDevice(sphereId);
        }
        else {
          // this._cycleMyDeviceTrackingToken(sphereId);
        }
      }
      else {
        // connect to two crownstones to update registration
        let updateTime = await CommunicationWatchdog.registerTrackedDevice(sphereId);
        this.lastTimeTokenWasBumped = updateTime || this.lastTimeTokenWasBumped;
      }
    }
    else {
      LOGi.info("TrackingNumberManager: Did not execute device tracking registration update for sphere:", sphereId, "due to cycling token");
    }
  }

}

export const TrackingNumberManager = new TrackingNumberManagerClass();