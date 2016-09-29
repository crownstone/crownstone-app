import { NativeBus } from '../native/Proxy';
import { LOG, LOGDebug, LOGError} from '../logging/Log'


class SchedulerClass {
  constructor() {
    this.initialized = false;
    this.store = undefined;
    this.triggers = {};

    this.allowTicksAfterTime = 0;
  }


  loadStore(store) {
    LOG('LOADED STORE SchedulerClass', this.initialized);
    if (this.initialized === false) {
      this.store = store;
      this.init();
    }
  }


  init() {
    if (this.initialized === false) {
      this.store.subscribe(() => {
        let state = this.store.getState();
        this.activeSphere = state.app.activeSphere;
        this.allowTicksAfterTime = new Date().valueOf() + 2000;
      });
      NativeBus.on(NativeBus.topics.exitSphere, this.flushAll.bind(this));
      NativeBus.on(NativeBus.topics.iBeaconAdvertisement, () => {
        this.tick();
      });

      this.schedule();
      this.initialized = true;
    }
  }


  /**
   * Set a trigger that can be loaded with actions or callbacks. Will be fired on ticks.
   * @param id
   * @param {Object} options       | Possible options:
   *                                    repeatEveryNSeconds
   */
  setRepeatingTrigger(id, options) {
    if (this.triggers[id] === undefined) {
      this.triggers[id] = {actions: [], callbacks: [], options: {}, overwritableActions: {}, lastTriggerTime: 0};
    }
    this.triggers[id].options = options;
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
        LOGError("INVALID ACTION", action);
      }
    }
    else {
      LOGError("Invalid trigger ID", triggerId, this.triggers)
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
        LOGError("INVALID ACTION", action);
      }
    }
    else {
      LOGError("Invalid trigger ID. You need to create a trigger first using 'setRepeatingTrigger'.", triggerId, this.triggers)
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
          this.triggers[triggerId].lastTriggerTime = new Date().valueOf();
        }
      }
      else {
        LOGError("INVALID callback", callback);
      }
    }
    else {
      LOGError("Invalid trigger ID. You need to create a trigger first using 'setRepeatingTrigger'.", triggerId, this.triggers)
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
    this.scheduledTick = setTimeout(() => { this.tick() }, 4000);
  }


  tick() {
    this.clearSchedule();

    let now = new Date().valueOf();

    // we use this to avoid a race condition where the user has updated the database, and a tick from advertisements
    // instantly overwrites the value again. This can happen when a Crownstone's first advertisement after switching is
    // still the old state.
    if (now > this.allowTicksAfterTime) {
      let state = this.store.getState();
      let triggerIds = Object.keys(this.triggers);

      // check if we have to fire the trigger
      triggerIds.forEach((triggerId) => {
        let trigger = this.triggers[triggerId];
        if (trigger.options.repeatEveryNSeconds) {
          // We use round in the conversion from millis to seconds so 1.5seconds is also accepted when the target is 2 seconds
          // due to timer inaccuracy this gives the most reliable results.
          if (Math.round(0.001 * (now - trigger.lastTriggerTime)) >= trigger.options.repeatEveryNSeconds) {
            this.flush(trigger, state);
          }
        }
      });

      // revert the offset so we continue normally
      this.allowTicksAfterTime = 0;
    }

    this.schedule();
  }


  /**
   * fire all triggers.
   */
  flushAll() {
    let triggerIds = Object.keys(this.triggers);
    let state = this.store.getState();

    triggerIds.forEach((triggerId) => {
      this.flush(this.triggers[triggerId], state);
    });
  }


  flush(trigger, state) {
    this._flushActions(trigger,state);
    this._flushCallbacks(trigger,state);
    trigger.lastTriggerTime = new Date().valueOf();
  }

  _flushCallbacks(trigger,state) {
    trigger.callbacks.forEach((callback) => {
      callback();
    });
    trigger.callbacks = [];
  }

  _flushActions(trigger, state) {
    let actionsToDispatch = [];

    // check if we have to update the state. If the state has changed due to userinput in between triggers
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
      this.store.batchDispatch(actionsToDispatch);
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
      if (action.stoneId !== undefined) {
        // TODO: currently only for state, generalization might be required.
        this._addActionIfDispatch(actionsToDispatch, action, sphere.stones[action.stoneId].state);
      }
      else if (action.applianceId !== undefined) {
        actionsToDispatch.push(action);
      }
      else if (action.locationId !== undefined) {
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
}

export const Scheduler = new SchedulerClass();