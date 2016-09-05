
class BlePromiseManagerClass {
  constructor() {
    this.pendingPromises = [];
    this.promiseInProgress = undefined;
  }

  register(promise, message) {
    // console.log("registered promise in manager")
    return new Promise((resolve, reject) => {
      let container = {promise: promise, resolve: resolve, reject: reject, message:message};
      if (this.promiseInProgress === undefined) {
        this.executePromise(container);
      }
      else {
        // console.log('adding to stack');
        // console.log('currentlyPending:', this.promiseInProgress.message);
        this.pendingPromises.push(container);
      }
    })
  }

  executePromise(promiseContainer) {
    // console.log('executed promise ', promiseContainer.message)
    this.promiseInProgress = promiseContainer;
    promiseContainer.promise()
      .then(() => {
        // console.log("resolved");
        promiseContainer.resolve();
        this.moveOn();
      })
      .catch((err) => {
        // console.log("ERROR in promise (",promiseContainer.message,"):",err);
        promiseContainer.reject(err);
        this.moveOn();
      })
  }

  moveOn() {
    this.promiseInProgress = undefined;
    this.getNextPromise()
  }

  getNextPromise() {
    // console.log('get next')
    if (this.pendingPromises.length > 0) {
      let nextPromise = this.pendingPromises[0];
      this.executePromise(nextPromise);
      this.pendingPromises.shift();
    }
  }
}

export const BlePromiseManager = new BlePromiseManagerClass();