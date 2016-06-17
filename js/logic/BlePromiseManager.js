
class BlePromiseManagerClass {
  constructor() {
    this.pendingPromises = [];
    this.promiseInProgress = undefined;
  }

  register(promise, message) {
    console.log("registered")
    return new Promise((resolve, reject) => {
      let container = {promise: promise, resolve: resolve, reject: reject, message:message};
      if (this.promiseInProgress === undefined) {
        this.executePromise(container);
      }
      else {
        console.log('adding to stack');
        console.log('currentlyPending:', this.promiseInProgress.message);
        this.pendingPromises.push(container);
      }
    })
  }

  executePromise(promiseContainer) {
    console.log('executed')
    this.promiseInProgress = promiseContainer;
    promiseContainer.promise()
      .then(() => {
        console.log("resolved")
        this.promiseInProgress = undefined;
        promiseContainer.resolve();
        this.getNextPromise()
      })
      .catch((err) => {
        promiseContainer.reject(err);
        console.log("ERROR in promise:",err);
      })
  }

  getNextPromise() {
    console.log('get next')
    if (this.pendingPromises.length > 0) {
      let nextPromise = this.pendingPromises[0];
      this.executePromise(nextPromise);
      this.pendingPromises.shift();
    }
  }
}

export const BlePromiseManager = new BlePromiseManagerClass();