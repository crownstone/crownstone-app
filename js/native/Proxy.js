import { Alert, NativeModules, NativeAppEventEmitter } from 'react-native';
import { DISABLE_NATIVE } from '../ExternalConfig'
import { LOG, LOGDebug, LOGError } from '../logging/Log'
import { eventBus }  from '../util/eventBus'

export let Bluenet;
if (DISABLE_NATIVE === true) {
  LOG("!----------- --- --- --- -- -- -- - - - -- -- -- --- --- --- -----------!");
  LOG("!-----------  NATIVE CALLS ARE DISABLED BY EXTERNALCONFIG.JS -----------!");
  LOG("!----------- --- --- --- -- -- -- - - - -- -- -- --- --- --- -----------!");
  Bluenet = {
    clearTrackedBeacons: () => {},        // called through BleActions --> must be promise.
    rerouteEvents: () => {},
    isReady: () => {},                    // called through BleActions --> must be promise.
    connect: () => {},                    // called through BleActions --> must be promise.
    disconnect: () => {},                 // called through BleActions --> must be promise.
    phoneDisconnect: () => {},            // called through BleActions --> must be promise.
    setSwitchState: () => {},             // called through BleActions --> must be promise.
    startScanning: () => {},
    startScanningForCrownstones: () => {},
    startScanningForCrownstonesUniqueOnly: () => {},
    stopScanning: () => {},

    startIndoorLocalization: () => {},
    stopIndoorLocalization: () => {},

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
    getMACAddress: () => {},             // called through BleActions --> must be promise.
    commandFactoryReset: () => {},       // called through BleActions --> must be promise.
    recover: () => {},                   // called through BleActions --> must be promise.
    setupCrownstone: () => {},           // called through SetupCrownstone in BLEUtil
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
  disconnect: () => {
    return BluenetPromise('disconnect')
      .then( () => { eventBus.emit("disconnect"); })
      .catch(() => { eventBus.emit("disconnect"); })
  },
  phoneDisconnect: () => {
    return BluenetPromise('phoneDisconnect')
      .then(() => { eventBus.emit("disconnect"); })
      .catch(() => { eventBus.emit("disconnect"); })
  },
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
      setupAdvertisement:   "verifiedSetupAdvertisementData",   // data type = type_advertisement
      dfuAdvertisement:     "verifiedDFUAdvertisementData",     // data type = type_advertisement
      advertisement:        "verifiedAdvertisementData",        // data type = type_advertisement // = from crownstone in normal operation mode.
      anyAdvertisement:     "anyVerifiedAdvertisementData",     // data type = type_advertisement
      setupProgress:        "setupProgress",                    // data type = number ([1 .. 13], 0 for error)
      bleStatus:            "bleStatus",                        // data type = string ("unauthorized", "poweredOff", "poweredOn", "unknown")

      nearest:              "nearestCrownstone",                // data type = type_nearest
      nearestSetup:         "nearestSetupCrownstone",           // data type = type_nearest

      iBeaconAdvertisement: "iBeaconAdvertisement",             // data type = type_beacon[]
      enterSphere:          "enterSphere",                      // data type = string (sphereId)
      exitSphere:           "exitSphere",                       // data type = string (sphereId)
      enterRoom:            "enterLocation",                    // data type = string (locationId)
      exitRoom:             "exitLocation",                     // data type = string (locationId)
      currentRoom:          "currentLocation",                  // data type = string (locationId)
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



/** type defs **/

// type type_serviceData = {  // this is part of the advertisement
//   firmwareVersion   : number,
//   crownstoneId      : string,
//   switchState       : number,
//   eventBitmask      : number,
//   temperature       : number,
//   powerUsage        : number,
//   accumulatedEnergy : number,
//   newDataAvailable  : boolean,
//   stateOfExternalCrownstone: boolean,
//   setupMode         : boolean,
//   dfuMode           : boolean,
//   random            : string
// }
//
// type type_advertisement = {
//   handle            : string,
//   name              : string,
//   rssi              : number,
//   referenceId       : string,
//   isCrownstoneFamily  : boolean,
//   isCrownstonePlug    : boolean,
//   isCrownstoneBuiltin : boolean,
//   isGuidestone        : boolean,
//   serviceUUID       : string,
//   serviceData       : type_serviceData
// }
//
// type type_nearest = {
//   name      : string,
//   handle    : string,
//   rssi      : number,
//   setupMode : boolean
// }
//
// type type_beacon = {
//   id        : string,
//   uuid      : string,
//   major     : number,
//   minor     : number,
//   rssi      : number,
//   referenceId : string,
// }

/** end of type **/