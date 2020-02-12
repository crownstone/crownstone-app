import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { AppState } from "react-native";
import { StoneAvailabilityTracker } from "../native/advertisements/StoneAvailabilityTracker";
import { DataUtil } from "../util/DataUtil";
import { BroadcastStateManager } from "./BroadcastStateManager";


class TrackingNumberManagerClass {

  canUseDynamicBackgroundBroadcasts = null;


  constructor() {
    BluenetPromiseWrapper.canUseDynamicBackgroundBroadcasts()
      .then((result) => {
        this.canUseDynamicBackgroundBroadcasts = result;
      })
  }

  init() {}

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



  _cycleMyDeviceTrackingToken(sphereId) {
    console.log("CYCLE INIT")
    if (AppState.currentState === 'active') {
      console.log("CYCLE START")
      // connect to check availability
      let preferences = DataUtil.getDevicePreferences(sphereId);
      console.log("Preferences", preferences)
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
          deviceToken: preferences.randomDeviceToken,
          ttlMinutes: 120
        },
        1)
        .then((promises: Promise<any>[]) => {
          console.log("Promise HERE", promises)
          return Promise.all(promises);
        })
        .then((results) => {
          console.log("results", results)
        })
        .catch((err) => {
          console.log("ERR", err)
        })
      // broadcast!
    }
    else {
      // do not cycle.
      return
    }
  }



  _updateMyDeviceTrackingRegistration(sphereId) {
    let preferences = DataUtil.getDevicePreferences(sphereId);
    if (AppState.currentState === 'active') {
      // broadcast with update!
      BluenetPromiseWrapper.broadcastUpdateTrackedDevice(
        sphereId,
        preferences.trackingNumber,
        BroadcastStateManager.getCurrentLocationUID(),
        0,
        preferences.rssiOffset,
        preferences.ignoreForBehaviour,
        preferences.tapToToggleEnabled,
        preferences.randomDeviceToken,
        120
      ).catch(()=>{})
    }
    else {
      // connect to two crownstones to update registration
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
          deviceToken: preferences.randomDeviceToken,
          ttlMinutes: 120
        },
        2);
    }
  }

}

export const TrackingNumberManager = new TrackingNumberManagerClass();