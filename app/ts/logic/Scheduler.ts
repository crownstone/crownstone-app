import { AppState } from 'react-native'
import {LOG, LOGe, LOGw} from '../logging/Log'
import {DEBUG, SCHEDULER_FALLBACK_TICK} from "../ExternalConfig";
import { xUtil } from "../util/StandAloneUtil";
import { core } from "../core";


interface scheduledCallback {
  uuid?: {
    callback() : void
    triggerTime: number,
    timeoutId: number
  },
}
interface scheduleTrigger {
  id?: {
    active:     true,
    actions:    any[],
    callbacks:  any[],
    overwritableActions:   {},
    overwritableCallbacks: {},
    options:    {},
    lastTriggerTime: 0
  }
}

class SchedulerClass {
  _initialized : any;
  triggers : scheduleTrigger;
  singleFireTriggers : scheduledCallback;
  allowTicksAfterTime : any;
  scheduledTick : any;

  constructor() {
    this._initialized = false;
    this.triggers = {};

    this.singleFireTriggers = {};

    this.allowTicksAfterTime = 0;
  }



  reset() {
    this.triggers = {};
    this.singleFireTriggers = {};
  }


  init() {
    if (this._initialized === false) {
      core.nativeBus.on(core.nativeBus.topics.exitSphere, this.flushAll.bind(this));
      core.nativeBus.on(core.nativeBus.topics.iBeaconAdvertisement, () => {
        this.tick();
      });

      this.schedule();
      this._initialized = true;
    }
  }


  /**
   * Set a trigger that can be loaded with actions or callbacks. Will be fired on ticks.
   * @param id
   * @param {Object} options       | Possible options:
   *                                    repeatEveryNSeconds
   */
  setRepeatingTrigger(id, options, performImmediatelyAfterSet = false) {
    if (this.triggers[id] === undefined) {
      this.triggers[id] = {
        active:     true,
        actions:    [],
        callbacks:  [],
        overwritableActions:   {},
        overwritableCallbacks: {},
        options:    {},
        lastTriggerTime: performImmediatelyAfterSet ? 0 : Date.now(),
        pauseTime: null
      };
    }
    this.triggers[id].options = options;
  }

  /**
   * Set a trigger that can be loaded with actions or callbacks. Will be fired on ticks.
   * @param id
   *                                    repeatEveryNSeconds
   */
  removeTrigger(id) {
    delete this.triggers[id];
  }


  /**
   * Overwritable actions are for Advertisements and other things that may accumulate
   * actions over time but only the last one is relevant.
   * @param triggerId
   * @param actionId
   * @param action
   */
  loadOverwritableAction(triggerId, actionId, action) {
    if (this.triggers[triggerId] !== undefined) {
      if (typeof action === 'object') {
        this.triggers[triggerId].overwritableActions[actionId] = action;
      }
      else {
        LOGe.scheduler("INVALID ACTION", action);
      }
    }
    else {
      LOGe.scheduler("Invalid trigger ID", triggerId, this.triggers)
    }
  }

  clearOverwritableTriggerAction(triggerId, actionId) {
    if (this.triggers[triggerId]) {
      delete this.triggers[triggerId].overwritableActions[actionId];
    }
  }

  clearTriggerActions(triggerId) {
    this.triggers[triggerId].actions = [];
    this.triggers[triggerId].overwritableActions = {};
    this.triggers[triggerId].callbacks = [];
    this.triggers[triggerId].overwritableCallbacks = {};
  }

  pauseTrigger(triggerId) {
    if (this.triggers[triggerId]) {
      this.triggers[triggerId].active = false;
      this.triggers[triggerId].pauseTime = Date.now();
    }
  }

  resumeTrigger(triggerId) {
    if (this.triggers[triggerId]) {
      this.triggers[triggerId].active = true;
      if (this.triggers[triggerId].pauseTime !== null) {
        // we account for paused time so that the remainder when it was paused is the same remainder as it is when we resume.
        this.triggers[triggerId].lastTriggerTime += Date.now() - this.triggers[triggerId].pauseTime;
        this.triggers[triggerId].pauseTime = null;
      }
    }
  }


  /**
   * Actions are REDUX actions that can be dispatched into the store. Either object (single action) or array of objects (batch)
   * @param triggerId
   * @param action
   */
  loadAction(triggerId, action) {
    if (this.triggers[triggerId] !== undefined) {
      if (Array.isArray(action) === true) {
        this.triggers[triggerId].actions = this.triggers[triggerId].actions.concat(action);
      }
      else if (typeof action === 'object') {
        this.triggers[triggerId].actions.push(action);
      }
      else {
        LOGe.scheduler("INVALID ACTION", action);
      }
    }
    else {
      LOGe.scheduler("Invalid trigger ID. You need to create a trigger first using 'setRepeatingTrigger'.", triggerId, this.triggers)
    }
  }

  /**
   * callbacks will be fired when the time expires
   * @param triggerId
   * @param callback
   * @param fireAfterLoad
   */
  loadCallback(triggerId, callback, fireAfterLoad = false) {
    if (this.triggers[triggerId] !== undefined) {
      if (typeof callback === 'function') {
        this.triggers[triggerId].callbacks.push(callback);

        // we don't want to trigger a callback right away, if we do, make sure fireAfterLoad = true
        if (fireAfterLoad === false) {
          this.triggers[triggerId].lastTriggerTime = Date.now();
        }
      }
      else {
        LOGe.scheduler("Scheduler: INVALID callback", callback);
      }
    }
    else {
      LOGe.scheduler("Scheduler: Invalid trigger ID. You need to create a trigger first using 'setRepeatingTrigger'.", triggerId, this.triggers)
    }
  }

  /**
   * callbacks will be fired when the time expires
   * @param triggerId
   * @param callbackId
   * @param callback
   * @param fireAfterLoad
   */
  loadOverwritableCallback(triggerId, callbackId, callback, fireAfterLoad = false) {
    if (this.triggers[triggerId] !== undefined) {
      if (typeof callback === 'function') {
        this.triggers[triggerId].overwritableCallbacks[callbackId] = callback;

        // we don't want to trigger a callback right away, if we do, make sure fireAfterLoad = true
        if (fireAfterLoad === false) {
          this.triggers[triggerId].lastTriggerTime = Date.now();
        }
      }
      else {
        LOGe.scheduler("Scheduler: INVALID callback", callback);
      }
    }
    else {
      LOGe.scheduler("Scheduler: Invalid trigger ID. You need to create a trigger first using 'setRepeatingTrigger'.", triggerId, this.triggers)
    }
  }

  clearSchedule() {
    if (this.scheduledTick !== undefined) {
      clearTimeout(this.scheduledTick);
      this.scheduledTick = undefined;
    }
  }


  /**
   * Schedule is used as backup, when the app is open but the iBeacons are not found.
   */
  schedule() {
    this.clearSchedule();
    this.scheduledTick = setTimeout(() => { this.tick() }, SCHEDULER_FALLBACK_TICK);
  }

  /**
   * Smart callback scheduler.
   *
   * This method will also set a setTimeout to make sure the triggers fire when expected instead of checking if it should fire every 1 or 4 seconds.
   * If it detects the app is NOT on the foreground (which is when the setTimeout would still do something) it will fall back to being a backgroundCallback.
   * @param callback
   * @param afterMilliseconds
   * @param label
   */
  scheduleCallback(callback, afterMilliseconds = null, label = "unlabeled") : () => void {
    if (afterMilliseconds === null) {
      throw "NO_TIMEOUT_PROVIDED_TO_SCHEDULE_CALLBACK";
    }

    if (AppState.currentState === 'active') {
      return this.scheduleActiveCallback(callback, afterMilliseconds, label);
    }
    else {
      return this.scheduleBackgroundCallback(callback, afterMilliseconds, label);
    }
  }

  /**
   * This method will also set a setTimeout to make sure the triggers fire when expected instead of checking if it should fire every 1 or 4 seconds.
   * @param callback
   * @param afterMilliseconds
   * @param label
   */
  scheduleActiveCallback(callback, afterMilliseconds, label = "unlabeled") : () => void {
    return this._scheduleCallback(callback, afterMilliseconds, true, label);
  }

  /**
   * This method will does not set an additional setTimeout.
   * @param callback
   * @param afterMilliseconds
   * @param label
   */
  scheduleBackgroundCallback(callback, afterMilliseconds, label = "unlabeled") : () => void {
    return this._scheduleCallback(callback, afterMilliseconds, false, label);
  }

  _scheduleCallback(callback, afterMilliseconds, useTimeout: boolean, label = "unlabeled") : () => void {
    if (typeof callback !== 'function') {
      LOGe.scheduler("Scheduler: Failed to schedule callback. Not a function", label, afterMilliseconds);
      if (DEBUG) {
        throw "Scheduler: Failed to schedule callback. Not a function: " + label;
      }
    }
    let uuid = label + xUtil.getUUID();
    LOG.scheduler("Scheduling callback", uuid, 'to fire after ', afterMilliseconds, 'ms.');

    // fallback to try to fire this callback after exactly the amount of ms
    let timeoutId = null;

    if (useTimeout && afterMilliseconds < 20000) {
      timeoutId = setTimeout(() => { this.tick(); }, afterMilliseconds + 10);
    }

    this.singleFireTriggers[uuid] = {callback: callback, triggerTime: Date.now() + afterMilliseconds, timeoutId: timeoutId};

    return () => {
      if (this.singleFireTriggers[uuid]) {
        if (useTimeout) {
          clearTimeout(timeoutId);
        }
        this.singleFireTriggers[uuid] = undefined;
        delete this.singleFireTriggers[uuid];
      }
    }
  }


  tick() {
    this.clearSchedule();

    let now = Date.now();

    LOG.scheduler("Tick", now);

    // we use this to avoid a race condition where the user has updated the database, and a tick from advertisements
    // instantly overwrites the value again. This can happen when a Crownstone's first advertisement after switching is
    // still the old state.
    if (now > this.allowTicksAfterTime) {
      let state = core.store.getState();
      let triggerIds = Object.keys(this.triggers);

      // check if we have to fire the trigger
      triggerIds.forEach((triggerId) => {
        let trigger = this.triggers[triggerId];

        // if the trigger is paused, ignore.
        if (trigger.active === false) {
          return;
        }

        if (trigger.options.repeatEveryNSeconds) {
          // LOG.scheduler("Handling Trigger:", triggerId, trigger.options.repeatEveryNSeconds, Math.round(0.001 * (now - trigger.lastTriggerTime)));
          // We use round in the conversion from millis to seconds so 1.5seconds is also accepted when the target is 2 seconds
          // due to timer inaccuracy this gives the most reliable results.
          if (Math.round(0.001 * (now - trigger.lastTriggerTime)) >= trigger.options.repeatEveryNSeconds) {
            LOG.scheduler("FIRING Trigger:", triggerId);
            this.flush(trigger, state);
          }
        }
      });

      // revert the offset so we continue normally
      this.allowTicksAfterTime = 0;
    }

    this.checkSingleFires(now);

    this.schedule();
  }

  fireTrigger(triggerId) {
    let state = core.store.getState();
    let trigger = this.triggers[triggerId];

    if (trigger)
      this.flush(trigger, state);
  }

  postponeTrigger(triggerId) {
    let trigger = this.triggers[triggerId];

    if (trigger) {
      this._postpone(trigger);
    }
  }


  checkSingleFires(now) {
    let triggerIds = Object.keys(this.singleFireTriggers);
    triggerIds.forEach((triggerId) => {
      // LOG.scheduler("Handling single fire trigger:", triggerId);
      let trigger = this.singleFireTriggers[triggerId];
      if (trigger && trigger.triggerTime < now) {
        LOG.scheduler("Firing single fire trigger:", triggerId);
        trigger.callback();

        // clear the pending timeout.
        if (trigger.timeoutId) {
          clearTimeout(trigger.timeoutId);
        }

        this.singleFireTriggers[triggerId] = undefined;
        delete this.singleFireTriggers[triggerId];
      }
    })
  }

  /**
   * fire all triggers.
   */
  flushAll() {
    LOG.scheduler("Flush All!");
    let triggerIds = Object.keys(this.triggers);
    let state = core.store.getState();

    triggerIds.forEach((triggerId) => {
      this.flush(this.triggers[triggerId], state);
    });
  }


  _postpone(trigger) {
    trigger.lastTriggerTime = Date.now();
  }


  flush(trigger, state) {
    this._flushActions(trigger,state);
    this._flushCallbacks(trigger);
    trigger.lastTriggerTime = Date.now();
  }

  _flushCallbacks(trigger) {
    trigger.callbacks.forEach((callback) => {
      callback();
    });

    let overwritableCallbackIds = Object.keys(trigger.overwritableCallbacks);
    overwritableCallbackIds.forEach((callbackId) => {
      trigger.overwritableCallbacks[callbackId]();
    })
  }

  _flushActions(trigger, state) {
    let actionsToDispatch = [];

    // check if we have to update the state. If the state has changed due to user input in between triggers
    // we prefer not to use older data.
    trigger.actions.forEach((action) => {
      this._checkAndAddAction(actionsToDispatch, action, state)
    });

    // do the same for the overwritable actions.
    let overwritableActionKeys = Object.keys(trigger.overwritableActions);
    overwritableActionKeys.forEach((key) => {
      let action = trigger.overwritableActions[key];
      this._checkAndAddAction(actionsToDispatch, action, state)
    });

    // update the store
    if (actionsToDispatch.length > 0) {
      core.store.batchDispatch(actionsToDispatch);
    }

    trigger.actions = [];
    trigger.overwritableActions = {};
  }


  /**
   * Validate if we want to use the action based on its update date and the date when the database was last updated.
   * @param actionsToDispatch
   * @param action
   * @param state
   * @private
   */
  _checkAndAddAction(actionsToDispatch, action, state) {
    if (action.sphereId !== undefined) {
      let sphere = state.spheres[action.sphereId];
      if (sphere === undefined)
        return;

      if (action.stoneId !== undefined && sphere.stones[action.stoneId]) {
        // TODO: currently only for state, generalization is required.
        this._addActionIfDispatch(actionsToDispatch, action, sphere.stones[action.stoneId].state);
      }
      else if (action.locationId !== undefined && sphere.locations[action.locationId]) {
        actionsToDispatch.push(action);
      }
    }
    else {
      actionsToDispatch.push(action);
    }
  }

  _addActionIfDispatch(actionsToDispatch, action, currentState) {
    if (action.updatedAt > currentState.updatedAt) {
      actionsToDispatch.push(action);
    }
  }


  async delay(ms, label = '') : Promise<void> {
    return new Promise((resolve, reject) => {
      Scheduler.scheduleCallback(() => { resolve(); }, ms, 'schedulerDelay_' + label);
    })
  }

  setTimeout(callback, afterMilliseconds, label = "unlabeled") : () => void {
    return this.scheduleCallback(callback, afterMilliseconds, label);
  }
}

export const Scheduler : any = new SchedulerClass();
