import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { Scheduler } from "../logic/Scheduler";
import { core } from "../core";
import { AppState, Platform } from "react-native";
import { BroadcastStateManager } from "./BroadcastStateManager";
import { StoneAvailabilityTracker } from "../native/advertisements/StoneAvailabilityTracker";
import { DataUtil } from "../util/DataUtil";

const TRIGGER_ID = "HeartbeatHandler";

class HeartbeatHandlerClass {
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
      Scheduler.setRepeatingTrigger(TRIGGER_ID, {repeatEveryNSeconds: 170} );
      Scheduler.loadOverwritableCallback( TRIGGER_ID, "TRACKED_DEVICES_HEARTBEAT", this.heartbeat.bind(this), false);

      core.eventBus.on('AppStateChange', (appState) => {
        if (appState === 'active') {
          // this.checkToCycle();
          Scheduler.pauseTrigger(TRIGGER_ID);
        }
        else if (appState === 'background') {
          Scheduler.resumeTrigger(TRIGGER_ID);
        }
      });

      if (AppState.currentState === 'background') {

      }
    }
  }

  heartbeat() {
    if (Platform.OS !== 'ios') { return }

    let activeSphereId = BroadcastStateManager.getSphereInLocationState();
    // this means we're broadcasting in an active sphere.
    if (activeSphereId !== null) {
      let preferences = DataUtil.getDevicePreferences(activeSphereId);

      StoneAvailabilityTracker.sendCommandToNearestCrownstones(
        activeSphereId,
        {
          commandName: 'trackedDeviceHeartbeat',
          trackingNumber: preferences.trackingNumber,
          locationUID: () => {
            return BroadcastStateManager.getCurrentLocationUID();
          },
          deviceToken: preferences.activeRandomDeviceToken, // we register the active token since this one is ALWAYS the same as the one we broadcast on the background.
          ttlMinutes: 3
        },
        2)
        .then((promises) => {
          return Promise.all(promises);
        })
        .catch((err) => {
          console.log("SOMETHING WENT WRONG", err)
        })

    }
  }
}
// 8, 0, 13541750, 3,


export const HeartbeatHandler = new HeartbeatHandlerClass();