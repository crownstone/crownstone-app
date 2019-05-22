import { core } from "../../core";
import { DISABLE_TIMEOUT, FALLBACKS_ENABLED } from "../../ExternalConfig";

let RSSI_TIMEOUT = 5000;

class StoneAvailabilityTrackerClass {
  log = {};
  sphereLog = {}


  constructor() {
    core.eventBus.on("iBeaconOfValidCrownstone",       (data) => { this._update(data, true); });
    core.eventBus.on("AdvertisementOfValidCrownstone", (data) => { this._update(data, false); });
  }

  _update(data, beacon) {
    if (this.sphereLog[data.sphereId] === undefined) {
      this.sphereLog[data.sphereId] = {};
    }

    if (this.log[data.stoneId] === undefined) {
      this.log[data.stoneId] = {t: null, beaconRssi: null, advRssi: null };
    }

    if (this.sphereLog[data.sphereId][data.stoneId] === undefined) {
      this.sphereLog[data.sphereId][data.stoneId] = {t: null, beaconRssi: null, advRssi: null };
    }

    let now = new Date().valueOf();
    this.sphereLog[data.sphereId][data.stoneId].t = now;
    this.log[data.stoneId].t = now;
    if (beacon) {
      this.log[data.stoneId].beaconRssi = data.rssi;
      this.sphereLog[data.sphereId][data.stoneId].beaconRssi = data.rssi;
    }
    else {
      this.log[data.stoneId].beaconRssi = data.rssi;
      this.sphereLog[data.sphereId][data.stoneId].beaconRssi = data.rssi;
    }
  }

  getNearestStoneId(reduxIdMap : map, inTheLastNSeconds : number = 2, rssiThreshold = -100) {
    let ids = Object.keys(reduxIdMap);
    let nearestRssi = -1000;
    let nearestId = null;

    let timeThreshold = new Date().valueOf() - 1000 * inTheLastNSeconds;
    for (let i = 0; i < ids.length; i++) {
      let item = this.log[ids[i]];
      if (item && item.t >= timeThreshold && item.rssi > nearestRssi && (rssiThreshold === null || item.rssi > rssiThreshold)) {
        nearestRssi = item.rssi;
        nearestId = ids[i]
      }
    }

    return nearestId;
  }

  getRssi(stoneId) {
    if (this.log[stoneId]) {
      if (new Date().valueOf() - this.log[stoneId].t < RSSI_TIMEOUT) {
        return this.log[stoneId].beaconRssi || -1000;
      }
    }
    return -1000;
  }

  isDisabled(stoneId) {
    if (this.log[stoneId]) {
      if (new Date().valueOf() - this.log[stoneId].t < DISABLE_TIMEOUT) {
        return false;
      }
    }
    return true;
  }











  // TODO: this class should do some sort of fall back
  // _evaluateDisabledState(sphereId) {
  //   let state = core.store.getState();
  //   // check if there are any stones left that are not disabled.
  //   let stoneIds = Object.keys(state.spheres[sphereId].stones);
  //   let allDisabled = true;
  //   stoneIds.forEach((stoneId) => {
  //     if (StoneAvailabilityTracker.isDisabled(stoneId) === false) {
  //       allDisabled = false;
  //     }
  //   });
  //
  //   // fallback to ensure we never miss an enter or exit event caused by a bug in ios 10
  //   if (FALLBACKS_ENABLED) {
  //     // if we are in DFU, do not leave the sphere by fallback
  //     if (DfuStateHandler.areDfuStonesAvailable() !== true) {
  //       if (allDisabled === true) {
  //         LOGi.info("FALLBACK: StoneStateHandler: FORCE LEAVING SPHERE DUE TO ALL CROWNSTONES BEING DISABLED");
  //         LocationHandler.exitSphere(sphereId);
  //       }
  //     }
  //     else {
  //       // reschedule the fallback if we are in dfu.
  //       Scheduler.scheduleBackgroundCallback(() => { this._evaluateDisabledState(sphereId); }, DISABLE_TIMEOUT, "disable")
  //     }
  //   }
  // }
}

export const StoneAvailabilityTracker = new StoneAvailabilityTrackerClass();