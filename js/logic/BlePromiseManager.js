import { LOG, LOGError } from '../logging/Log'
import { Scheduler } from '../logic/Scheduler'
import { BluenetPromises } from '../native/Proxy'


class BlePromiseManagerClass {
  constructor() {
    this.pendingPromises = [];
    this.promiseInProgress = undefined;
    this.clearPendingPromiseTimeout = undefined;
  }

  register(promise, message) {
    return this._register(promise, message, false);
  }

  registerPriority(promise, message) {
    return this._register(promise, message, true);
  }

  _register(promise, message, priorityCommand = false) {
    LOG("BlePromiseManager: registered promise in manager");
    return new Promise((resolve, reject) => {
      let container = {promise: promise, resolve: resolve, reject: reject, message: message};
      if (this.promiseInProgress === undefined) {
        this.executePromise(container);
      }
      else {
        if (priorityCommand === true) {
          LOG('BlePromiseManager: adding to top of stack: ', message, ' currentlyPending:', this.promiseInProgress.message);
          this.pendingPromises.unshift(container);
        }
        else {
          LOG('BlePromiseManager: adding to stack: ', message, ' currentlyPending:', this.promiseInProgress.message);
          this.pendingPromises.push(container);
        }
      }
    })
  }

  executePromise(promiseContainer) {
    LOG('BlePromiseManager: executing promise ', promiseContainer.message);

    this.promiseInProgress = promiseContainer;
    this.clearPendingPromiseTimeout = Scheduler.scheduleCallback(() => {
      LOGError('BlePromiseManager: Forced timeout after 60 seconds.');
      promiseContainer.reject(new Error("Forced timeout after 60 seconds."));
      BluenetPromises.phoneDisconnect().catch();
      this.moveOn();
    }, 60000, 'pendingPromiseTimeout');

    promiseContainer.promise()
      .then((data) => {
        LOG("BlePromiseManager: resolved");
        this.clearPendingPromiseTimeout();
        promiseContainer.resolve(data);
        this.moveOn();
      })
      .catch((err) => {
        LOG("BlePromiseManager: ERROR in promise (",promiseContainer.message,"):",err);
        this.clearPendingPromiseTimeout();
        promiseContainer.reject(err);
        this.moveOn();
      })
  }

  moveOn() {
    this.promiseInProgress = undefined;
    this.getNextPromise()
  }

  getNextPromise() {
    LOG('BlePromiseManager: get next');
    if (this.pendingPromises.length > 0) {
      let nextPromise = this.pendingPromises[0];
      this.executePromise(nextPromise);
      this.pendingPromises.shift();
    }
  }
}

export const BlePromiseManager = new BlePromiseManagerClass();