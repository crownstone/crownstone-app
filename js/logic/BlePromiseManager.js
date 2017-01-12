import { LOG } from '../logging/Log'


class BlePromiseManagerClass {
  constructor() {
    this.pendingPromises = [];
    this.promiseInProgress = undefined;
  }

  register(promise, message) {
    LOG("BlePromiseManager: registered promise in manager");
    return new Promise((resolve, reject) => {
      let container = {promise: promise, resolve: resolve, reject: reject, message: message};
      if (this.promiseInProgress === undefined) {
        this.executePromise(container);
      }
      else {
        LOG('BlePromiseManager: adding to stack');
        LOG('BlePromiseManager: currentlyPending:', this.promiseInProgress.message);
        this.pendingPromises.push(container);
      }
    })
  }

  executePromise(promiseContainer) {
    LOG('BlePromiseManager: executing promise ', promiseContainer.message);
    this.promiseInProgress = promiseContainer;
    promiseContainer.promise()
      .then(() => {
        LOG("BlePromiseManager: resolved");
        promiseContainer.resolve();
        this.moveOn();
      })
      .catch((err) => {
        LOG("BlePromiseManager: ERROR in promise (",promiseContainer.message,"):",err);
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