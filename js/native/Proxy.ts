import { Alert, NativeModules, NativeAppEventEmitter } from 'react-native';
import { DISABLE_NATIVE } from '../ExternalConfig'
import { LOG } from '../logging/Log'
import { Bluenet } from './Bluenet'
import { eventBus }  from '../util/EventBus'

export const INTENTS = {
  sphereEnter: 0,
  sphereExit:  1,
  enter:       2,  // these are (will be) tracked for ownership
  exit:        3,  // these are (will be) tracked for ownership
  manual:      4,
};



export const BEHAVIOUR_TYPE_TO_INTENT = {
  onNear : 'enter',
  onAway : 'exit',
  onRoomEnter : 'enter',
  onRoomExit  : 'exit',
  onHomeEnter : 'sphereEnter',
  onHomeExit  : 'sphereExit',
};



export const BluenetPromise : any = function(functionName, param, param2, param3) {
  return new Promise((resolve, reject) => {
    if (DISABLE_NATIVE === true) {
      resolve()
    }
    else {
      //TODO: cleanup
      if (param3 !== undefined) {
        LOG.info("called bluenetPromise", functionName, " with param", param, param2, param3);
        Bluenet[functionName](param, param2, param3, (result) => {
          if (result.error === true) {
            LOG.info("PROMISE REJECTED WHEN CALLING ", functionName, "WITH PARAM:", param, param2, param3, "error:", result.data);
            reject(result.data);
          }
          else {
            resolve(result.data);
          }
        })
      }
      else if (param2 !== undefined) {
        LOG.info("called bluenetPromise", functionName, " with param", param, param2);
        Bluenet[functionName](param, param2, (result) => {
          if (result.error === true) {
            LOG.info("PROMISE REJECTED WHEN CALLING ", functionName, "WITH PARAM:", param, param2, "error:", result.data);
            reject(result.data);
          }
          else {
            resolve(result.data);
          }
        })
      }
      else if (param !== undefined) {
        LOG.info("called bluenetPromise", functionName, " with param", param);
        Bluenet[functionName](param, (result) => {
          if (result.error === true) {
            LOG.info("PROMISE REJECTED WHEN CALLING ", functionName, "WITH PARAM:", param, "error:", result.data);
            reject(result.data);
          }
          else {
            resolve(result.data);
          }
        })
      }
      else {
        LOG.info("called bluenetPromise", functionName, " without params");
        Bluenet[functionName]((result) => {
          if (result.error === true) {
            LOG.info("PROMISE REJECTED WHEN CALLING ", functionName, " error:", result.data);
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

export const BluenetPromiseWrapper : BluenetPromiseWrapper = {
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
      .then( () => { eventBus.emit("disconnect"); })
      .catch(() => { eventBus.emit("disconnect"); })
  },
  setSwitchState:       (state)      => { return BluenetPromise('setSwitchState',  state);      },  // Number  (0 .. 1),
  keepAliveState:       (changeState, state, timeout) => { return BluenetPromise('keepAliveState', changeState, state, timeout); }, //* Bool (or Number 0 or 1), Number  (0 .. 1), Number (seconds)
  keepAlive:            ()           => { return BluenetPromise('keepAlive');                   },
  getMACAddress:        ()           => { return BluenetPromise('getMACAddress');               },
  setupCrownstone:      (dataObject) => { return BluenetPromise('setupCrownstone', dataObject); },
  setSettings:          (dataObject) => { return BluenetPromise('setSettings',     dataObject); },
  requestLocation:      ()           => { return BluenetPromise('requestLocation');             },
  recover:              (handle)     => { return BluenetPromise('recover', handle);             },
  finalizeFingerprint:  (sphereId, locationId) => { return BluenetPromise('finalizeFingerprint', sphereId, locationId); }, //  will load the fingerprint into the classifier and return the stringified fingerprint.
  commandFactoryReset:  ()           => { return BluenetPromise('commandFactoryReset');         },

  //new
  meshKeepAlive:              ()                               => { return BluenetPromise('meshKeepAlive'); },
  meshKeepAliveState:         (timeout, stoneKeepAlivePackets) => { return BluenetPromise('meshKeepAliveState',   timeout, stoneKeepAlivePackets); }, // stoneKeepAlivePackets = [{crownstoneId: number(uint16), action: Boolean, state: number(float) [ 0 .. 1 ]}]
  meshCommandSetSwitchState:  (arrayOfIds, state)              => { return BluenetPromise('meshCommandSetSwitchState', arrayOfIds, state);         }, // idArray = [number(uint16)]
  multiSwitch:                (arrayOfStoneSwitchPackets)      => { return BluenetPromise('multiSwitch',               arrayOfStoneSwitchPackets); }, // stoneSwitchPacket = {crownstoneId: number(uint16), timeout: number(uint16), state: number(float) [ 0 .. 1 ], intent: number [0,1,2,3,4] }
};

class NativeBusClass {
  topics: any;
  refMap: any;

  constructor() {
    this.topics = {
      setupAdvertisement:   "verifiedSetupAdvertisementData",   // data type = crownstoneAdvertisement
      dfuAdvertisement:     "verifiedDFUAdvertisementData",     // data type = crownstoneAdvertisement
      advertisement:        "verifiedAdvertisementData",        // data type = crownstoneAdvertisement // = from crownstone in normal operation mode.
      anyAdvertisement:     "anyVerifiedAdvertisementData",     // data type = crownstoneAdvertisement
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
    });
  }

  on(topic, callback) {
    if (!(topic)) {
      LOG.error("Attempting to subscribe to undefined topic:", topic);
      return;
    }
    if (!(callback)) {
      LOG.error("Attempting to subscribe without callback to topic:", topic);
      return;
    }
    if (this.refMap[topic] === undefined) {
      LOG.error("Attempting to subscribe to a topic that does not exist in the native bus.", topic);
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