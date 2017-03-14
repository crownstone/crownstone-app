import { LOG } from '../logging/Log'
import { Scheduler } from '../logic/Scheduler'
import { BluenetPromiseWrapper } from '../native/Proxy'


class BlePromiseManagerClass {
  pendingPromises : any;
  promiseInProgress : any;
  clearPendingPromiseTimeout : any;


  constructor() {
    this.pendingPromises = [];
    this.promiseInProgress = undefined;
    this.clearPendingPromiseTimeout = undefined;
  }

  register(promise : () => Promise<any>, message) {
    return this._register(promise, message, false);
  }

  registerPriority(promise : () => Promise<any>, message) {
    return this._register(promise, message, true);
  }

  _register(promise : () => Promise<any>, message, priorityCommand : boolean = false) {
    LOG.info("BlePromiseManager: registered promise in manager");
    return new Promise((resolve, reject) => {
      let container = { promise: promise, resolve: resolve, reject: reject, message: message };
      if (this.promiseInProgress === undefined) {
        this.executePromise(container);
      }
      else {
        if (priorityCommand === true) {
          LOG.info('BlePromiseManager: adding to top of stack: ', message, ' currentlyPending:', this.promiseInProgress.message);
          this.pendingPromises.unshift(container);
        }
        else {
          LOG.info('BlePromiseManager: adding to stack: ', message, ' currentlyPending:', this.promiseInProgress.message);
          this.pendingPromises.push(container);
        }
      }
    })
  }

  executePromise(promiseContainer) {
    LOG.info('BlePromiseManager: executing promise ', promiseContainer.message);

    this.promiseInProgress = promiseContainer;
    this.clearPendingPromiseTimeout = Scheduler.scheduleCallback(() => {
      LOG.error('BlePromiseManager: Forced timeout after 60 seconds.');
      promiseContainer.reject(new Error("Forced timeout after 60 seconds."));
      BluenetPromiseWrapper.phoneDisconnect().catch((err) => {});
      this.moveOn();
    }, 60000, 'pendingPromiseTimeout');

    promiseContainer.promise()
      .then((data) => {
        LOG.info("BlePromiseManager: resolved");
        this.clearPendingPromiseTimeout();
        promiseContainer.resolve(data);
        this.moveOn();
      })
      .catch((err) => {
        LOG.info("BlePromiseManager: ERROR in promise (",promiseContainer.message,"):",err);
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
    LOG.info('BlePromiseManager: get next');
    if (this.pendingPromises.length > 0) {
      let nextPromise = this.pendingPromises[0];
      this.executePromise(nextPromise);
      this.pendingPromises.shift();
    }
  }
}

export const BlePromiseManager = new BlePromiseManagerClass();