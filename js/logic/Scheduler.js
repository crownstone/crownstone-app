import { NativeEventsBridge } from '../native/NativeEventsBridge'
import { NativeEvents } from '../native/Proxy';
import { LOG } from '../logging/Log'


class SchedulerClass {
  constructor() {
    this.initialized = false;
    this.store = undefined;
    this.triggers = {};
  }


  loadStore(store) {
    LOG('LOADED STORE SchedulerClass', this.initialized);
    if (this.initialized === false) {
      this.initialized = true;
      this.store = store;
      this.init();
    }
  }


  init() {
    NativeEventsBridge.locationEvents.on(NativeEvents.location.exitSphere,       this.flushAll.bind(this));
    NativeEventsBridge.locationEvents.on(NativeEvents.ble.iBeaconAdvertisement, this.tick.bind(this));
  }
  

  setRepeatingTrigger(id, options) {
    if (this.triggers[id] === undefined) {
      this.triggers[id] = {actions: [], callback: [], options: {}, lastTriggerTime: 0};
    }
    this.triggers[id].options = options;
  }


  loadAction(triggerId, action) {
    if (this.triggers[triggerId] !== undefined) {
      if (Array.isArray(action) === true) {
        this.triggers[triggerId].actions = this.triggers[triggerId].actions.concat(action);
      }
      else if (typeof action === 'object') {
        this.triggers[triggerId].actions.push(action);
      }
      else {
        LOG("INVALID ACTION", action);
      }
    }
    else {
      LOG("Invalid trigger ID", triggerId, this.triggers)
    }
  }


  tick() {
    let now = new Date().valueOf();
    let triggerIds = Object.keys(this.triggers);
    triggerIds.forEach((triggerId) => {
      let trigger = this.triggers[triggerId];
      if (trigger.options.repeatEveryNSeconds) {
        if (now - trigger.lastTriggerTime > trigger.options.repeatEveryNSeconds) {
          this.flush(triggerId);
        }
      }
    });
  }


  flushAll() {
    let triggerIds = Object.keys(this.triggers);
    triggerIds.forEach((triggerId) => {
      this.flush(triggerId);
    });
  }


  flush(triggerId) {
    if (this.triggers[triggerId].actions.length > 0) {
      this.store.batchDispatch(this.triggers[triggerId].actions);
      this.triggers[triggerId].actions = [];
    }
    this.triggers[triggerId].lastTriggerTime = new Date().valueOf();
  }
}

export const Scheduler = new SchedulerClass();