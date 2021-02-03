import { Alert, AppState } from "react-native";
import { DISABLE_NATIVE } from '../../ExternalConfig'
import { LOGi }      from '../../logging/Log'
import { Bluenet }        from './Bluenet'
import * as Sentry from "@sentry/react-native";
import { core } from "../../core";

export const BluenetPromise : any = function(functionName) : Promise<void>  {
  // console.log("XX BLUENET PROMISE", functionName, param, param2, param3, param4, param5)
  return new Promise((resolve, reject) => {
	  let id = (Math.random() * 1e8).toString(36);
    if (DISABLE_NATIVE === true) {
      resolve()
    }
    else {
      Sentry.addBreadcrumb({
        category: 'ble',
        data: {
          functionCalled: functionName,
          t: Date.now(),
          state: 'started',
        }
      });
      let bluenetArguments = [];
      let promiseResolver = (result) => {
        if (result.error === true) {
          LOGi.bch("BluenetPromise: promise rejected in bridge: ", functionName, " error:", result.data, "for ID:", id, "AppState:", AppState.currentState);
          Sentry.addBreadcrumb({
            category: 'ble',
            data: {
              functionCalled: functionName,
              t: Date.now(),
              state: 'failed',
              err: result.data
            }
          });
          reject(result.data);
        }
        else {
			LOGi.bch("BluenetPromise: promise resolved in bridge: ", functionName, " data:", result.data, "for ID:", id, "AppState:", AppState.currentState);
          Sentry.addBreadcrumb({
            category: 'ble',
            data: {
              functionCalled: functionName,
              t: Date.now(),
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

      LOGi.bch("BluenetPromise: called bluenetPromise", functionName, " with params", bluenetArguments, "for ID:", id, "AppState:", AppState.currentState);

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
  cancelConnectionRequest: (handle: string) => { return BluenetPromise('cancelConnectionRequest', handle); },
  // this never rejects
  disconnectCommand: (handle: string) => {
    return BluenetPromise('disconnectCommand')
      .then( () => { core.eventBus.emit("disconnect"); })
      .catch(() => { core.eventBus.emit("disconnect"); })
  },
  // this never rejects
  phoneDisconnect: (handle: string) => {
    return BluenetPromise('phoneDisconnect')
      .then( () => { core.eventBus.emit("disconnect"); })
      .catch(() => { core.eventBus.emit("disconnect"); })
  },

  getMACAddress:                  (handle: string)           => { return BluenetPromise('getMACAddress');               },
  setupCrownstone:                (handle: string, dataObject) => { return BluenetPromise('setupCrownstone', dataObject); },
  setKeySets:                     (dataObject) => { return BluenetPromise('setKeySets',      dataObject); },
  requestLocation:                ()           => { return BluenetPromise('requestLocation');             },
  recover:                        (handle: string)     => { return BluenetPromise('recover', handle);             },                                // Connect, recover, and disconnect. If stone is not in recovery mode, then return string "NOT_IN_RECOVERY_MODE" as error data.
  finalizeFingerprint:            (sphereId, locationId) => { return BluenetPromise('finalizeFingerprint', sphereId, locationId); }, //  will load the fingerprint into the classifier and return the stringified fingerprint.
  commandFactoryReset:            (handle: string)           => { return BluenetPromise('commandFactoryReset');         },

  multiSwitch:                    (handle: string, arrayOfStoneSwitchPackets)      => { return BluenetPromise('multiSwitch',               arrayOfStoneSwitchPackets); }, // stoneSwitchPacket = {crownstoneId: number(uint16), timeout: number(uint16), state: number(float) [ 0 .. 1 ], intent: number [0,1,2,3,4] }

  getFirmwareVersion:             (handle: string) => { return BluenetPromise('getFirmwareVersion'); },
  getBootloaderVersion:           (handle: string) => { return BluenetPromise('getBootloaderVersion'); },
  setupFactoryReset:              (handle: string) => { return BluenetPromise('setupFactoryReset'); },
  putInDFU:                       (handle: string) => { return BluenetPromise('putInDFU'); },
  performDFU:                     (handle, uri) => { return BluenetPromise('performDFU', handle, uri); },

  getHardwareVersion:             (handle: string) => { return BluenetPromise('getHardwareVersion'); },
  setupPutInDFU:                  (handle: string) => { return BluenetPromise('setupPutInDFU'); },
  toggleSwitchState:              (handle: string, stateForOn: number) => { return BluenetPromise('toggleSwitchState', stateForOn); }, // stateForOn is a number between 0 and 100. It is the value which is written to setSwitchState. This method returns (in the promise) the value written to the setSwitchState, probably either 0 or stateForOn. TODO: don't return the value that was set.
  bootloaderToNormalMode:         (handle: string, ) => { return BluenetPromise('bootloaderToNormalMode', handle); },

  //new
  clearErrors:                    (handle: string, clearErrorJSON) => { return BluenetPromise('clearErrors', clearErrorJSON); },
  restartCrownstone:              (handle: string)     => { return BluenetPromise('restartCrownstone'); },
  clearFingerprintsPromise:       ()     => { return BluenetPromise('clearFingerprintsPromise'); },
  setTime:                        (handle: string, time) => { return BluenetPromise('setTime',time); },
  setTimeViaBroadcast:            (time: number, sunriseSecondsSinceMidnight: number, sunsetSecondsSinceMidnight: number, referenceId: string) => { return BluenetPromise('setTimeViaBroadcast', time, sunriseSecondsSinceMidnight, sunsetSecondsSinceMidnight, referenceId); },
  meshSetTime:                    (handle: string, time) => { return BluenetPromise('meshSetTime',time); },
  getTime:                        (handle: string)     => { return BluenetPromise('getTime'); },

  setSwitchState:                 (handle: string, state) => { return BluenetPromise('setSwitchState', state); },
  getSwitchState:                 (handle: string) => { return BluenetPromise('getSwitchState'); },
  lockSwitch:                     (handle: string, lock: boolean)   => { return BluenetPromise('lockSwitch',     lock);  },
  allowDimming:                   (handle: string, allow : boolean) => { return BluenetPromise('allowDimming',   allow); },
  setSwitchCraft:                 (handle: string, state : boolean) => { return BluenetPromise('setSwitchCraft', state); },

  sendNoOp:                       (handle: string) => { return BluenetPromise('sendNoOp'); },
  sendMeshNoOp:                   (handle: string) => { return BluenetPromise('sendMeshNoOp'); },
  setMeshChannel:                 (handle: string, channel) => { return BluenetPromise('setMeshChannel', channel); },

  getTrackingState:               () => { return BluenetPromise('getTrackingState'); },         // return type: trackingState
  isDevelopmentEnvironment:       () => { return BluenetPromise('isDevelopmentEnvironment'); }, // return type: boolean
  setupPulse:                     (handle: string) => { return BluenetPromise('setupPulse'); },               // return type: void
  checkBroadcastAuthorization:    () => { return BluenetPromise('checkBroadcastAuthorization'); },   // return type: string

  broadcastSwitch:                (referenceId, stoneId, switchState, autoExecute) => { return BluenetPromise('broadcastSwitch', referenceId, stoneId, switchState, autoExecute); },

  addBehaviour:                   (handle: string, behaviour: behaviourTransfer) => { return BluenetPromise('addBehaviour',behaviour) },
  updateBehaviour:                (handle: string, behaviour: behaviourTransfer) => { return BluenetPromise('updateBehaviour',behaviour) },
  removeBehaviour:                (handle: string, index: number)                => { return BluenetPromise('removeBehaviour',index) },
  getBehaviour:                   (handle: string, index: number)                => { return BluenetPromise('getBehaviour',index) },

  setTapToToggle:                 (handle: string, enabled: boolean)             => { return BluenetPromise('setTapToToggle' ,enabled); },
  setTapToToggleThresholdOffset:  (handle: string, rssiThresholdOffset: number)  => { return BluenetPromise('setTapToToggleThresholdOffset', rssiThresholdOffset); },
  getTapToToggleThresholdOffset:  (handle: string)                             => { return BluenetPromise('getTapToToggleThresholdOffset'); },
  setSoftOnSpeed:                 (handle: string, speed: number)                => { return BluenetPromise('setSoftOnSpeed', speed); },
  getSoftOnSpeed:                 (handle: string)                             => { return BluenetPromise('getSoftOnSpeed'); },

  syncBehaviours:                 (handle: string, behaviours: behaviourTransfer[]) => { return BluenetPromise('syncBehaviours', behaviours); },
  getBehaviourMasterHash:         (behaviours: behaviourTransfer[]) => { return BluenetPromise('getBehaviourMasterHash', behaviours); },

  // dev
  getResetCounter:                (handle: string) => { return BluenetPromise('getResetCounter'); },          // return type: uint16

  switchRelay:                    (handle: string, state) => { return BluenetPromise('switchRelay',  state); },  // return type: void
  switchDimmer:                   (handle: string, state) => { return BluenetPromise('switchDimmer', state); }, // return type: void

  getSwitchcraftThreshold:        (handle: string)        => { return BluenetPromise('getSwitchcraftThreshold')},
  setSwitchcraftThreshold:        (handle: string, value) => { return BluenetPromise('setSwitchcraftThreshold', value)},
  getMaxChipTemp:                 (handle: string)        => { return BluenetPromise('getMaxChipTemp')},
  setMaxChipTemp:                 (handle: string, value) => { return BluenetPromise('setMaxChipTemp', value) },
  getDimmerCurrentThreshold:      (handle: string)        => { return BluenetPromise('getDimmerCurrentThreshold') },
  setDimmerCurrentThreshold:      (handle: string, value) => { return BluenetPromise('setDimmerCurrentThreshold', value) },
  getDimmerTempUpThreshold:       (handle: string)        => { return BluenetPromise('getDimmerTempUpThreshold')},
  setDimmerTempUpThreshold:       (handle: string, value) => { return BluenetPromise('setDimmerTempUpThreshold', value)},
  getDimmerTempDownThreshold:     (handle: string)        => { return BluenetPromise('getDimmerTempDownThreshold')},
  setDimmerTempDownThreshold:     (handle: string, value) => { return BluenetPromise('setDimmerTempDownThreshold', value)},
  getVoltageZero:                 (handle: string)        => { return BluenetPromise('getVoltageZero')},
  setVoltageZero:                 (handle: string, value) => { return BluenetPromise('setVoltageZero', value)},
  getCurrentZero:                 (handle: string)        => { return BluenetPromise('getCurrentZero')},
  setCurrentZero:                 (handle: string, value) => { return BluenetPromise('setCurrentZero', value)},
  getPowerZero:                   (handle: string)        => { return BluenetPromise('getPowerZero')},
  setPowerZero:                   (handle: string, value) => { return BluenetPromise('setPowerZero', value)},
  getVoltageMultiplier:           (handle: string)        => { return BluenetPromise('getVoltageMultiplier')},
  setVoltageMultiplier:           (handle: string, value) => { return BluenetPromise('setVoltageMultiplier', value)},
  getCurrentMultiplier:           (handle: string)        => { return BluenetPromise('getCurrentMultiplier')},
  setCurrentMultiplier:           (handle: string, value) => { return BluenetPromise('setCurrentMultiplier', value)},
  setUartState:                   (handle: string, value) => { return BluenetPromise('setUartState', value)},

  getBehaviourDebugInformation:     (handle: string) => { return BluenetPromise('getBehaviourDebugInformation'); },
  canUseDynamicBackgroundBroadcasts:() => { return BluenetPromise('canUseDynamicBackgroundBroadcasts'); },

  turnOnMesh:                     (handle: string, arrayOfStoneSwitchPackets: any[]) => { return BluenetPromise('turnOnMesh', arrayOfStoneSwitchPackets)},
  turnOnBroadcast:                (referenceId, stoneId, autoExecute)             => { return BluenetPromise('turnOnBroadcast', referenceId, stoneId, autoExecute)},
  setSunTimesViaConnection:       (handle: string, sunriseSecondsSinceMidnight, sunsetSecondsSinceMidnight) => { return BluenetPromise('setSunTimesViaConnection', sunriseSecondsSinceMidnight, sunsetSecondsSinceMidnight)},
  broadcastBehaviourSettings:     (referenceId, enabled) => { return BluenetPromise('broadcastBehaviourSettings', referenceId, enabled)},

  registerTrackedDevice:          (handle: string,
                                   trackingNumber: number,
                                   locationUID: number,
                                   profileId: number,
                                   rssiOffset: number,
                                   ignoreForPresence: boolean,
                                   tapToToggleEnabled: boolean,
                                   deviceToken: number,
                                   ttlMinutes: number) => { return BluenetPromise('registerTrackedDevice', trackingNumber, locationUID, profileId, rssiOffset, ignoreForPresence, tapToToggleEnabled, deviceToken, ttlMinutes); },
  trackedDeviceHeartbeat:         (handle: string,
                                   trackingNumber: number,
                                   locationUID: number,
                                   deviceToken: number,
                                   ttlMinutes: number) => { return BluenetPromise('trackedDeviceHeartbeat', trackingNumber, locationUID, deviceToken, ttlMinutes); },

  broadcastUpdateTrackedDevice:   (referenceId: string,
                                   trackingNumber:number,
                                   locationUID:number,
                                   profileId:number,
                                   rssiOffset:number,
                                   ignoreForPresence:boolean,
                                   tapToToggleEnabled:boolean,
                                   deviceToken:number,
                                   ttlMinutes:number) => { return BluenetPromise('broadcastUpdateTrackedDevice', referenceId, trackingNumber, locationUID, profileId, rssiOffset, ignoreForPresence, tapToToggleEnabled, deviceToken, ttlMinutes); },


  getCrownstoneUptime:         (handle: string) => { return BluenetPromise('getCrownstoneUptime'); },

  getMinSchedulerFreeSpace:    (handle: string) => { return BluenetPromise('getMinSchedulerFreeSpace'); },
  getLastResetReason:          (handle: string) => { return BluenetPromise('getLastResetReason'); },
  getGPREGRET:                 (handle: string) => { return BluenetPromise('getGPREGRET'); },
  getAdcChannelSwaps:          (handle: string) => { return BluenetPromise('getAdcChannelSwaps'); },

  getAdcRestarts:              (handle: string) => { return BluenetPromise('getAdcRestarts'); },
  getSwitchHistory:            (handle: string) => { return BluenetPromise('getSwitchHistory'); },
  getPowerSamples:             (handle: string, type: PowersampleDataType) => { return BluenetPromise('getPowerSamples', type); },

  setUartKey:                  (handle: string, uartKey: string)                   => { return BluenetPromise('setUartKey', uartKey); },
  transferHubTokenAndCloudId:  (hubToken: string, cloudId: string) => { return BluenetPromise('transferHubTokenAndCloudId', hubToken, cloudId); },
  requestCloudId:              () => { return BluenetPromise('requestCloudId'); },
  factoryResetHub:             () => { return BluenetPromise('factoryResetHub'); },
  factoryResetHubOnly:         () => { return BluenetPromise('factoryResetHubOnly'); },
};










