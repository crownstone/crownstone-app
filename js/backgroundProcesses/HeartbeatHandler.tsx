import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { Scheduler } from "../logic/Scheduler";
import { core } from "../core";
import { AppState, Platform } from "react-native";
import { BroadcastStateManager } from "./BroadcastStateManager";
import { StoneAvailabilityTracker } from "../native/advertisements/StoneAvailabilityTracker";
import { DataUtil } from "../util/DataUtil";
import { CommunicationWatchdog } from "./CommunicationWatchdog";

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
    CommunicationWatchdog.trackedDeviceHeartbeat();
  }
}



export const HeartbeatHandler = new HeartbeatHandlerClass();