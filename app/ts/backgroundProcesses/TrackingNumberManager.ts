import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { AppState, Platform } from "react-native";
import { StoneAvailabilityTracker } from "../native/advertisements/StoneAvailabilityTracker";
import { DataUtil } from "../util/DataUtil";
import { BroadcastStateManager } from "./BroadcastStateManager";
import { core } from "../Core";
import { Scheduler } from "../logic/Scheduler";
import { LOGe, LOGi } from "../logging/Log";
import { tellSphere } from "../logic/constellation/Tellers";


const REGISTER_TRIGGER_ID = "TrackingNumberManager";
const HEARTBEAT_TRIGGER_ID = "HeartbeatHandler";

const UPDATE_TRACKING_REGISTRATION_INTERVAL = 3600;
const TRACKING_HEARTBEAT_INTERVAL = 170;

class TrackingNumberManagerClass {
  initialized = false;
  canUseDynamicBackgroundBroadcasts = null;
  lastTimeTokenWasBumped = 0;
  lastTimeTokenWasCycled = 0;

  currentlyCyclingToken = false;
  _listeners = [];

  _lastTimeRegistrationViaConnection = 0;
  _lastTimeRegistrationViaBroadcast = 0;
  _lastTimeHeartbeat = 0;

  constructor() {
    BluenetPromiseWrapper.canUseDynamicBackgroundBroadcasts()
      .then((result) => {
        this.canUseDynamicBackgroundBroadcasts = result;
      })
  }

  init() {
    if (this.initialized === false) {
      this.initialized = true;
      // update the _requests token every hour.
      Scheduler.setRepeatingTrigger(REGISTER_TRIGGER_ID, {repeatEveryNSeconds: UPDATE_TRACKING_REGISTRATION_INTERVAL} );
      Scheduler.loadOverwritableCallback( REGISTER_TRIGGER_ID, "REGISTRATION_UPDATE", this.updateMyDeviceTrackingRegistrationInActiveSphere.bind(this), false);

      Scheduler.setRepeatingTrigger(HEARTBEAT_TRIGGER_ID, {repeatEveryNSeconds: TRACKING_HEARTBEAT_INTERVAL} );
      Scheduler.loadOverwritableCallback( HEARTBEAT_TRIGGER_ID, "TRACKED_DEVICES_HEARTBEAT", this.heartbeat.bind(this), false);


      core.eventBus.on('AppStateChange', (appState) => {
        if (appState === 'active') {
          // this.checkToCycle();
          this.updateMyDeviceTrackingRegistrationInActiveSphere();
          Scheduler.pauseTrigger(HEARTBEAT_TRIGGER_ID);
        }
        else if (appState === 'background') {
          Scheduler.resumeTrigger(HEARTBEAT_TRIGGER_ID);
        }
      });

      if (AppState.currentState === 'active') {
        // this.checkToCycle();
        this.updateMyDeviceTrackingRegistrationInActiveSphere();
      }
    }
  }

  heartbeat() {
    if (Platform.OS !== 'ios') { return }

    let activeSphereId = BroadcastStateManager.getSphereInLocationState();
    // this means we're broadcasting in an active sphere.
    if (activeSphereId !== null) {
      let preferences = DataUtil.getDevicePreferences(activeSphereId);

      // we used to register the activeRandomDeviceToken since this one is ALWAYS the same as the one we broadcast on the background.
      // if the connections for heartbeat or register give errors, we cannot recover this while in the background. To be able to recover, we always register and track the randomDeviceToken.
      // this can mean that our broadcasted deviceToken might mismatch the token we use with connection. Worst case we have a ghost in a room for 2 hours.
      tellSphere(activeSphereId, 300).trackedDeviceHeartbeat(
        preferences.trackingNumber,
        () => { return BroadcastStateManager.getCurrentLocationUID(); },
        preferences.randomDeviceToken,
        3,
        {
          profileId: 0,
          rssiOffset: preferences.rssiOffset,
          ignoreForPresence: preferences.ignoreForBehaviour,
          tapToToggleEnabled: preferences.tapToToggleEnabled,
          ttlMinutes: 120
        }
      )
        .then(() => {
          this._lastTimeHeartbeat = Date.now();
        })
        .catch((err) => {
          LOGe.info("TrackingNumberManager: SOMETHING WENT WRONG IN heartbeat", err);
          if (err?.message === "ERR_NOT_FOUND") {
            return this._updateMyDeviceTrackingRegistration(activeSphereId);
          }
        })
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
  //   LOGi.info("TrackingNumberManager: Cycle my device tracking _requests for active sphere.");
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
    LOGi.info("TrackingNumberManager: Update my device tracking _requests for active sphere.");
    // do not do this too often.
    if (Date.now() - this.lastTimeTokenWasBumped < 1800000) { // 30 minuteus
      return;
    }
    if (BroadcastStateManager.getSphereInLocationState() !== null) {
      this.updateMyDeviceTrackingRegistration(BroadcastStateManager.getSphereInLocationState());
    }
  }


  updateMyDeviceTrackingRegistration(sphereId) {
    LOGi.info("TrackingNumberManager: Update my device tracking _requests for sphere:", sphereId);
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

  _cycleMyDeviceTrackingToken(sphereId) {
    LOGi.info("TrackingNumberManager: Will cycle the deviceRandomTrackingToken. Appstate:", AppState.currentState);
    LOGi.info("TrackingNumberManager: Cycling the deviceRandomTrackingToken...");
    // block other requests for _requests based on the stored token.
    this.currentlyCyclingToken = true;

    // connect to check availability
    let preferences = DataUtil.getDevicePreferences(sphereId);
    let originalToken = preferences.randomDeviceToken;
    let suggestedNewRandom = this._generateToken();

    if (AppState.currentState === 'active') {
      this._broadcastUpdateTrackedDevice(sphereId, suggestedNewRandom);
    }
    tellSphere(sphereId, 300).registerTrackedDevice(
      preferences.trackingNumber,
      () => { return BroadcastStateManager.getCurrentLocationUID(); },
      0,
      preferences.rssiOffset,
      preferences.ignoreForBehaviour,
      preferences.tapToToggleEnabled,
      suggestedNewRandom,
      120
    )
      .then(() => {
        // No error! store the new registered token!
        let state = core.store.getState();
        core.store.dispatch({type:"CYCLE_RANDOM_DEVICE_TOKEN", deviceId: DataUtil.getDeviceIdFromState(state, state.user.appIdentifier), data: { randomDeviceToken: suggestedNewRandom}})
        this._lastTimeRegistrationViaConnection = Date.now();
        this.lastTimeTokenWasCycled = Date.now();
        LOGi.info("TrackingNumberManager: Finished Cycling the deviceRandomTrackingToken!")
        this.currentlyCyclingToken = false;
      })
      .catch((err) => {
        LOGi.info("TrackingNumberManager: Finished Cycling the deviceRandomTrackingToken with error...", err)
        this.currentlyCyclingToken = false;
        if (err?.message === "ERR_ALREADY_EXISTS") {
          LOGi.info("TrackingNumberManager: Retrying cycle of token", err)
          this._cycleMyDeviceTrackingToken(sphereId);
          return;
        }

        // revert to old tracking token that WAS successfully set.
        let state = core.store.getState();
        core.store.dispatch({type:"CYCLE_RANDOM_DEVICE_TOKEN", deviceId: DataUtil.getDeviceIdFromState(state, state.user.appIdentifier), data: { randomDeviceToken: originalToken}});
        this._broadcastUpdateTrackedDevice(sphereId, originalToken);
      })
  }

  async _broadcastUpdateTrackedDevice(sphereId, suggestedNewRandom=null) {
    this.lastTimeTokenWasBumped = Date.now();
    let preferences = DataUtil.getDevicePreferences(sphereId);
    try {
      await BluenetPromiseWrapper.broadcastUpdateTrackedDevice(
        sphereId,
        preferences.trackingNumber,
        BroadcastStateManager.getCurrentLocationUID(),
        0,
        preferences.rssiOffset,
        preferences.ignoreForBehaviour,
        preferences.tapToToggleEnabled,
        suggestedNewRandom === null ? preferences.randomDeviceToken : suggestedNewRandom,
        120
      );
      this._lastTimeRegistrationViaBroadcast = Date.now();
    }
    catch (err) {

    }
  }


  async _updateMyDeviceTrackingRegistration(sphereId) {
    LOGi.info("TrackingNumberManager: Executing device tracking _requests update for sphere:", sphereId, "Current app state: ", AppState.currentState);
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
        // connect to two crownstones to update _requests
        let preferences = DataUtil.getDevicePreferences(sphereId);
        let updateTime  = null;
        try {
          // we used to register the active token since this one is ALWAYS the same as the one we broadcast on the background.
          // Except we cannot recover problems in the background if we do. We now use the random device token and prefer to trust the connections vs the broadcasts.
          await tellSphere(sphereId).registerTrackedDevice(
            preferences.trackingNumber,
            () => { return BroadcastStateManager.getCurrentLocationUID(); },
            0,
            preferences.rssiOffset,
            preferences.ignoreForBehaviour,
            preferences.tapToToggleEnabled,
            preferences.randomDeviceToken,
            120
          );
          updateTime = Date.now();
        }
        catch (err) {
          LOGe.info("TrackingNumberManager: SOMETHING WENT WRONG IN _updateMyDeviceTrackingRegistration", err);
          if (err?.message === "ERR_ALREADY_EXISTS") {
            this._cycleMyDeviceTrackingToken(sphereId);
          }
        }
        this._lastTimeRegistrationViaConnection = updateTime || this.lastTimeTokenWasBumped;
        this.lastTimeTokenWasBumped = updateTime || this.lastTimeTokenWasBumped;
      }
    }
    else {
      LOGi.info("TrackingNumberManager: Did not execute device tracking _requests update for sphere:", sphereId, "due to cycling token");
    }
  }

}

export const TrackingNumberManager = new TrackingNumberManagerClass();