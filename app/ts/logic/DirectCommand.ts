// import { BlePromiseManager } from './BlePromiseManager'
// import { BluenetPromiseWrapper } from '../native/libInterface/BluenetPromise';
// import {LOG, LOGe} from '../logging/Log'
//
// export class DirectCommand {
//   handle      : any;
//   referenceId : any;
//
//   constructor(handle, referenceId) {
//     this.handle = handle;
//     this.referenceId = referenceId;
//   }
//
//   /**
//    * Connect, perform action, disconnect
//    * @param action --> a bleAction from Proxy
//    * @param props  --> array of properties
//    * @returns {*}
//    */
//   perform(action : (...any) => Promise<any>, props = [], options = {}) {
//     LOG.bch("DirectCommand: connecting to " +  this.handle + " doing this: ", action, " with props ", props);
//     return this.performCommand(action,props, false, options);
//   }
//
//   performPriority(action : (...any) => Promise<any>, props = [], options = {}) {
//     LOG.bch("DirectCommand: HIGH PRIORITY: connecting to " +  this.handle + " doing this: ", action, " with props ", props);
//     return this.performCommand(action, props, true, options)
//   }
//
//
//   performCommand(action, props = [], priorityCommand, options : batchCommandEntryOptions = {}) {
//     let actionPromise = () => {
//       if (this.handle) {
//         let resultData = undefined;
//         return BluenetPromiseWrapper.connect(this.handle, this.referenceId)
//           .then(() => { LOG.bch("DirectCommand: connected, performing: ", action, props); return action.apply(this, props); })
//           .catch((err) => {
//             if (err === 'NOT_CONNECTED') {
//               return BluenetPromiseWrapper.connect(this.handle, this.referenceId)
//                 .then(() => { LOG.bch("DirectCommand: second attempt, performing: ", action, props); return action.apply(this, props); })
//             }
//             else {
//               throw err;
//             }
//           })
//           .then((data) => {
//             resultData = {data:data};
//             if (!options || options && options.keepConnectionOpen !== true) {
//               LOG.bch("DirectCommand: completed", action, 'disconnecting', data);
//               return BluenetPromiseWrapper.phoneDisconnect(this.handle);
//             }
//           })
//           .catch((err) => {
//             LOGe.bch("DirectCommand: BLE Single command Error:", err);
//             throw err;
//           })
//           .then(() => {
//             LOG.bch("DirectCommand: finished. forwarding data:", resultData);
//             return resultData;
//           })
//       }
//       else {
//         return new Promise((resolve, reject) => {
//           reject("DirectCommand: cant connect, no handle available.");
//         })
//       }
//     };
//
//     let details = { from: 'DirectCommand: connecting to ' + this.handle + ' doing this: ' + action + ' with props ' + props };
//
//     if (priorityCommand) {
//       return BlePromiseManager.registerPriority(actionPromise, details);
//     }
//     else {
//       return BlePromiseManager.register(actionPromise, details);
//     }
//   }
//
//
//   performMultipleCommands(actions = [], priorityCommand) {
//     let actionIndex = 0;
//     let retryCount = 0;
//     let retryLimit = 1;
//     let actionStep = (result) => {
//       return new Promise<void>((resolve, reject) => {
//         let mostUpToDateResult = result;
//         if (actionIndex < actions.length) {
//           actions[actionIndex](result)
//             .then((innerResult) => {
//               mostUpToDateResult = innerResult;
//               actionIndex++;
//               return actionStep(innerResult)
//                 .then(() => { resolve(); })
//             })
//             .catch((err) => {
//               if (err === 'NOT_CONNECTED' && retryCount < retryLimit) {
//                 retryCount++;
//                 return BluenetPromiseWrapper.connect(this.handle, this.referenceId)
//               }
//
//               throw err;
//             })
//             .then(() => {
//               return actionStep(mostUpToDateResult)
//                 .then(() => { resolve(); })
//                 .catch((err) => { reject(err); })
//             })
//             .catch((err) => {
//               reject(err);
//             })
//         }
//         else {
//           resolve();
//         }
//       })
//     };
//
//
//     let actionPromise = () => {
//       if (this.handle) {
//         return BluenetPromiseWrapper.connect(this.handle, this.referenceId)
//           .then(() => {
//             return actionStep(undefined);
//           })
//           .then(() => { LOG.bch("DirectCommand: performMultipleCommands: completed", actions, 'disconnecting'); return BluenetPromiseWrapper.disconnectCommand(this.handle); })
//           .catch((err) => {
//             LOGe.bch("performMultipleCommands: BLE Single command Error:", err);
//             return new Promise((resolve,reject) => {
//               BluenetPromiseWrapper.phoneDisconnect(this.handle).then(() => { reject(err) }).catch(() => { reject(err) });
//             })
//           })
//       }
//       else {
//         return new Promise((resolve, reject) => {
//           reject("DirectCommand: performMultipleCommands: cant connect, no handle available.");
//         })
//       }
//     };
//
//     let details = { from: 'DirectCommand: performMultipleCommands: connecting to ' + this.handle + ' doing this: multiple actions.' };
//
//     if (priorityCommand) {
//       return BlePromiseManager.registerPriority(actionPromise, details);
//     }
//     else {
//       return BlePromiseManager.register(actionPromise, details);
//     }
//   }
// }
//
