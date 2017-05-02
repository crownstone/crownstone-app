import { Alert, NativeModules, NativeAppEventEmitter } from 'react-native';
import { DISABLE_NATIVE } from '../../ExternalConfig'
import { LOG } from '../../logging/Log'
import { Bluenet } from './Bluenet'
import { eventBus }  from '../../util/EventBus'

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
          "Please move a little closer to it and try again.",
          [{text:'OK', onPress: reject}]
        )
      });
    }
  },
  // this never rejects
  disconnectCommand: () => {
    return BluenetPromise('disconnect')
      .then( () => { eventBus.emit("disconnect"); })
      .catch(() => { eventBus.emit("disconnect"); })
  },
  // this never rejects
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

  getFirmwareVersion:         () => { return BluenetPromise('getFirmwareVersion'); },
  setupFactoryReset:          () => { return BluenetPromise('setupFactoryReset'); },
  putInDFU:                   () => { return BluenetPromise('putInDFU'); },
  performDFU:                 (handle, uri) => { return BluenetPromise('performDFU', handle, uri); },
};

