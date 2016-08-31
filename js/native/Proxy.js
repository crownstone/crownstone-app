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
  console.log("NATIVE CALLS ARE DISABLES BY EXTERNALCONFIG.JS")
  Bluenet = {

    rerouteEvents: () => {},
    isReady: () => {},
    connect: () => {},
    disconnect: () => {},
    phoneDisconnect: () => {},
    setSwitchState: () => {},
    startScanning: () => {},
    startScanningForCrownstones: () => {},
    stopScanning: () => {},
    trackIBeacon: () => {},
    stopIBeaconTracking: () => {},
    resumeIBeaconTracking: () => {},
    startCollectingFingerprint: () => {},
    abortCollectingFingerprint: () => {},
    pauseCollectingFingerprint : () => {},
    resumeCollectingFingerprint: () => {},
    finalizeFingerprint: () => {},
    getFingerprint: () => {},
    loadFingerprint: () => {},
    getMACAddress: () => {},
    recover: () => {},
    setupCrownstone: () => {},
  }
}
else {
  Bluenet = NativeModules.BluenetJS;
}

export const BluenetPromise = function(functionName, param) {
  console.log("called bluenetPromise", functionName, " with param", param);
  return new Promise((resolve, reject) => {
    if (DISABLE_NATIVE === true) {
      resolve()
    }
    else {
      if (param === undefined) {
        Bluenet[functionName]((result) => {
          if (result.error === true) {
            console.log("PROMISE REJECTED WHEN CALLING ", functionName, " error:", result.data);
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
            console.log("PROMISE REJECTED WHEN CALLING ", functionName, "WITH PARAM:", param, "error:", result.data);
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


export const NativeEvents = {
  ble: {
    verifiedAdvertisementData: "verifiedAdvertisementData",
    nearestCrownstone:         "nearestCrownstone",
    nearestSetupCrownstone:    "nearestSetupCrownstone",
  },
  location: {
    iBeaconAdvertisement: "iBeaconAdvertisement",
    enterGroup:           "enterGroup",
    exitGroup:            "exitGroup",
    enterLocation:        "enterLocation",
    exitLocation:         "exitLocation",
    currentLocation:      "currentLocation",
  }
};

export const BleActions = {
  isReady:        ()      => { return BluenetPromise('isReady');              },
  connect:        (uuid)  => { return BluenetPromise('connect', uuid);        },
  disconnect:     ()      => { return BluenetPromise('disconnect');           },
  phoneDisconnect:()      => { return BluenetPromise('phoneDisconnect');      },
  setSwitchState: (state) => { return BluenetPromise('setSwitchState', state);},
  getMACAddress:  ()      => { return BluenetPromise('getMACAddress');        },
  setupCrownstone:(dataString) => { return BluenetPromise('setupCrownstone', dataString); },
  setSettings:    (dataString) => { return BluenetPromise('setSettings', dataString); },
  factoryReset:   ()      => { return BluenetPromise('factoryReset'); },
};


