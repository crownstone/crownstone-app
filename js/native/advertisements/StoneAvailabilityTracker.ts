import { core } from "../../core";
import { DISABLE_TIMEOUT, FALLBACKS_ENABLED, KEEPALIVE_INTERVAL } from "../../ExternalConfig";
import { Scheduler } from "../../logic/Scheduler";

let RSSI_TIMEOUT = 5000;

const TRIGGER_ID = "StoneAvailabilityTracker"

class StoneAvailabilityTrackerClass {
  log = {};
  sphereLog = {}
  initialized = false;

  init() {
    if (this.initialized === false) {
      this.initialized = true;

      core.eventBus.on("iBeaconOfValidCrownstone",       (data) => { this._update(data, true); });
      core.eventBus.on("AdvertisementOfValidCrownstone", (data) => { this._update(data, false); });

      Scheduler.setRepeatingTrigger(TRIGGER_ID, {repeatEveryNSeconds: 4});
      Scheduler.loadCallback(TRIGGER_ID, this.notify.bind(this), false);
    }
  }

  notify() {
    let logStoneIds = Object.keys(this.log);
    let stoneIds = {};
    let sphereIds = {};

    let now = new Date().valueOf();

    for (let i = 0; i < logStoneIds.length; i++) {
      let stoneId = logStoneIds[i];
      //rssi has expired and we have not marked it yet. do it now.
      if (now - this.log[stoneId].t > RSSI_TIMEOUT && this.log[stoneId].rssi !== -1000) {
        stoneIds[stoneId] = true;
        sphereIds[this.log[stoneId].sphereId] = true;
        this.log[stoneId].rssi = -1000;
      }
      // stone is active. Cast.
      if (now - this.log[stoneId].t < RSSI_TIMEOUT) {
        stoneIds[stoneId] = true;
        sphereIds[this.log[stoneId].sphereId] = true;
      }
      // stone has expired and we will remove it.
      if (now - this.log[stoneId].t > DISABLE_TIMEOUT) {
        stoneIds[stoneId] = true;
        sphereIds[this.log[stoneId].sphereId] = true;

        // these have expired. Delete them.
        delete this.sphereLog[this.log[stoneId].sphereId][stoneId];
        delete this.log[stoneId];
      }
    }


    // cast if there is something to cast
    if (Object.keys(stoneIds).length > 0) {
      core.eventBus.emit("databaseChange", {change: {changeStoneState: {stoneIds, sphereIds}}}); // discover a new crownstone!
    }
  }

  _update(data, beacon) {
    if (this.sphereLog[data.sphereId] === undefined) {
      this.sphereLog[data.sphereId] = {};
    }

    if (this.log[data.stoneId] === undefined) {
      this.log[data.stoneId] = {t: null, beaconRssi: null, advRssi: null, sphereId: data.sphereId };
      // new Crownstone detected this run!
      let stoneIds = {};
      let sphereIds = {};
      stoneIds[data.stoneId] = true;
      sphereIds[data.sphereId] = true;
      core.eventBus.emit("databaseChange", {change: {changeStoneState: {stoneIds, sphereIds}}}); // discover a new crownstone!
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