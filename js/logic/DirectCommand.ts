import { BlePromiseManager } from './BlePromiseManager'
import { BluenetPromiseWrapper } from '../native/libInterface/BluenetPromise';
import {LOG, LOGe} from '../logging/Log'

export class DirectCommand {
  handle   : any;

  constructor(handle) {
    this.handle = handle;
  }

  /**
   * Connect, perform action, disconnect
   * @param action --> a bleAction from Proxy
   * @param props  --> array of properties
   * @returns {*}
   */
  perform(action, props = []) {
    LOG.info("DirectCommand: connecting to " +  this.handle + " doing this: ", action, " with props ", props);
    return this.performCommand(action,props, false);
  }

  performPriority(action, props = []) {
    LOG.info("DirectCommand: HIGH PRIORITY: connecting to " +  this.handle + " doing this: ", action, " with props ", props);
    return this.performCommand(action, props, true)
  }


  performCommand(action, props = [], priorityCommand) {
    let actionPromise = () => {
      if (this.handle) {
        return BluenetPromiseWrapper.connect(this.handle)
          .then(() => { LOG.info("DirectCommand: connected, performing: ", action, props); return action.apply(this, props); })
          .catch((err) => {
            if (err === 'NOT_CONNECTED') {
              return BluenetPromiseWrapper.connect(this.handle)
                .then(() => { LOG.info("DirectCommand: second attempt, performing: ", action, props); return action.apply(this, props); })
            }
          })
          .then(() => { LOG.info("DirectCommand: completed", action, 'disconnecting'); return BluenetPromiseWrapper.disconnectCommand(); })
          .catch((err) => {
            LOGe.ble("DirectCommand: BLE Single command Error:", err);
            return new Promise((resolve,reject) => {
              BluenetPromiseWrapper.phoneDisconnect().then(() => { reject(err) }).catch(() => { reject(err) });
            })
          })
      }
      else {
        return new Promise((resolve, reject) => {
          reject("DirectCommand: cant connect, no handle available.");
        })
      }
    };

    let details = { from: 'DirectCommand: connecting to ' + this.handle + ' doing this: ' + action + ' with props ' + props };

    if (priorityCommand) {
      return BlePromiseManager.registerPriority(actionPromise, details);
    }
    else {
      return BlePromiseManager.register(actionPromise, details);
    }
  }


  performMultipleCommands(actions = [], priorityCommand) {
    let actionIndex = 0;
    let retryCount = 0;
    let retryLimit = 1;
    let actionStep = (result) => {
      return new Promise((resolve, reject) => {
        let mostUpToDateResult = result;
        if (actionIndex < actions.length) {
          actions[actionIndex](result)
            .then((innerResult) => {
              mostUpToDateResult = innerResult;
              actionIndex++;
              return actionStep(innerResult)
                .then(() => { resolve(); })
            })
            .catch((err) => {
              if (err === 'NOT_CONNECTED' && retryCount < retryLimit) {
                retryCount++;
                return BluenetPromiseWrapper.connect(this.handle)
              }

              throw err;
            })
            .then(() => {
              return actionStep(mostUpToDateResult)
                .then(() => { resolve(); })
                .catch((err) => { reject(err); })
            })
            .catch((err) => {
              reject(err);
            })
        }
        else {
          resolve();
        }
      })
    };


    let actionPromise = () => {
      if (this.handle) {
        return BluenetPromiseWrapper.connect(this.handle)
          .then(() => {
            return actionStep(undefined);
          })
          .then(() => { LOG.info("DirectCommand: performMultipleCommands: completed", actions, 'disconnecting'); return BluenetPromiseWrapper.disconnectCommand(); })
          .catch((err) => {
            LOGe.ble("performMultipleCommands: BLE Single command Error:", err);
            return new Promise((resolve,reject) => {
              BluenetPromiseWrapper.phoneDisconnect().then(() => { reject(err) }).catch(() => { reject(err) });
            })
          })
      }
      else {
        return new Promise((resolve, reject) => {
          reject("DirectCommand: performMultipleCommands: cant connect, no handle available.");
        })
      }
    };

    let details = { from: 'DirectCommand: performMultipleCommands: connecting to ' + this.handle + ' doing this: multiple actions.' };

    if (priorityCommand) {
      return BlePromiseManager.registerPriority(actionPromise, details);
    }
    else {
      return BlePromiseManager.register(actionPromise, details);
    }
  }
}

