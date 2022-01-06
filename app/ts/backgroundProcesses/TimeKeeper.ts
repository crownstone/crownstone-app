import {Scheduler} from "../logic/Scheduler";
import {core} from "../Core";
import {Util} from "../util/Util";
import {Bluenet} from "../native/libInterface/Bluenet";
import {AppState, Platform} from "react-native";
import {xUtil} from "../util/StandAloneUtil";
import {broadcast, tell, tellSphere} from "../logic/constellation/Tellers";
import {Get} from "../util/GetUtil";

const TRIGGER_ID = "TIME_KEEPER";


/**
 * This class is responsible for ensuring that the suntimes and the actual current time is communicated to the
 * Crownstones that are near us.
 */
class TimeKeeperClass {

  initialized = false;
  lastSetTimeBroadcastTimestamp = 0;

  lastTimeSet = 0;

  constructor() {}

  init() {
    if (this.initialized === false) {
      this.initialized = true;

      Scheduler.setRepeatingTrigger(TRIGGER_ID, {repeatEveryNSeconds:1*3600} );
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
      core.eventBus.on('AppStateChange', (appState) => {
        if (appState === 'active') {
          this._setTime()
        }
      });
      // broadcast on app open.
      core.eventBus.on('TIME_IS_NOT_SET', ({sphereId, stone}) => {
        this._setTimeForNewCrownstones(sphereId, stone);
      });


      // initial broadcast.
      if (AppState.currentState === 'active') {
        this._setTime();
      }
    }
  }

  /**
   * In case a Crownstone has rebooted and it will not get the time from its neighbours, this will ensure the time will be set.
   * @param sphereId
   * @param stone
   */
  _setTimeForNewCrownstones(sphereId: string, stone: StoneData) {
    let now = Date.now();
    if (now - this.lastSetTimeBroadcastTimestamp < 20000) {
      return;
    }
    this.lastSetTimeBroadcastTimestamp = Date.now();

    let sphere = Get.sphere(sphereId);
    if (!sphere) { return; }

    let suntimes = Util.getSunTimesInSecondsSinceMidnight(sphereId);

    if (AppState.currentState === 'active' || Platform.OS === 'android') {
      tell(stone).setTimeViaBroadcast(
        xUtil.nowToCrownstoneTime(),
        suntimes.sunrise,
        suntimes.sunset,
        false
      ).catch(() => {});
    }
    else {
      tell(stone).setTime().catch((err) => {})
    }
  }


  _updateSunTimes(sphereId) {
    let suntimes = Util.getSunTimesInSecondsSinceMidnight(sphereId);
    Bluenet.setSunTimes(suntimes.sunrise, suntimes.sunset, sphereId)
  }


  _setTime() {
    this.lastTimeSet = Date.now();
    let state = core.store.getState();
    let spheres = state.spheres;

    Object.keys(spheres).forEach((sphereId) => {
      let sphere = spheres[sphereId];
      let suntimes = Util.getSunTimesInSecondsSinceMidnight(sphereId);
      if (sphere.state.present === true) {
        if (AppState.currentState === 'active' || Platform.OS === 'android') {
          // broadcast
          broadcast(sphereId).setTimeViaBroadcast(xUtil.nowToCrownstoneTime(), suntimes.sunrise, suntimes.sunset, true).catch(() => {});
        }
        else {
          tellSphere(sphereId).setTime().catch((err) => { this.lastTimeSet = 0; })
          tellSphere(sphereId).setSunTimesViaConnection(suntimes.sunrise, suntimes.sunset).catch((err) => {})
        }
      }
    })
  }


}

export const TimeKeeper = new TimeKeeperClass();