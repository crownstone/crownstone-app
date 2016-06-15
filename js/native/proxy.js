import { NativeModules, NativeAppEventEmitter } from 'react-native';
import { DISABLE_NATIVE } from '../ExternalConfig'
// var subscription = NativeAppEventEmitter.addListener(
//   'EventReminder',
//   (reminder) => console.log(reminder.name)
// );
//
// // Don't forget to unsubscribe, typically in componentWillUnmount
// subscription.remove();


export let Bluenet;
if (DISABLE_NATIVE === true) {
  Bluenet = {
    isReady: () => {},
    rerouteEvents: () => {},
    startScanning: () => {},
    startScanningForCrownstones: () => {},
    startScanningForServices: () => {},
    stopScanning: () => {},
    connect: () => {},
    disconnect: () => {},
    setSwitchState: () => {},
    trackUUID: () => {},
    startCollectingFingerprint: () => {},
    abortCollectingFingerprint: () => {},
    finalizeFingerprint: () => {},
    getFingerprint: () => {}
  }
}
else {
  Bluenet = NativeModules.BluenetJS;
}



export const BluenetPromise = function(functionName, param) {
  return new Promise((resolve, reject) => {
    if (DISABLE_NATIVE === true) {
      resolve()
    }
    else {
      if (param === undefined) {
        Bluenet[functionName]((result) => {
          if (result.error === true) {
            reject(result.data);
          }
          else {
            resolve(result.data);
          }
        })
      }
      else {
        Bluenet[functionName](param, (result) => {
          if (result.error === true) {
            reject(result.data);
          }
          else {
            resolve(result.data);
          }
        })
      }
    }
  })
};


