import { core } from "../../Core";
import { Scheduler } from "../../logic/Scheduler";
import { DISABLE_TIMEOUT } from "../../ExternalConfig";
import { LOGd, LOGv } from "../../logging/Log";
import {StoneProximityTrigger} from "./StoneProximityTrigger";

const RSSI_TIMEOUT_MS = 5000;
const RSSI_THRESHOLD  = 3;
const INVALID_RSSI    = -1000;

const TRIGGER_ID = "StoneTracker"

/**
 * This class gathers all incoming advertisments and constructs a map which indicates the last known RSSI's as well
 * as which Crownstones are alive on the mesh.
 *
 * It is in charge of notifying the rest of the app for significant updates as well as newly discovered Crownstones.
 *
 * It contains a number of util methods to get RSSI as well as disabled checks.
 */
export class StoneAvailabilityTrackerClass {
  log : logFormat = {};
  sphereLog : sphereLogFormat = {}
  initialized = false;

  handleMap = {};

  triggers : triggerFormat = {};

  init() {
    if (this.initialized === false) {
      this.initialized = true;

      core.eventBus.on("iBeaconOfValidCrownstone",       (data) => { this._update(data); });
      core.eventBus.on("AdvertisementOfValidCrownstone", (data) => { this._update(data); });
      core.eventBus.on("databaseChange", (data) => {
        let change = data.change;

        if (change.removeSphere) {
          this._sanitize();
          return;
        }
      });

      Scheduler.setRepeatingTrigger(TRIGGER_ID, {repeatEveryNSeconds: 4});
      Scheduler.loadCallback(TRIGGER_ID, this.notify.bind(this), false);
    }
  }

  reset() {
    this.log = {};
    this.sphereLog = {}
    this.handleMap = {};
    this.triggers = {};
  }


  /**
   * Periodically checking if we have to notify the system about new Crownstones.
   * @param data
   */
  notify() {
    let logStoneIds = Object.keys(this.log);
    let availabilityStoneIds = {};
    let availabilitySphereIds = {};

    let rssiChangeStoneIds = {};
    let rssiChangeSphereIds = {};

    let disabledSpheres = {};
    let now = Date.now();

    for (let i = 0; i < logStoneIds.length; i++) {
      let stoneId = logStoneIds[i];
      let logData = this.log[stoneId];

      // rssi has expired and we have not marked it yet. do it now.
      if (now - logData.t > RSSI_TIMEOUT_MS && logData.rssi !== INVALID_RSSI) {
        availabilityStoneIds[stoneId] = true;
        availabilitySphereIds[logData.sphereId] = true;
        logData.rssi = INVALID_RSSI;
      }

      // stone is active. Cast.
      if (now - logData.t < RSSI_TIMEOUT_MS && Math.abs(logData.rssi - logData.lastNotifiedRssi) > RSSI_THRESHOLD) {
        rssiChangeStoneIds[stoneId] = true;
        rssiChangeSphereIds[logData.sphereId] = true;
        logData.lastNotifiedRssi = logData.rssi;
      }

      // stone has expired and we will remove it.
      if (now - logData.t > DISABLE_TIMEOUT) {
        availabilityStoneIds[stoneId] = true;
        availabilitySphereIds[logData.sphereId] = true;

        // these have expired. Delete them.
        disabledSpheres[logData.sphereId] = true;
        if (this.sphereLog[logData.sphereId]) {
          delete this.sphereLog[logData.sphereId][stoneId];
        }
        else {
          delete this.sphereLog[logData.sphereId];
        }
        delete this.log[stoneId];
      }
    }

    // cast if there is something to cast
    if (Object.keys(availabilityStoneIds).length > 0) {
      core.eventBus.emit("databaseChange", {change: {changeStoneAvailability: {stoneIds: availabilityStoneIds, sphereIds: availabilitySphereIds}}}); // discover a new crownstone!
    }

    // cast if there is something to cast
    if (Object.keys(rssiChangeStoneIds).length > 0) {
      core.eventBus.emit("databaseChange", {change: {changeStoneRSSI: {stoneIds: rssiChangeStoneIds, sphereIds: rssiChangeSphereIds}}}); // significant RSSI change.
    }
  }


  /**
   * Clean up after sphere removal.
   * @private
   */
  _sanitize() {
    let state = core.store.getState();
    let spheres = state.spheres;
    let sphereIds = Object.keys(spheres);

    let sphereIdsInList = Object.keys(this.sphereLog);
    sphereIdsInList.forEach((sphereIdInList) => {
      if (sphereIds[sphereIdInList] === undefined) {
        let stoneIdsToClean = Object.keys(this.sphereLog[sphereIdInList]);
        stoneIdsToClean.forEach((stoneId) => {
          delete this.log[stoneId];
        })
        delete this.sphereLog[sphereIdInList];
      }
    })
  }



  _update(data) {
    LOGd.native("StoneAvailabilityTracker: Updating data", data);
    if (this.sphereLog[data.sphereId] === undefined) {
      LOGv.native("StoneAvailabilityTracker: Creating Sphere Log field for this sphere");
      this.sphereLog[data.sphereId] = {};
    }

    let now = Date.now();

    let registerStoneId = (stoneId, sphereId, rssi) => {
      // store the handle so we can quickly check if we have an RSSI value for a handle.
      this.handleMap[data.handle] = stoneId;

      LOGv.native("StoneAvailabilityTracker: registerStoneId stoneId, sphereId, rssi", stoneId, sphereId, rssi);
      if (this.log[stoneId] === undefined) {
        LOGd.native("StoneAvailabilityTracker: registerStoneId storing in LOG stoneId, sphereId, rssi", stoneId, sphereId, rssi);
        this.log[stoneId] = {t: now, rssi: data.rssi, sphereId: sphereId, lastNotifiedRssi: rssi, handle: data.handle || null };
        // new Crownstone detected this run!
        let stoneIds  = {};
        let sphereIds = {};
        stoneIds[stoneId]   = true;
        sphereIds[sphereId] = true;
        core.eventBus.emitAfterTick("databaseChange", {change: {changeStoneAvailability: {stoneIds, sphereIds}}}); // discover a new crownstone!

        if (rssi) { core.eventBus.emitAfterTick("rssiChange", {stoneId: stoneId, sphereId: sphereId, rssi: rssi}); }// Major change in RSSI
      }

      if (this.sphereLog[sphereId][stoneId] === undefined) {
        this.sphereLog[sphereId][stoneId] = {t: now, rssi: null, handle: null };
      }

      this.sphereLog[sphereId][data.stoneId].t = now;
      this.log[stoneId].t = now;

    }

    // add stone that has broadcast this advertisment
    registerStoneId(data.stoneId, data.sphereId, data.rssi);
    // add stone that has been relayed by this advertisement via the mesh. If this is not a mesh message,
    // the payloadId and stoneId are the same and this call does nothing.
    if (data.payloadId !== undefined && data.stoneId !== data.payloadId) {
      registerStoneId(data.payloadId, data.sphereId, null);
    }

    let prevRSSI = this.log[data.stoneId].rssi;
    if (prevRSSI === INVALID_RSSI) { prevRSSI = data.rssi; }

    let newRSSI = 0.7*prevRSSI + 0.3*data.rssi;
    this.log[data.stoneId].rssi = newRSSI;
    this.sphereLog[data.sphereId][data.stoneId].rssi = newRSSI;

    StoneProximityTrigger.handleTriggers(data.sphereId, data.stoneId, data.rssi);

    if (data.handle) {
      LOGv.native("StoneAvailabilityTracker: Storing data in logs");
      this.log[data.stoneId].handle = data.handle;
      this.sphereLog[data.sphereId][data.stoneId].handle = data.handle;
    }

    if (Math.abs(newRSSI - prevRSSI) > 3*RSSI_THRESHOLD) {
      core.eventBus.emit("rssiChange", {stoneId: data.stoneId, sphereId: data.sphereId, rssi:data.rssi}); // Major change in RSSI
    }

    LOGv.native("StoneAvailabilityTracker: Resulting logs after update for this stone:", this.log[data.stoneId], this.sphereLog[data.sphereId][data.stoneId]);
  }



  getNearestStoneId(reduxIdMap : map, inTheLastNSeconds : number = 2, rssiThreshold = -100) {
    let ids = Object.keys(reduxIdMap);
    let nearestRssi = INVALID_RSSI;
    let nearestId = null;

    let timeThreshold = Date.now() - 1000 * inTheLastNSeconds;
    for (let i = 0; i < ids.length; i++) {
      let item = this.log[ids[i]];
      if (item && item.handle && item.t >= timeThreshold && item.rssi > nearestRssi && (rssiThreshold === null || item.rssi > rssiThreshold)) {
        nearestRssi = item.rssi;
        nearestId = ids[i]
      }
    }

    return nearestId;
  }



  getNearestStoneIds(stoneIds : string[], inTheLastNSeconds : number = 2, amount= 1, rssiThreshold = -100) {
    let nearestIds = [];
    let contenders = [];

    let timeThreshold = Date.now() - 1000 * inTheLastNSeconds;
    for (let i = 0; i < stoneIds.length; i++) {
      let item = this.log[stoneIds[i]];
      if (item) {
        if (item.handle && item.t >= timeThreshold && (rssiThreshold === null || item.rssi > rssiThreshold)) {
          contenders.push({ id: stoneIds[i], rssi: item.rssi })
        }
      }
    }
    contenders.sort((a,b) => { return b.rssi - a.rssi })

    for ( let i = 0; i < contenders.length && i < amount; i++) {
      nearestIds.push(contenders[i].id)
    }
    return nearestIds;
  }


  getAvgRssi(stoneId) {
    if (this.log[stoneId]) {
      if (Date.now() - this.log[stoneId].t < RSSI_TIMEOUT_MS) {
        return this.log[stoneId].rssi ?? INVALID_RSSI;
      }
    }
    return INVALID_RSSI;
  }

  getHandleAvgRssi(handle) {
    let stoneId = this.handleMap[handle]
    if (stoneId) {
      return this.getAvgRssi(stoneId);
    }
    return INVALID_RSSI;
  }

  getRssi(stoneId) {
    if (this.log[stoneId]) {
      if (Date.now() - this.log[stoneId].t < RSSI_TIMEOUT_MS) {
        return this.log[stoneId].lastNotifiedRssi ?? INVALID_RSSI;
      }
    }
    return INVALID_RSSI;
  }

  isDisabled(stoneId) {
    if (this.log[stoneId]) {
      if (Date.now() - this.log[stoneId].t < DISABLE_TIMEOUT) {
        return false;
      }
    }
    return true;
  }

  isAvailable(stoneId) {
    return !this.isDisabled(stoneId)
  }
}

export const StoneAvailabilityTracker = new StoneAvailabilityTrackerClass();
