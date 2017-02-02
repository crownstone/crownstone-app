import { Alert, NativeModules, NativeAppEventEmitter } from 'react-native';
import { DISABLE_NATIVE, DEBUG_BLE } from '../ExternalConfig'
import { LOG, LOGDebug, LOGError, LOGBle } from '../logging/Log'
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
    resetBle: () => {},
    setSwitchState: () => {},             // called through BleActions --> must be promise.
    startScanning: () => {},
    startScanningForCrownstones: () => {},
    startScanningForCrownstonesUniqueOnly: () => {},
    stopScanning: () => {},
    keepAliveState: () => {},
    keepAlive: () => {},

    forceClearActiveRegion: () => {},
    startIndoorLocalization: () => {},
    stopIndoorLocalization: () => {},

    requestLocation: () => {},          // called through BleActions --> must be promise.
    requestLocationPermission: () => {},
    trackIBeacon: () => {},
    stopTrackingIBeacon: () => {},
    pauseTracking: () => {},
    resumeTracking: () => {},

    startCollectingFingerprint: () => {},
    abortCollectingFingerprint: () => {},
    pauseCollectingFingerprint : () => {},
    resumeCollectingFingerprint: () => {},
    finalizeFingerprint: () => {},       // called through BleActions --> must be promise. Promise return value is a stringified fingerprint

    loadFingerprint: () => {},
    getMACAddress: () => {},             // called through BleActions --> must be promise.
    commandFactoryReset: () => {},       // called through BleActions --> must be promise.
    recover: () => {},                   // called through BleActions --> must be promise.
    setupCrownstone: () => {},           // called through SetupCrownstone in BLEUtil

    quitApp: () => {},                   // Used in android to force close the app
    enableLoggingToFile: () => {},
    clearLogs: () => {},
  }
}
else {
  Bluenet = NativeModules.BluenetJS;
}

export const BluenetPromise = function(functionName, param, param2, param3) {
  return new Promise((resolve, reject) => {
    if (DISABLE_NATIVE === true) {
      resolve()
    }
    else {
      //TODO: cleanup
      if (param3 !== undefined) {
        LOG("called bluenetPromise", functionName, " with param", param, param2, param3);
        Bluenet[functionName](param, param2, param3, (result) => {
          if (result.error === true) {
            LOG("PROMISE REJECTED WHEN CALLING ", functionName, "WITH PARAM:", param, param2, param3, "error:", result.data);
            reject(result.data);
          }
          else {
            resolve(result.data);
          }
        })
      }
      else if (param2 !== undefined) {
        LOG("called bluenetPromise", functionName, " with param", param, param2);
        Bluenet[functionName](param, param2, (result) => {
          if (result.error === true) {
            LOG("PROMISE REJECTED WHEN CALLING ", functionName, "WITH PARAM:", param, param2, "error:", result.data);
            reject(result.data);
          }
          else {
            resolve(result.data);
          }
        })
      }
      else if (param !== undefined) {
        LOG("called bluenetPromise", functionName, " with param", param);
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
      else {
        LOG("called bluenetPromise", functionName, " without params");
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
  setSwitchState:       (state)      => { return BluenetPromise('setSwitchState',  state);      },  // Number  (0 .. 1)
  keepAliveState:       (changeState, state, timeout) => { return BluenetPromise('keepAliveState', changeState, state, timeout); }, //* Bool (or Number 0 or 1), Number  (0 .. 1), Number (seconds)
  keepAlive:            ()           => { return BluenetPromise('keepAlive');                   },
  getMACAddress:        ()           => { return BluenetPromise('getMACAddress');               },
  setupCrownstone:      (dataObject) => { return BluenetPromise('setupCrownstone', dataObject); },
  setSettings:          (dataObject) => { return BluenetPromise('setSettings',     dataObject); },
  requestLocation:      ()           => { return BluenetPromise('requestLocation');             },
  recover:              (handle)     => { return BluenetPromise('recover', handle);             },
  finalizeFingerprint:  (sphereId, locationId) => { return BluenetPromise('finalizeFingerprint', sphereId, locationId); }, //  will load the fingerprint into the classifier and return the stringified fingerprint.
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
      locationStatus:       "locationStatus",                   // data type = string ("unknown", "off", "foreground", "on")

      nearest:              "nearestCrownstone",                // data type = type_nearest
      nearestSetup:         "nearestSetupCrownstone",           // data type = type_nearest

      iBeaconAdvertisement: "iBeaconAdvertisement",             // data type = type_beacon[]
      enterSphere:          "enterSphere",                      // data type = string (sphereId)
      exitSphere:           "exitSphere",                       // data type = string (sphereId)
      enterRoom:            "enterLocation",                    // data type = {region: sphereId, location: locationId}
      exitRoom:             "exitLocation",                     // data type = {region: sphereId, location: locationId}
      currentRoom:          "currentLocation",                  // data type = {region: sphereId, location: locationId}
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


if (DEBUG_BLE) {
  NativeBus.on(NativeBus.topics.setupAdvertisement, (data) => {
    LOGBle('setupAdvertisement', data.name, data.rssi, data.handle);
  });
  NativeBus.on(NativeBus.topics.advertisement, (data) => {
    LOGBle('crownstoneId', data.name, data.rssi, data.handle);
  });
  NativeBus.on(NativeBus.topics.iBeaconAdvertisement, (data) => {
    LOGBle('iBeaconAdvertisement', data[0].rssi, data[0].major, data[0].minor);
  });
}


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