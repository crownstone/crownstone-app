import { Alert} from 'react-native';
import { DISABLE_NATIVE } from '../../ExternalConfig'
import { LOGi }      from '../../logging/Log'
import { Bluenet }        from './Bluenet'
import { Sentry }         from "react-native-sentry";
import { core } from "../../core";

export const BluenetPromise : any = function(functionName, param, param2, param3, param4, param5) {
  console.log("X", functionName, param, param2, param3, param4, param5)
  return new Promise((resolve, reject) => {
	  let id = (Math.random() * 1e8).toString(36);
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
          LOGi.bch("BluenetPromise: promise rejected in bridge: ", functionName, " error:", result.data, "for ID:", id);
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
			LOGi.bch("BluenetPromise: promise resolved in bridge: ", functionName, " data:", result.data, "for ID:", id);
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

      LOGi.bch("BluenetPromise: called bluenetPromise", functionName, " with params", bluenetArguments, "for ID:", id);

      // add the promise resolver to this list
      bluenetArguments.push(promiseResolver);
      // @ts-ignore
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
    core.eventBus.emit("connecting", handle, " with priority:", highPriority);

    // connect
    if (handle) {
      return BluenetPromise('connect', handle, referenceId)
        .then(() => {
          core.eventBus.emit("connected", handle);
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
      .then( () => { core.eventBus.emit("disconnect"); })
      .catch(() => { core.eventBus.emit("disconnect"); })
  },
  // this never rejects
  phoneDisconnect: () => {
    return BluenetPromise('phoneDisconnect')
      .then( () => { core.eventBus.emit("disconnect"); })
      .catch(() => { core.eventBus.emit("disconnect"); })
  },

  getMACAddress:                  ()           => { return BluenetPromise('getMACAddress');               },
  setupCrownstone:                (dataObject) => { return BluenetPromise('setupCrownstone', dataObject); },
  setKeySets:                     (dataObject) => { return BluenetPromise('setKeySets',      dataObject); },
  requestLocation:                ()           => { return BluenetPromise('requestLocation');             },
  recover:                        (handle)     => { return BluenetPromise('recover', handle);             }, // Connect, recover, and disconnect. If stone is not in recovery mode, then return string "NOT_IN_RECOVERY_MODE" as error data.
  finalizeFingerprint:            (sphereId, locationId) => { return BluenetPromise('finalizeFingerprint', sphereId, locationId); }, //  will load the fingerprint into the classifier and return the stringified fingerprint.
  commandFactoryReset:            ()           => { return BluenetPromise('commandFactoryReset');         },

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
  restartCrownstone:              ()     => { return BluenetPromise('restartCrownstone'); },
  clearFingerprintsPromise:       ()     => { return BluenetPromise('clearFingerprintsPromise'); },
  setTime:                        (time) => { return BluenetPromise('setTime',time); },
  setSuntimesOnCrownstone:        (sunriseSecondsSinceMidnight: number, sunsetSecondsSinceMidnight: number) => { return BluenetPromise('setSuntimesOnCrownstone',sunriseSecondsSinceMidnight, sunsetSecondsSinceMidnight); },
  setTimeViaBroadcast:            (time: number, sunriseSecondsSinceMidnight: number, sunsetSecondsSinceMidnight: number, referenceId: string) => { return BluenetPromise('setTimeViaBroadcast', time, sunriseSecondsSinceMidnight, sunsetSecondsSinceMidnight, referenceId); },
  meshSetTime:                    (time) => { return BluenetPromise('meshSetTime',time); },
  getTime:                        ()     => { return BluenetPromise('getTime'); },

  setSwitchState:                 (state) => { return BluenetPromise('setSwitchState', state); },
  getSwitchState:                 () => { return BluenetPromise('getSwitchState'); },
  lockSwitch:                     (lock: boolean)   => { return BluenetPromise('lockSwitch',     lock);  },
  allowDimming:                   (allow : boolean) => { return BluenetPromise('allowDimming',   allow); },
  setSwitchCraft:                 (state : boolean) => { return BluenetPromise('setSwitchCraft', state); },

  sendNoOp:                       () => { return BluenetPromise('sendNoOp'); },
  sendMeshNoOp:                   () => { return BluenetPromise('sendMeshNoOp'); },
  setMeshChannel:                 (channel) => { return BluenetPromise('setMeshChannel', channel); },

  getTrackingState:               () => { return BluenetPromise('getTrackingState'); },         // return type: trackingState
  isDevelopmentEnvironment:       () => { return BluenetPromise('isDevelopmentEnvironment'); }, // return type: boolean
  setupPulse:                     () => { return BluenetPromise('setupPulse'); },               // return type: void
  checkBroadcastAuthorization:    () => { return BluenetPromise('checkBroadcastAuthorization'); },   // return type: string

  broadcastSwitch:                (referenceId, stoneId, switchState) => { return BluenetPromise('broadcastSwitch', referenceId, stoneId, switchState); },

  addBehaviour:                   (behaviour: behaviourTransfer) => { return BluenetPromise('addBehaviour',behaviour) },
  updateBehaviour:                (behaviour: behaviourTransfer) => { return BluenetPromise('updateBehaviour',behaviour) },
  removeBehaviour:                (index: number)                => { return BluenetPromise('removeBehaviour',index) },
  getBehaviour:                   (index: number)                => { return BluenetPromise('getBehaviour',index) },

  setTapToToggle:                 (enabled: boolean)             => { return BluenetPromise('setTapToToggle' ,enabled); },
  setTapToToggleThresholdOffset:  (rssiThresholdOffset: number)  => { return BluenetPromise('setTapToToggleThresholdOffset', rssiThresholdOffset); },

  syncBehaviours:                 (behaviours: behaviourTransfer[]) => { return BluenetPromise('syncBehaviours', behaviours); },
  getBehaviourMasterHash:         (behaviours: behaviourTransfer[]) => { return BluenetPromise('getBehaviourMasterHash', behaviours); },

  // dev
  getResetCounter:                () => { return BluenetPromise('getResetCounter'); },          // return type: uint16

  switchRelay:                    (state) => { return BluenetPromise('switchRelay',  state); },  // return type: void
  switchDimmer:                   (state) => { return BluenetPromise('switchDimmer', state); }, // return type: void

  getSwitchcraftThreshold:        ()        => { return BluenetPromise('getSwitchcraftThreshold')},
  setSwitchcraftThreshold:        ( value ) => { return BluenetPromise('setSwitchcraftThreshold', value)},
  getMaxChipTemp:                 ()        => { return BluenetPromise('getMaxChipTemp')},
  setMaxChipTemp:                 ( value ) => { return BluenetPromise('setMaxChipTemp', value) },
  getDimmerCurrentThreshold:      ()        => { return BluenetPromise('getDimmerCurrentThreshold') },
  setDimmerCurrentThreshold:      ( value ) => { return BluenetPromise('setDimmerCurrentThreshold', value) },
  getDimmerTempUpThreshold:       ()        => { return BluenetPromise('getDimmerTempUpThreshold')},
  setDimmerTempUpThreshold:       ( value ) => { return BluenetPromise('setDimmerTempUpThreshold', value)},
  getDimmerTempDownThreshold:     ()        => { return BluenetPromise('getDimmerTempDownThreshold')},
  setDimmerTempDownThreshold:     ( value ) => { return BluenetPromise('setDimmerTempDownThreshold', value)},
  getVoltageZero:                 ()        => { return BluenetPromise('getVoltageZero')},
  setVoltageZero:                 ( value ) => { return BluenetPromise('setVoltageZero', value)},
  getCurrentZero:                 ()        => { return BluenetPromise('getCurrentZero')},
  setCurrentZero:                 ( value ) => { return BluenetPromise('setCurrentZero', value)},
  getPowerZero:                   ()        => { return BluenetPromise('getPowerZero')},
  setPowerZero:                   ( value ) => { return BluenetPromise('setPowerZero', value)},
  getVoltageMultiplier:           ()        => { return BluenetPromise('getVoltageMultiplier')},
  setVoltageMultiplier:           ( value ) => { return BluenetPromise('setVoltageMultiplier', value)},
  getCurrentMultiplier:           ()        => { return BluenetPromise('getCurrentMultiplier')},
  setCurrentMultiplier:           ( value ) => { return BluenetPromise('setCurrentMultiplier', value)},
  setUartState:                   ( value ) => { return BluenetPromise('setUartState', value)},
};







