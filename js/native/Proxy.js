import { Alert, NativeModules, NativeAppEventEmitter } from 'react-native';
import { DISABLE_NATIVE } from '../ExternalConfig'
import { LOG } from '../logging/Log'
// var subscription = NativeAppEventEmitter.addListener(
//   'EventReminder',
//   (reminder) => LOG(reminder.name)
// );
//
// // Don't forget to unsubscribe, typically in componentWillUnmount
// subscription.remove();


export let Bluenet;
if (DISABLE_NATIVE === true) {
  LOG("!----------- --- --- --- -- -- -- - - - -- -- -- --- --- --- -----------!");
  LOG("!-----------  NATIVE CALLS ARE DISABLED BY EXTERNALCONFIG.JS -----------!");
  LOG("!----------- --- --- --- -- -- -- - - - -- -- -- --- --- --- -----------!");
  Bluenet = {
    clearTrackedBeacons: () => {},
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
  LOG("called bluenetPromise", functionName, " with param", param);
  return new Promise((resolve, reject) => {
    if (DISABLE_NATIVE === true) {
      resolve()
    }
    else {
      if (param === undefined) {
        Bluenet[functionName]((result) => {
          if (result.error === true) {
            LOG("PROMISE REJECTED WHEN CALLING ", functionName, " error:", result.data);
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
            LOG("PROMISE REJECTED WHEN CALLING ", functionName, "WITH PARAM:", param, "error:", result.data);
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
    enterSphere:          "enterSphere",
    exitSphere:           "exitSphere",
    enterLocation:        "enterLocation",
    exitLocation:         "exitLocation",
    currentLocation:      "currentLocation",
  }
};

export const BleActions = {
  clearTrackedBeacons: () => { return BluenetPromise('clearTrackedBeacons');  },
  isReady:        ()      => { return BluenetPromise('isReady');              },
  connect:        (handle)=> {
    if (handle) {
      return BluenetPromise('connect', handle);
    }
    else {
      return new Promise((resolve, reject) => {
        Alert.alert(
          "Can't connect to this Crownstone.",
          "Please move a little closer to this Crownstone and try again.",
          [{text:'OK', onPress: reject}]
        )
      });
    }
  },
  disconnect:     ()      => { return BluenetPromise('disconnect');           },
  phoneDisconnect:()      => { return BluenetPromise('phoneDisconnect');      },
  setSwitchState: (state) => { return BluenetPromise('setSwitchState', state);},
  getMACAddress:  ()      => { return BluenetPromise('getMACAddress');        },
  setupCrownstone:(dataString) => { return BluenetPromise('setupCrownstone', dataString); },
  setSettings:    (dataString) => { return BluenetPromise('setSettings', dataString); },
  recover:        (handle)     => { return BluenetPromise('recover', handle); },
  commandFactoryReset:   ()      => { return BluenetPromise('commandFactoryReset'); },
};


