// import { Scheduler } from "../../logic/Scheduler";
// import { core } from "../../core";
// import { DISABLE_TIMEOUT, FALLBACKS_ENABLED } from "../../ExternalConfig";
// import { LOGd, LOGi, LOGv } from "../../logging/Log";
// import { DfuStateHandler } from "../firmware/DfuStateHandler";
// import { LocationHandler } from "../localization/LocationHandler";
// import { xUtil } from "../../util/StandAloneUtil";
// import { DataUtil } from "../../util/DataUtil";
// import { BatchCommandHandler } from "../../logic/BatchCommandHandler";
//
// let RSSI_TIMEOUT = 5000;
// const RSSI_THRESHOLD = 3;
//
// const TRIGGER_ID = "StoneAvailabilityTracker"
//
// interface triggerFormat {
//   [key: string]: {
//     [key: string] : {
//       [key: string] : {
//         [key: string] : {
//           rssiRequirement: number,
//           action: (stoneId: string) => void,
//           timesToTrigger: number,
//           timesTriggered: number,
//           triggeredIds: map,
//           timeout?:number,
//           promise?: {resolve: (stoneId) => void, reject: (err) => void}
//         }
//       }
//     }
//   }
// }
// interface logFormat {
//   [key: string]: {sphereId: string, t: number, rssi: number, lastNotifiedRssi: number, handle: string,}
// }
//
// interface sphereLogFormat {
//   [key: string]: {[key: string] : {t: number, rssi: number, handle: string }}
// }
//
// class StoneAvailabilityTrackerClass {
//   log : logFormat = {};
//   sphereLog : sphereLogFormat = {}
//   initialized = false;
//
//   triggers : triggerFormat = {};
//
//   init() {
//     if (this.initialized === false) {
//       this.initialized = true;
//
//       core.eventBus.on("iBeaconOfValidCrownstone",       (data) => { this._update(data); });
//       core.eventBus.on("AdvertisementOfValidCrownstone", (data) => { this._update(data); });
//
//       core.eventBus.on("databaseChange", (data) => {
//         let change = data.change;
//
//         if (change.removeSphere) {
//           this._sanitize();
//           return;
//         }
//       });
//
//       Scheduler.setRepeatingTrigger(TRIGGER_ID, {repeatEveryNSeconds: 4});
//       Scheduler.loadCallback(TRIGGER_ID, this.notify.bind(this), false);
//     }
//   }
//
//   notify() {
//     let logStoneIds = Object.keys(this.log);
//     let availabilityStoneIds = {};
//     let availabilitySphereIds = {};
//
//     let rssiChangeStoneIds = {};
//     let rssiChangeSphereIds = {};
//
//     let disabledSpheres = {};
//     let now = Date.now();
//
//     for (let i = 0; i < logStoneIds.length; i++) {
//       let stoneId = logStoneIds[i];
//       let logData = this.log[stoneId];
//
//       //rssi has expired and we have not marked it yet. do it now.
//       if (now - logData.t > RSSI_TIMEOUT && logData.rssi !== -1000) {
//         availabilityStoneIds[stoneId] = true;
//         availabilitySphereIds[logData.sphereId] = true;
//         logData.rssi = -1000;
//       }
//
//       // stone is active. Cast.
//       if (now - logData.t < RSSI_TIMEOUT && Math.abs(logData.rssi - logData.lastNotifiedRssi) > RSSI_THRESHOLD) {
//         rssiChangeStoneIds[stoneId] = true;
//         rssiChangeSphereIds[logData.sphereId] = true;
//         logData.lastNotifiedRssi = logData.rssi;
//       }
//
//       // stone has expired and we will remove it.
//       if (now - logData.t > DISABLE_TIMEOUT) {
//         availabilityStoneIds[stoneId] = true;
//         availabilitySphereIds[logData.sphereId] = true;
//
//         // these have expired. Delete them.
//         disabledSpheres[logData.sphereId] = true;
//         if (this.sphereLog[logData.sphereId]) {
//           delete this.sphereLog[logData.sphereId][stoneId];
//         }
//         else {
//           delete this.sphereLog[logData.sphereId];
//         }
//         delete this.log[stoneId];
//       }
//     }
//
//     // cast if there is something to cast
//     if (Object.keys(availabilityStoneIds).length > 0) {
//       core.eventBus.emit("databaseChange", {change: {changeStoneAvailability: {stoneIds: availabilityStoneIds, sphereIds: availabilitySphereIds}}}); // discover a new crownstone!
//     }
//
//     // cast if there is something to cast
//     if (Object.keys(rssiChangeStoneIds).length > 0) {
//       core.eventBus.emit("databaseChange", {change: {changeStoneRSSI: {stoneIds: rssiChangeStoneIds, sphereIds: rssiChangeSphereIds}}}); // significant RSSI change.
//     }
//
//
//     let disabledSphereIds = Object.keys(disabledSpheres);
//     if (disabledSphereIds.length > 0) {
//       disabledSphereIds.forEach((sphereId) => {
//         this._evaluateDisabledState(sphereId);
//       })
//     }
//   }
//
//
//   /**
//    * Clean up after sphere removal.
//    * @private
//    */
//   _sanitize() {
//     let state = core.store.getState();
//     let spheres = state.spheres;
//     let sphereIds = Object.keys(spheres);
//
//     let sphereIdsInList = Object.keys(this.sphereLog);
//     sphereIdsInList.forEach((sphereIdInList) => {
//       if (sphereIds[sphereIdInList] === undefined) {
//         let stoneIdsToClean = Object.keys(this.sphereLog[sphereIdInList]);
//         stoneIdsToClean.forEach((stoneId) => {
//           delete this.log[stoneId];
//         })
//         delete this.sphereLog[sphereIdInList];
//         delete this.triggers[sphereIdInList];
//       }
//     })
//   }
//
//   _update(data) {
//     LOGd.native("StoneAvailabilityTracker: Updating data", data);
//     if (this.sphereLog[data.sphereId] === undefined) {
//       LOGv.native("StoneAvailabilityTracker: Creating Sphere Log field for this sphere");
//       this.sphereLog[data.sphereId] = {};
//     }
//
//     let registerStoneId = (stoneId, sphereId, rssi) => {
//       LOGv.native("StoneAvailabilityTracker: registerStoneId stoneId, sphereId, rssi", stoneId, sphereId, rssi);
//       if (this.log[stoneId] === undefined) {
//         LOGd.native("StoneAvailabilityTracker: registerStoneId storing in LOG stoneId, sphereId, rssi", stoneId, sphereId, rssi);
//         this.log[stoneId] = {t: null, rssi: data.rssi, sphereId: sphereId, lastNotifiedRssi: rssi, handle: data.handle || null };
//         // new Crownstone detected this run!
//         let stoneIds  = {};
//         let sphereIds = {};
//         stoneIds[stoneId]   = true;
//         sphereIds[sphereId] = true;
//         core.eventBus.emit("databaseChange", {change: {changeStoneAvailability: {stoneIds, sphereIds}}}); // discover a new crownstone!
//
//         if (rssi) { core.eventBus.emit("rssiChange", {stoneId: stoneId, sphereId: sphereId, rssi: rssi}); }// Major change in RSSI
//       }
//     }
//
//     // add stone that has broadcast this advertisment
//     registerStoneId(data.stoneId, data.sphereId, data.rssi);
//     // add stone that has been relayed by this advertisement via the mesh. If this is not a mesh message,
//     // the payloadId and stoneId are the same and this call does nothing.
//     registerStoneId(data.payloadId, data.sphereId, null);
//
//     if (this.sphereLog[data.sphereId][data.stoneId] === undefined) {
//       this.sphereLog[data.sphereId][data.stoneId] = {t: null, rssi: null, handle: null };
//     }
//
//     let now = Date.now();
//     this.sphereLog[data.sphereId][data.stoneId].t = now;
//     this.log[data.stoneId].t = now;
//
//     let prevRSSI = this.log[data.stoneId].rssi;
//     let newRSSI = 0.7*prevRSSI + 0.3*data.rssi;;
//     this.log[data.stoneId].rssi = newRSSI
//     this.sphereLog[data.sphereId][data.stoneId].rssi = newRSSI
//
//     if (data.handle) {
//       LOGv.native("StoneAvailabilityTracker: Storing data in logs");
//       this.log[data.stoneId].handle = data.handle;
//       this.sphereLog[data.sphereId][data.stoneId].rssi = data.handle;
//     }
//
//     if (Math.abs(newRSSI - prevRSSI) > 3*RSSI_THRESHOLD) {
//       core.eventBus.emit("rssiChange", {stoneId: data.stoneId, sphereId: data.sphereId, rssi:data.rssi}); // Major change in RSSI
//     }
//
//     LOGv.native("StoneAvailabilityTracker: Resulting logs after update for this stone:", this.log[data.stoneId], this.sphereLog[data.sphereId][data.stoneId]);
//
//     this.handleTriggers(data.sphereId, data.stoneId, data.rssi);
//   }
//
//
//
//   getNearestStoneId(reduxIdMap : map, inTheLastNSeconds : number = 2, rssiThreshold = -100) {
//     let ids = Object.keys(reduxIdMap);
//     let nearestRssi = -1000;
//     let nearestId = null;
//
//     let timeThreshold = Date.now() - 1000 * inTheLastNSeconds;
//     for (let i = 0; i < ids.length; i++) {
//       let item = this.log[ids[i]];
//       if (item && item.handle && item.t >= timeThreshold && item.rssi > nearestRssi && (rssiThreshold === null || item.rssi > rssiThreshold)) {
//         nearestRssi = item.rssi;
//         nearestId = ids[i]
//       }
//     }
//
//     return nearestId;
//   }
//
//
//
//   getNearestStoneIds(stoneIds : string[], inTheLastNSeconds : number = 2, amount= 1, rssiThreshold = -100) {
//     let nearestIds = [];
//     let contenders = [];
//
//     let timeThreshold = Date.now() - 1000 * inTheLastNSeconds;
//     for (let i = 0; i < stoneIds.length; i++) {
//       let item = this.log[stoneIds[i]];
//       if (item) {
//         if (item.handle && item.t >= timeThreshold && (rssiThreshold === null || item.rssi > rssiThreshold)) {
//           contenders.push({ id: stoneIds[i], rssi: item.rssi })
//         }
//       }
//     }
//     contenders.sort((a,b) => { return b.rssi - a.rssi })
//
//     for ( let i = 0; i < contenders.length && i < amount; i++) {
//       nearestIds.push(contenders[i].id)
//     }
//     return nearestIds;
//   }
//
//   getAvgRssi(stoneId) {
//     if (this.log[stoneId]) {
//       if (Date.now() - this.log[stoneId].t < RSSI_TIMEOUT) {
//         return this.log[stoneId].rssi || -1000;
//       }
//     }
//     return -1000;
//   }
//
//   getRssi(stoneId) {
//     if (this.log[stoneId]) {
//       if (Date.now() - this.log[stoneId].t < RSSI_TIMEOUT) {
//         return this.log[stoneId].lastNotifiedRssi || -1000;
//       }
//     }
//     return -1000;
//   }
//
//   isDisabled(stoneId) {
//     if (this.log[stoneId]) {
//       if (Date.now() - this.log[stoneId].t < DISABLE_TIMEOUT) {
//         return false;
//       }
//     }
//     return true;
//   }
//
//
//   _evaluateDisabledState(sphereId) {
//     let state = core.store.getState();
//     if (state.spheres[sphereId] === undefined) { return; }
//
//
//     // check if there are any stones left that are not disabled.
//     let stoneIds = Object.keys(state.spheres[sphereId].stones);
//     let allDisabled = true;
//     stoneIds.forEach((stoneId) => {
//       if (StoneAvailabilityTracker.isDisabled(stoneId) === false) {
//         allDisabled = false;
//       }
//     });
//
//     // fallback to ensure we never miss an enter or exit event caused by a bug in ios 10
//     if (FALLBACKS_ENABLED) {
//       // if we are in DFU, do not leave the sphere by fallback
//       if (DfuStateHandler.areDfuStonesAvailable() !== true) {
//         if (allDisabled === true) {
//           LOGi.info("FALLBACK: StoneStateHandler: FORCE LEAVING SPHERE DUE TO ALL CROWNSTONES BEING DISABLED");
//           LocationHandler.exitSphere(sphereId);
//         }
//       }
//       else {
//         // reschedule the fallback if we are in dfu.
//         Scheduler.scheduleBackgroundCallback(
//           () => { this._evaluateDisabledState(sphereId); },
//           DISABLE_TIMEOUT,
//           "disable"
//         );
//       }
//     }
//   }
//
//
//   /**
//    * Will execute Action when a stone with the provided ID is seen. ID CAN be a wildcard ("*")
//    * @param sphereId
//    * @param stoneId
//    * @param ownerId
//    * @param action
//    * @param rssi
//    */
//   setTrigger(sphereId, stoneId, ownerId, action: (stoneId: string) => void, rssi= -100) {
//     if (!this.triggers[sphereId])                   { this.triggers[sphereId] = {}; }
//     if (!this.triggers[sphereId][stoneId])          { this.triggers[sphereId][stoneId] = {}; }
//     if (!this.triggers[sphereId][stoneId][ownerId]) { this.triggers[sphereId][stoneId][ownerId] = {} }
//
//     let uuid = xUtil.getShortUUID()
//     this.triggers[sphereId][stoneId][ownerId][uuid] = {rssiRequirement: rssi, action: action, triggeredIds: {}, timesTriggered: 0, timesToTrigger: 1};
//   }
//
//   /**
//    * Will execute Action when a stone with the provided ID is seen. ID CAN be a wildcard ("*")
//    * @param sphereId
//    * @param stoneId
//    * @param ownerId
//    * @param action
//    * @param rssi
//    */
//   setGenericTrigger(sphereId, ownerId, action: (stoneId: string) => void, rssi= -100, amount= 1) {
//     if (!this.triggers[sphereId])               { this.triggers[sphereId] = {}; }
//     if (!this.triggers[sphereId]["*"])          { this.triggers[sphereId]["*"] = {}; }
//     if (!this.triggers[sphereId]["*"][ownerId]) { this.triggers[sphereId]["*"][ownerId] = {}; }
//
//     let uuid = xUtil.getShortUUID()
//     this.triggers[sphereId]["*"][ownerId][uuid] = { rssiRequirement: rssi, action: action, triggeredIds: {}, timesTriggered: 0, timesToTrigger: amount };
//   }
//
//
//   /**
//    * Will execute Action when a stone with the provided ID is seen. ID CAN be a wildcard ("*")
//    * @param sphereId
//    * @param stoneId
//    * @param ownerId
//    * @param action
//    * @param rssi
//    */
//   setGenericTriggerPromise(sphereId, ownerId, action: (stoneId: string) => void, rssi= -100, amount= 1, timeoutSeconds = 0) : Promise<string> {
//     if (!this.triggers[sphereId])               { this.triggers[sphereId] = {}; }
//     if (!this.triggers[sphereId]["*"])          { this.triggers[sphereId]["*"] = {}; }
//     if (!this.triggers[sphereId]["*"][ownerId]) { this.triggers[sphereId]["*"][ownerId] = {}; }
//
//     return new Promise((resolve, reject) => {
//       let uuid = xUtil.getShortUUID()
//
//       let clearScheduledTimeout = () => {};
//       if (timeoutSeconds  > 0) {
//         clearScheduledTimeout = Scheduler.scheduleCallback(() => {
//           if (this.triggers[sphereId]["*"][ownerId][uuid] !== undefined) {
//             reject("TIMEOUT");
//             delete this.triggers[sphereId]["*"][ownerId][uuid];
//           }
//         }, timeoutSeconds*1000);
//       }
//
//       this.triggers[sphereId]["*"][ownerId][uuid] = {
//         rssiRequirement: rssi, action: action, triggeredIds: {}, timesTriggered: 0, timesToTrigger: amount,
//         promise: {
//           resolve: (stoneId) => { clearScheduledTimeout(); resolve(stoneId) },
//           reject:  (err)     => { clearScheduledTimeout(); reject(err) }
//         }
//       };
//     })
//
//   }
//
//
//   clearMySetTriggers(sphereId, stoneId, ownerId) {
//     if (!this.triggers[sphereId])                   { return; }
//     if (!this.triggers[sphereId][stoneId])          { return; }
//     if (!this.triggers[sphereId][stoneId][ownerId]) { return; }
//
//     let triggerKeys = Object.keys(this.triggers[sphereId][stoneId][ownerId]);
//     if (triggerKeys.length > 0) {
//       for ( let i = 0; i < triggerKeys.length; i++) {
//         let key = triggerKeys[i];
//         if (this.triggers[sphereId][stoneId][ownerId][key].promise !== undefined) {
//           this.triggers[sphereId][stoneId][ownerId][key].promise.reject("TRIGGER_CLEARED_BY_MANUAL_COMMAND");
//         }
//         delete this.triggers[sphereId][stoneId][ownerId][key];
//       }
//     }
//
//     delete this.triggers[sphereId][stoneId][ownerId];
//   }
//
//
//   handleTriggers(sphereId, stoneId, rssi) {
//     if (!this.triggers[sphereId])          { return; }
//
//     let stone = DataUtil.getStone(sphereId, stoneId)
//     if (!stone) { return; }
//     if (!stone.config.handle) { return; }
//
//
//     this._handleTargetedTriggers(sphereId, stoneId, rssi);
//     this._handleGenericTriggers( sphereId, stoneId, rssi);
//   }
//
//   _handleTargetedTriggers(sphereId, stoneId, rssi) {
//     if (!this.triggers[sphereId])          { return; }
//     if (!this.triggers[sphereId][stoneId] ) { return; }
//
//     // handle targeted triggers
//     let ownerIds = Object.keys(this.triggers[sphereId][stoneId]);
//     let todos = [];
//     for (let i = 0; i < ownerIds.length; i++) {
//       let ownerActions     = this.triggers[sphereId][stoneId][ownerIds[i]];
//       let ownerActionsKeys = Object.keys(this.triggers[sphereId][stoneId][ownerIds[i]]);
//       // inverse walk so we can delete the elements that we match
//       for (let j = 0; j < ownerActionsKeys.length; j++) {
//         if (ownerActions[ownerActionsKeys[j]].rssiRequirement <= rssi) {
//           todos.push(ownerActions[ownerActionsKeys[j]]);
//           delete ownerActions[ownerActionsKeys[j]];
//         }
//       }
//     }
//
//     // we now have a collection of todos that we will execute.
//     for (let i = 0; i < todos.length; i++) {
//       todos[i].action(stoneId);
//       if (todos[i].promise) {
//         todos[i].promise.resolve(stoneId);
//       }
//     }
//
//   }
//
//   _handleGenericTriggers(sphereId, stoneId, rssi) {
//     if (!this.triggers[sphereId])      { return; }
//     if (!this.triggers[sphereId]["*"]) { return; }
//
//     // handle targeted triggers
//     let ownerIds = Object.keys(this.triggers[sphereId]["*"]);
//     let todos = [];
//     for (let i = 0; i < ownerIds.length; i++) {
//       let ownerActions     = this.triggers[sphereId]["*"][ownerIds[i]];
//       let ownerActionsKeys = Object.keys(this.triggers[sphereId]["*"][ownerIds[i]]);
//       // inverse walk so we can delete the elements that we match
//       for (let j = 0; j < ownerActionsKeys.length; j++) {
//         let actionPayload = ownerActions[ownerActionsKeys[j]];
//         if (actionPayload.rssiRequirement <= rssi) {
//           todos.push(actionPayload);
//
//           actionPayload.timesTriggered += 1;
//           actionPayload.triggeredIds[stoneId] = true;
//
//           if (actionPayload.timesTriggered >= actionPayload.timesToTrigger) {
//             delete ownerActions[ownerActionsKeys[j]];
//           }
//         }
//       }
//     }
//
//     // we now have a collection of todos that we will execute.
//     for (let i = 0; i < todos.length; i++) {
//       todos[i].action(stoneId);
//       if (todos[i].promise) {
//         todos[i].promise.resolve(stoneId);
//       }
//     }
//   }
//
//
//   sendCommandToNearestCrownstones(sphereId, command : commandInterface, amount, timeoutSeconds = 0) : Promise<Promise<any>[]> {
//     return new Promise((resolve, reject) => {
//       let state = core.store.getState();
//       let allStoneIds = Object.keys(state.spheres[sphereId].stones);
//       let promises = [];
//
//       // do not try more than we have.
//       amount = Math.min(allStoneIds.length, amount);
//
//       const handleStoneId = (stoneId) => {
//         let stone = DataUtil.getStone(sphereId, stoneId);
//         if (stone) {
//           // send to BHC
//           promises.push(BatchCommandHandler.loadPriority(stone, stoneId, sphereId, command, {}, 1)
//             .catch((err) => {
//               if (err?.code !== "REMOVED_BECAUSE_IS_DUPLICATE") {
//                 throw err;
//               }
//             })
//           );
//         }
//       }
//
//       let nearestStoneIds = this.getNearestStoneIds(allStoneIds, 2, amount);
//
//       let amountSet = 0;
//       nearestStoneIds.forEach((stoneId) => {
//         // first we immediately schedule the last few closest crownstones for handling by the BCH
//         handleStoneId(stoneId);
//         amountSet += 1;
//       })
//
//       // if any were set, execute.
//       if (amountSet > 0) {
//         BatchCommandHandler.executePriority();
//       }
//
//       // the ones that have not yet been handled will be set as triggers. They will be handled as soon as they are seen
//       let remainder = amount - amountSet;
//       if (remainder > 0) {
//         this.setGenericTriggerPromise(sphereId, "sendCommandToNearestCrownstones", (stoneId) => {
//           handleStoneId(stoneId);
//           BatchCommandHandler.executePriority();
//
//           if (promises.length == amount) {
//             resolve(promises);
//           }
//         }, -90, remainder, timeoutSeconds)
//           .catch((err) => {
//             // if this has not been resolved quickly, reject the remaining promises
//             if (promises.length < amount) {
//               for (let i = promises.length; i < 4; i++) {
//                 promises.push(Promise.reject(err));
//               }
//             }
//             resolve(promises);
//           })
//       }
//       else {
//         resolve(promises);
//       }
//     });
//   }
// }
//
// export const StoneAvailabilityTracker = new StoneAvailabilityTrackerClass();