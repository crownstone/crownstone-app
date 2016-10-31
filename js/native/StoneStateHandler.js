import { Scheduler } from '../logic/Scheduler';
import { LOG, LOGDebug } from '../logging/Log'

class StoneStateHandlerClass {
  constructor() {
    this.store = {};
    this.timeoutActions = {};
    this.initialized = false;
  }

  loadStore(store) {
    LOG('LOADED STORE StoneStateHandlerClass', this.initialized);
    if (this.initialized === false) {
      this.store = store;
    }
  }

  receivedIBeaconUpdate(sphereId, stoneId) {
    this.update(sphereId, stoneId);
  }

  receivedUpdate(sphereId, stoneId) {
    this.update(sphereId, stoneId);
  }

  update(sphereId, stoneId) {
    if (this.timeoutActions[sphereId] === undefined) {
      this.timeoutActions[sphereId] = {};
    }
    if (this.timeoutActions[sphereId][stoneId] === undefined) {
      this.timeoutActions[sphereId][stoneId] = {clearTimeout: undefined};
    }
    else {
      this.timeoutActions[sphereId][stoneId].clearTimeout()
    }

    let disableCallback = () => {
      let state = this.store.getState();
      if (state.spheres[sphereId] && state.spheres[sphereId].stones[stoneId]) {
        this.store.dispatch({
          type: 'UPDATE_STONE_DISABILITY',
          sphereId: sphereId,
          stoneId: stoneId,
          data: {disabled: true}
        });
      }
      delete this.timeoutActions[sphereId][stoneId];
    };

    this.timeoutActions[sphereId][stoneId].clearTimeout = Scheduler.scheduleCallback(disableCallback, 30000);
  }

}

export const StoneStateHandler = new StoneStateHandlerClass();