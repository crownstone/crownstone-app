import { Alert, NativeModules, NativeAppEventEmitter } from 'react-native';
import { DISABLE_NATIVE } from '../../ExternalConfig'
import { LOG } from '../../logging/Log'
import { Bluenet } from './Bluenet'
import { eventBus }  from '../../util/EventBus'

export const BluenetPromise : any = function(functionName, param, param2, param3, param4, param5) {
  return new Promise((resolve, reject) => {
    if (DISABLE_NATIVE === true) {
      resolve()
    }
    else {
      let bluenetArguments = [];
      let promiseResolver = (result) => {
        if (result.error === true) {
          LOG.info("PROMISE REJECTED WHEN CALLING ", functionName, " error:", result.data);
          reject(result.data);
        }
        else {
          resolve(result.data);
        }
      };

      // fill the bluenet arguments list with all arguments we will send to bluenet.
      for (let i = 1; i < arguments.length; i++) {
        bluenetArguments.push(arguments[i])
      }

      LOG.info("called bluenetPromise", functionName, " with params", bluenetArguments);

      // add the promise resolver to this list
      bluenetArguments.push(promiseResolver);
      Bluenet[functionName].apply(this, bluenetArguments);
    }
  })
};

export const BluenetPromiseWrapper : BluenetPromiseWrapperProtocol = {
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
    return BluenetPromise('disconnectCommand')
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

  meshKeepAlive:              ()                               => { return BluenetPromise('meshKeepAlive'); },
  meshKeepAliveState:         (timeout, stoneKeepAlivePackets) => { return BluenetPromise('meshKeepAliveState',   timeout, stoneKeepAlivePackets); }, // stoneKeepAlivePackets = [{crownstoneId: number(uint16), action: Boolean, state: number(float) [ 0 .. 1 ]}]
  multiSwitch:                (arrayOfStoneSwitchPackets)      => { return BluenetPromise('multiSwitch',               arrayOfStoneSwitchPackets); }, // stoneSwitchPacket = {crownstoneId: number(uint16), timeout: number(uint16), state: number(float) [ 0 .. 1 ], intent: number [0,1,2,3,4] }

  getFirmwareVersion:         () => { return BluenetPromise('getFirmwareVersion'); },
  getBootloaderVersion:       () => { return BluenetPromise('getBootloaderVersion'); },
  setupFactoryReset:          () => { return BluenetPromise('setupFactoryReset'); },
  putInDFU:                   () => { return BluenetPromise('putInDFU'); },
  performDFU:                 (handle, uri) => { return BluenetPromise('performDFU', handle, uri); },

  //new
  getHardwareVersion:         () => { return BluenetPromise('getHardwareVersion'); },
  setupPutInDFU:              () => { return BluenetPromise('setupPutInDFU'); },
  toggleSwitchState:          () => { return BluenetPromise('toggleSwitchState'); },
  bootloaderToNormalMode:     ( handle ) => { return BluenetPromise('bootloaderToNormalMode', handle); },
  getErrors:                  () => { return BluenetPromise('getErrors'); }, // returns { overCurrent: boolean, overCurrentDimmer: boolean, temperatureChip: boolean, temperatureDimmer: boolean, bitMask: uint32 }
  clearErrors:                (clearErrorJSON) => { return BluenetPromise('clearErrors', clearErrorJSON); },
  restartCrownstone:          () => { return BluenetPromise('restartCrownstone'); },
  clearFingerprintsPromise:   () => { return BluenetPromise('clearFingerprintsPromise'); },

};

