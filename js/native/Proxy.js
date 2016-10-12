import { Alert, NativeModules, NativeAppEventEmitter } from 'react-native';
import { DISABLE_NATIVE } from '../ExternalConfig'
import { LOG, LOGError } from '../logging/Log'
import { eventBus }  from '../util/eventBus'

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
    startScanningForCrownstonesUniqueOnly: () => {},
    stopScanning: () => {},
    trackIBeacon: () => {},
    stopTrackingIBeacon: () => {},
    pauseTracking: () => {},
    resumeTracking: () => {},
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


export const BleActions = {
  clearTrackedBeacons: () => { return BluenetPromise('clearTrackedBeacons');  },
  isReady:             () => { return BluenetPromise('isReady');              },
  connect:             (handle) => {
    // tell the app that something is connecting.
    eventBus.emit("connect", handle);

    // connect
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
  disconnect:           ()           => { return BluenetPromise('disconnect');                  },
  phoneDisconnect:      ()           => { return BluenetPromise('phoneDisconnect');             },
  setSwitchState:       (state)      => { return BluenetPromise('setSwitchState',  state);      },
  getMACAddress:        ()           => { return BluenetPromise('getMACAddress');               },
  setupCrownstone:      (dataObject) => { return BluenetPromise('setupCrownstone', dataObject); },
  setSettings:          (dataObject) => { return BluenetPromise('setSettings',     dataObject); },
  recover:              (handle)     => { return BluenetPromise('recover',         handle);     },
  commandFactoryReset:  ()           => { return BluenetPromise('commandFactoryReset');         },
};

class NativeBusClass {
  constructor() {
    this.topics = {
      setupAdvertisement:   "verifiedSetupAdvertisementData",
      dfuAdvertisement:     "verifiedDFUAdvertisementData",
      advertisement:        "verifiedAdvertisementData",        // = from crownstone in normal operation mode.
      anyAdvertisement:     "anyVerifiedAdvertisementData",
      setupProgress:        "setupProgress",
      bleStatus:            "BleStatus",

      nearest:              "nearestCrownstone",
      nearestSetup:         "nearestSetupCrownstone",

      iBeaconAdvertisement: "iBeaconAdvertisement",
      enterSphere:          "enterSphere",
      exitSphere:           "exitSphere",
      enterRoom:            "enterLocation",
      exitRoom:             "exitLocation",
      currentRoom:          "currentLocation",
    };

    this.refMap = {};
    Object.keys(this.topics).forEach((key) => {
      this.refMap[this.topics[key]] = true;
    })
  }

  on(topic, callback) {
    if (!(topic)) {
      LOGError("Attempting to subscribe to undefined topic:", topic);
      return;
    }
    if (!(callback)) {
      LOGError("Attempting to subscribe without callback to topic:", topic);
      return;
    }
    if (this.refMap[topic] === undefined) {
      LOGError("Attempting to subscribe to a topic that does not exist in the native bus.", topic);
      return;
    }

    // subscribe to native event.
    let subscription = NativeAppEventEmitter.addListener(topic, callback);

    // return unsubscribe function.
    return () => {
      subscription.remove();
    };
  }
}

export const NativeBus = new NativeBusClass();

