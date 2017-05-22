import { BlePromiseManager } from './BlePromiseManager'
import { BluenetPromiseWrapper } from '../native/libInterface/BluenetPromise';
import { LOG } from '../logging/Log'

export class SingleCommand {
  sphereId : any;
  stoneId  : any;
  handle   : any;

  constructor(handle, sphereId, stoneId) {
    this.sphereId = sphereId;
    this.stoneId = stoneId;
    this.handle = handle;
  }

  /**
   * Connect, perform action, disconnect
   * @param action --> a bleAction from Proxy
   * @param props  --> array of properties
   * @returns {*}
   */
  perform(action, props = []) {
    LOG.info("SingleCommand: connecting to " +  this.handle + " doing this: ", action, " with props ", props);
    return this.performCommand(action,props, false);
  }

  performPriority(action, props = []) {
    LOG.info("SingleCommand: HIGH PRIORITY: connecting to " +  this.handle + " doing this: ", action, " with props ", props);
    return this.performCommand(action, props, true)
  }


  performCommand(action, props = [], priorityCommand) {
    let actionPromise = () => {
      if (this.handle) {
        return BluenetPromiseWrapper.connect(this.handle)
          .then(() => { LOG.info("SingleCommand: connected, performing: ", action, props); return action.apply(this, props); })
          .catch((err) => {
            if (err === 'NOT_CONNECTED') {
              return BluenetPromiseWrapper.connect(this.handle)
                .then(() => { LOG.info("SingleCommand: second attempt, performing: ", action, props); return action.apply(this, props); })
            }
          })
          .then(() => { LOG.info("SingleCommand: completed", action, 'disconnecting'); return BluenetPromiseWrapper.disconnect(); })
          .catch((err) => {
            LOG.error("SingleCommand: BLE Single command Error:", err);
            return new Promise((resolve,reject) => {
              BluenetPromiseWrapper.phoneDisconnect().then(() => { reject(err) }).catch(() => { reject(err) });
            })
          })
      }
      else {
        return new Promise((resolve, reject) => {
          reject("SingleCommand: cant connect, no handle available.");
        })
      }
    };

    let details = { from: 'SingleCommand: connecting to ' + this.handle + ' doing this: ' + action + ' with props ' + props };

    if (priorityCommand) {
      return BlePromiseManager.registerPriority(actionPromise, details);
    }
    else {
      return BlePromiseManager.register(actionPromise, details);
    }
  }
}

