import { Scheduler } from "../logic/Scheduler";
import { core } from "../core";
import { StoneAvailabilityTracker } from "../native/advertisements/StoneAvailabilityTracker";
import { BatchCommandHandler } from "../logic/BatchCommandHandler";
import { Util } from "../util/Util";
import { Bluenet } from "../native/libInterface/Bluenet";
import { AppState, Platform } from "react-native";
import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { StoneUtil } from "../util/StoneUtil";

const TRIGGER_ID = "TIME_KEEPER";

class TimeKeeperClass {

  initialized = false;

  constructor() {}

  init() {
    if (this.initialized === false) {
      this.initialized = true;

      Scheduler.setRepeatingTrigger(TRIGGER_ID, {repeatEveryNSeconds:4*3600} );
      Scheduler.loadOverwritableCallback( TRIGGER_ID, "TIME_SETTER", this._setTime.bind(this), false);

      core.eventBus.on("enterSphere", (enteringSphereId) => {
        this._updateSunTimes(enteringSphereId);
      });

      // set times initially.
      let state = core.store.getState();
      let spheres = state.spheres;
      Object.keys(spheres).forEach((sphereId) => {
        let sphere = spheres[sphereId];
        if (sphere.state.present === true) {
          this._updateSunTimes(sphereId);
        }
      })

      // broadcast on app open.
      AppState.addEventListener('change', (appState) => {
        if (appState === 'active') {
          this._setTime()
        }
      });


      // initial broadcast.
      if (AppState.currentState === 'active') {
        this._setTime();
      }
    }
  }

  _updateSunTimes(sphereId) {
    let suntimes = Util.getSunTimesInSecondsSinceMidnight(sphereId);
    Bluenet.setSunTimes(suntimes.sunrise, suntimes.sunset, sphereId)
  }

  _setTime() {
    let state = core.store.getState();
    let spheres = state.spheres;

    Object.keys(spheres).forEach((sphereId) => {
      let sphere = spheres[sphereId];
      let suntimes = Util.getSunTimesInSecondsSinceMidnight(sphereId);
      if (sphere.state.present === true) {

        if (AppState.currentState === 'active' || Platform.OS === 'android') {
          // broadcast
          BluenetPromiseWrapper.setTimeViaBroadcast(StoneUtil.nowToCrownstoneTime(), suntimes.sunrise, suntimes.sunset, sphereId).catch(() => {});
          return;
        }
        else {
          let stoneIds = Object.keys(sphere.stones);
          for (let i = 0; i < stoneIds.length; i++) {
            StoneAvailabilityTracker.setTrigger(sphereId, stoneIds[i], TRIGGER_ID, () => {
              BatchCommandHandler.loadPriority(sphere.stones[stoneIds[i]], stoneIds[i], sphereId, {commandName:"setTime"})
                .catch((err)=>{})
              BatchCommandHandler.loadPriority(sphere.stones[stoneIds[i]], stoneIds[i], sphereId, {commandName:"setSunTimes", sunriseSecondsSinceMidnight: suntimes.sunrise, sunsetSecondsSinceMidnight: suntimes.sunset})
                .catch((err)=>{})
              BatchCommandHandler.executePriority()
            })
          }
        }
      }
    })
  }


}

export const TimeKeeper = new TimeKeeperClass();