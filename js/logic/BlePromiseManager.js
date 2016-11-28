import { LOG } from '../logging/Log'


class BlePromiseManagerClass {
  constructor() {
    this.pendingPromises = [];
    this.promiseInProgress = undefined;
  }

  register(promise, message) {
    LOG("registered promise in manager");
    return new Promise((resolve, reject) => {
      let container = {promise: promise, resolve: resolve, reject: reject, message:message};
      if (this.promiseInProgress === undefined) {
        this.executePromise(container);
      }
      else {
        LOG('adding to stack');
        LOG('currentlyPending:', this.promiseInProgress.message);
        this.pendingPromises.push(container);
      }
    })
  }

  executePromise(promiseContainer) {
    LOG('executed promise ', promiseContainer.message);
    this.promiseInProgress = promiseContainer;
    promiseContainer.promise()
      .then(() => {
        LOG("resolved");
        promiseContainer.resolve();
        this.moveOn();
      })
      .catch((err) => {
        LOG("ERROR in promise (",promiseContainer.message,"):",err);
        promiseContainer.reject(err);
        this.moveOn();
      })
  }

  moveOn() {
    this.promiseInProgress = undefined;
    this.getNextPromise()
  }

  getNextPromise() {
    LOG('get next');
    if (this.pendingPromises.length > 0) {
      let nextPromise = this.pendingPromises[0];
      this.executePromise(nextPromise);
      this.pendingPromises.shift();
    }
  }
}

export const BlePromiseManager = new BlePromiseManagerClass();