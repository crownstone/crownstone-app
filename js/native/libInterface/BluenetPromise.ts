import { Alert, NativeModules, NativeAppEventEmitter } from 'react-native';
import { DISABLE_NATIVE } from '../../ExternalConfig'
import { LOG, LOGi }      from '../../logging/Log'
import { Bluenet }        from './Bluenet'
import { eventBus }       from '../../util/EventBus'
import { Sentry }         from "react-native-sentry";

export const BluenetPromise : any = function(functionName, param, param2, param3, param4, param5) {
  return new Promise((resolve, reject) => {
    if (DISABLE_NATIVE === true) {
      resolve()
    }
    else {
      Sentry.captureBreadcrumb({
        category: 'ble',
        data: {
          functionCalled: functionName,
          t: new Date().valueOf(),
          state: 'started',
        }
      });
      let bluenetArguments = [];
      let promiseResolver = (result) => {
        if (result.error === true) {
          LOGi.bch("BluenetPromise: promise rejected in bridge: ", functionName, " error:", result.data);
          Sentry.captureBreadcrumb({
            category: 'ble',
            data: {
              functionCalled: functionName,
              t: new Date().valueOf(),
              state: 'failed',
              err: result.data
            }
          });
          reject(result.data);
        }
        else {
          Sentry.captureBreadcrumb({
            category: 'ble',
            data: {
              functionCalled: functionName,
              t: new Date().valueOf(),
              state: 'success',
            }
          });
          resolve(result.data);
        }
      };

      // fill the bluenet arguments list with all arguments we will send to bluenet.
      for (let i = 1; i < arguments.length; i++) {
        bluenetArguments.push(arguments[i])
      }

      LOGi.bch("BluenetPromise: called bluenetPromise", functionName, " with params", bluenetArguments);

      // add the promise resolver to this list
      bluenetArguments.push(promiseResolver);
      Bluenet[functionName].apply(this, bluenetArguments);
    }
  })
};

export const BluenetPromiseWrapper : BluenetPromiseWrapperProtocol = {
  clearTrackedBeacons: () => { return BluenetPromise('clearTrackedBeacons');  },
  isReady:             () => { return BluenetPromise('isReady');              },
  isPeripheralReady:   () => { return BluenetPromise('isPeripheralReady');    },
  connect:             (handle, referenceId, highPriority = true) => {
    // tell the app that something is connecting.
    eventBus.emit("connecting", handle, " with priority:", highPriority);

    // connect
    if (handle) {
      return BluenetPromise('connect', handle, referenceId)
        .then(() => {
          eventBus.emit("connected", handle);
        })
    }
    else if (highPriority) {
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
  keepAliveState:                 (changeState, state, timeout) => { return BluenetPromise('keepAliveState', changeState, state, timeout); }, //* Bool (or Number 0 or 1), Number  (0 .. 1), Number (seconds)
  keepAlive:                      ()           => { return BluenetPromise('keepAlive');                   },
  getMACAddress:                  ()           => { return BluenetPromise('getMACAddress');               },
  setupCrownstone:                (dataObject) => { return BluenetPromise('setupCrownstone', dataObject); },
  setKeySets:                     (dataObject) => { return BluenetPromise('setKeySets',      dataObject); },
  requestLocation:                ()           => { return BluenetPromise('requestLocation');             },
  recover:                        (handle)     => { return BluenetPromise('recover', handle);             }, // Connect, recover, and disconnect. If stone is not in recovery mode, then return string "NOT_IN_RECOVERY_MODE" as error data.
  finalizeFingerprint:            (sphereId, locationId) => { return BluenetPromise('finalizeFingerprint', sphereId, locationId); }, //  will load the fingerprint into the classifier and return the stringified fingerprint.
  commandFactoryReset:            ()           => { return BluenetPromise('commandFactoryReset');         },

  meshKeepAlive:                  ()                               => { return BluenetPromise('meshKeepAlive'); },
  meshKeepAliveState:             (timeout, stoneKeepAlivePackets) => { return BluenetPromise('meshKeepAliveState',        timeout, stoneKeepAlivePackets); }, // stoneKeepAlivePackets = [{crownstoneId: number(uint16), action: Boolean, state: number(float) [ 0 .. 1 ]}]
  multiSwitch:                    (arrayOfStoneSwitchPackets)      => { return BluenetPromise('multiSwitch',               arrayOfStoneSwitchPackets); }, // stoneSwitchPacket = {crownstoneId: number(uint16), timeout: number(uint16), state: number(float) [ 0 .. 1 ], intent: number [0,1,2,3,4] }

  getFirmwareVersion:             () => { return BluenetPromise('getFirmwareVersion'); },
  getBootloaderVersion:           () => { return BluenetPromise('getBootloaderVersion'); },
  setupFactoryReset:              () => { return BluenetPromise('setupFactoryReset'); },
  putInDFU:                       () => { return BluenetPromise('putInDFU'); },
  performDFU:                     (handle, uri) => { return BluenetPromise('performDFU', handle, uri); },

  getHardwareVersion:             () => { return BluenetPromise('getHardwareVersion'); },
  setupPutInDFU:                  () => { return BluenetPromise('setupPutInDFU'); },
  toggleSwitchState:              (stateForOn: number) => { return BluenetPromise('toggleSwitchState', stateForOn); }, // stateForOn is a number between 0 and 1. It is the value which is written to setSwitchState. This method returns (in the promise) the value written to the setSwitchState, probably either 0 or stateForOn. TODO: don't return the value that was set.
  bootloaderToNormalMode:         ( handle ) => { return BluenetPromise('bootloaderToNormalMode', handle); },

  //new
  clearErrors:                    (clearErrorJSON) => { return BluenetPromise('clearErrors', clearErrorJSON); },
  getErrors:                      ()     => { return BluenetPromise('getErrors'); }, // returns { overCurrent: boolean, overCurrentDimmer: boolean, temperatureChip: boolean, temperatureDimmer: boolean, bitMask: uint32 }
  restartCrownstone:              ()     => { return BluenetPromise('restartCrownstone'); },
  clearFingerprintsPromise:       ()     => { return BluenetPromise('clearFingerprintsPromise'); },
  setTime:                        (time) => { return BluenetPromise('setTime',time); },
  meshSetTime:                    (time) => { return BluenetPromise('meshSetTime',time); },
  getTime:                        ()     => { return BluenetPromise('getTime'); },

  addSchedule:                    (data: bridgeScheduleEntry)  => { return BluenetPromise('addSchedule', data); }, // must return "NO_SCHEDULE_ENTRIES_AVAILABLE" as error if there are no available schedules
  setSchedule:                    (data: bridgeScheduleEntry)  => { return BluenetPromise('setSchedule', data); },
  clearSchedule:                  (scheduleEntryIndex: number) => { return BluenetPromise('clearSchedule', scheduleEntryIndex); },
  getAvailableScheduleEntryIndex: () => { return BluenetPromise('getAvailableScheduleEntryIndex'); },             // must return "NO_SCHEDULE_ENTRIES_AVAILABLE" as error if there are no available schedules
  getSchedules:                   () => { return BluenetPromise('getSchedules'); },                               // must return array of bridgeScheduleEntry

  getSwitchState:                 () => { return BluenetPromise('getSwitchState'); },
  lockSwitch:                     (lock: boolean)   => { return BluenetPromise('lockSwitch',     lock);  },
  allowDimming:                   (allow : boolean) => { return BluenetPromise('allowDimming',   allow); },
  setSwitchCraft:                 (state : boolean) => { return BluenetPromise('setSwitchCraft', state); },

  sendNoOp:                       () => { return BluenetPromise('sendNoOp'); },
  sendMeshNoOp:                   () => { return BluenetPromise('sendMeshNoOp'); },
  setMeshChannel:                 (channel) => { return BluenetPromise('setMeshChannel', channel); },

  getTrackingState:               () => { return BluenetPromise('getTrackingState'); }, // return type: trackingState
  isDevelopmentEnvironment:       () => { return BluenetPromise('isDevelopmentEnvironment'); }, // return type: boolean
  broadcastSwitch:                (referenceId, stoneId, switchState) => { return BluenetPromise('broadcastSwitch', referenceId, stoneId, switchState); },
};
