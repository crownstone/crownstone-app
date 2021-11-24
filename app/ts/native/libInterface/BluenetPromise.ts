import { Alert, AppState } from "react-native";
import { DISABLE_NATIVE } from '../../ExternalConfig'
import { LOGi }      from '../../logging/Log'
import { Bluenet }        from './Bluenet'
import { core } from "../../Core";
import Bugsnag from "@bugsnag/react-native";
import { BugReportUtil } from "../../util/BugReportUtil";

export const BluenetPromise : any = function(functionName) : Promise<void>  {
  // console.log("XX BLUENET PROMISE", functionName, param, param2, param3, param4, param5)
  return new Promise((resolve, reject) => {
	  let id = (Math.random() * 1e8).toString(36);
    if (DISABLE_NATIVE === true) {
      resolve()
    }
    else {
      let bluenetArguments = [];
      // fill the bluenet arguments list with all arguments we will send to bluenet.
      for (let i = 1; i < arguments.length; i++) {
        bluenetArguments.push(arguments[i])
      }
      BugReportUtil.breadcrumb("BLE: Started Command",{
        functionCalled: functionName,
        id: id,
        arg: bluenetArguments.length > 0 ? bluenetArguments[0] : "NO_ARG",
        t: Date.now(),
        state: 'started',
      }, "state");
      let promiseResolver = (result) => {
        if (result.error === true) {
          LOGi.constellation("BluenetPromise: promise rejected in bridge: ", functionName, " error:", result.data, "for ID:", id, "AppState:", AppState.currentState);
          BugReportUtil.breadcrumb("BLE: Failed Command",{
            functionCalled: functionName,
            id: id,
            t: Date.now(),
            state: 'failed',
            err: result.data
          }, "state");
          reject(new Error(result.data));
        }
        else {
			  LOGi.constellation("BluenetPromise: promise resolved in bridge: ", functionName, " data:", result.data, "for ID:", id, "AppState:", AppState.currentState);
          BugReportUtil.breadcrumb("BLE: Finished Command",{
            functionCalled: functionName,
            id: id,
            t: Date.now(),
            state: 'success',
          }, "state");
          resolve(result.data);
        }
      };


      LOGi.constellation("BluenetPromise: called bluenetPromise", functionName, " with params", bluenetArguments, "for ID:", id, "AppState:", AppState.currentState);

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
  connect:             (handle, referenceId) => {
    // tell the app that something is connecting.
    core.eventBus.emit("connecting", handle);

    // connect
    if (!handle) { throw new Error("CANT_CONNECT_NO_HANDLE") };

    return BluenetPromise('connect', handle, referenceId)
      .then(() => {
        core.eventBus.emit("connected", handle);
      })

  },
  cancelConnectionRequest: (handle: string) => { return BluenetPromise('cancelConnectionRequest', handle); },
  // this never rejects
  disconnectCommand: (handle: string) => {
    return BluenetPromise('disconnectCommand', handle)
      .then( () => { core.eventBus.emit("disconnect"); })
      .catch(() => { core.eventBus.emit("disconnect"); })
  },
  // this never rejects
  phoneDisconnect: (handle: string) => {
    return BluenetPromise('phoneDisconnect', handle)
      .then( () => { core.eventBus.emit("disconnect"); })
      .catch(() => { core.eventBus.emit("disconnect"); })
  },

  getMACAddress:                  (handle: string)           => { return BluenetPromise('getMACAddress', handle);               },
  setupCrownstone:                (handle: string, dataObject) => { return BluenetPromise('setupCrownstone', handle, dataObject); },
  setKeySets:                     (dataObject) => { return BluenetPromise('setKeySets', dataObject); },
  requestLocation:                ()           => { return BluenetPromise('requestLocation');             },
  recover:                        (handle: string)     => { return BluenetPromise('recover', handle);             },                                // Connect, recover, and disconnect. If stone is not in recovery mode, then return string "NOT_IN_RECOVERY_MODE" as error data.
  finalizeFingerprint:            (sphereId, locationId) => { return BluenetPromise('finalizeFingerprint', sphereId, locationId); }, //  will load the fingerprint into the classifier and return the stringified fingerprint.
  commandFactoryReset:            (handle: string)           => { return BluenetPromise('commandFactoryReset', handle);         },

  multiSwitch:                    (handle: string, arrayOfStoneSwitchPackets)      => { return BluenetPromise('multiSwitch', handle, arrayOfStoneSwitchPackets); }, // stoneSwitchPacket = {crownstoneId: number(uint16), timeout: number(uint16), state: number(float) [ 0 .. 1 ], intent: number [0,1,2,3,4] }

  getFirmwareVersion:             (handle: string) => { return BluenetPromise('getFirmwareVersion', handle); },
  getBootloaderVersion:           (handle: string) => { return BluenetPromise('getBootloaderVersion', handle); },
  putInDFU:                       (handle: string) => { return BluenetPromise('putInDFU', handle); },
  performDFU:                     (handle, uri) => { return BluenetPromise('performDFU', handle, uri); },

  getHardwareVersion:             (handle: string) => { return BluenetPromise('getHardwareVersion', handle); },
  getUICR:                        (handle: string) => { return BluenetPromise('getUICR', handle); },
  setupPutInDFU:                  (handle: string) => { return BluenetPromise('setupPutInDFU', handle); },
  toggleSwitchState:              (handle: string, stateForOn: number) => { return BluenetPromise('toggleSwitchState', handle, stateForOn); }, // stateForOn is a number between 0 and 100. It is the value which is written to setSwitchState. This method returns (in the promise) the value written to the setSwitchState, probably either 0 or stateForOn. TODO: don't return the value that was set.
  bootloaderToNormalMode:         (handle: string, ) => { return BluenetPromise('bootloaderToNormalMode', handle); },

  //new
  clearErrors:                    (handle: string, clearErrorJSON) => { return BluenetPromise('clearErrors', handle, clearErrorJSON); },
  restartCrownstone:              (handle: string)     => { return BluenetPromise('restartCrownstone', handle); },
  clearFingerprintsPromise:       ()     => { return BluenetPromise('clearFingerprintsPromise'); },
  setTime:                        (handle: string, time) => { return BluenetPromise('setTime', handle, time); },
  setTimeViaBroadcast:            (time: number, sunriseSecondsSinceMidnight: number, sunsetSecondsSinceMidnight: number, referenceId: string, enableTimeBasedNonce: boolean) => { return BluenetPromise('setTimeViaBroadcast', time, sunriseSecondsSinceMidnight, sunsetSecondsSinceMidnight, referenceId, enableTimeBasedNonce); },
  meshSetTime:                    (handle: string, time) => { return BluenetPromise('meshSetTime', handle, time); },
  getTime:                        (handle: string)     => { return BluenetPromise('getTime', handle); },

  setSwitchState:                 (handle: string, state) => { return BluenetPromise('setSwitchState', handle, state); },
  getSwitchState:                 (handle: string) => { return BluenetPromise('getSwitchState', handle); },
  lockSwitch:                     (handle: string, lock: boolean)   => { return BluenetPromise('lockSwitch', handle,     lock);  },
  allowDimming:                   (handle: string, allow : boolean) => { return BluenetPromise('allowDimming', handle,   allow); },
  setSwitchCraft:                 (handle: string, state : boolean) => { return BluenetPromise('setSwitchCraft', handle, state); },

  sendNoOp:                       (handle: string) => { return BluenetPromise('sendNoOp', handle); },
  sendMeshNoOp:                   (handle: string) => { return BluenetPromise('sendMeshNoOp', handle); },

  getTrackingState:               () => { return BluenetPromise('getTrackingState'); },         // return type: trackingState
  isDevelopmentEnvironment:       () => { return BluenetPromise('isDevelopmentEnvironment'); }, // return type: boolean
  setupPulse:                     (handle: string) => { return BluenetPromise('setupPulse', handle); },               // return type: void
  checkBroadcastAuthorization:    () => { return BluenetPromise('checkBroadcastAuthorization'); },   // return type: string

  broadcastSwitch:                (referenceId, stoneId, switchState, autoExecute) => { return BluenetPromise('broadcastSwitch', referenceId, stoneId, switchState, autoExecute); },

  addBehaviour:                   (handle: string, behaviour: behaviourTransfer) => { return BluenetPromise('addBehaviour', handle, behaviour) },
  updateBehaviour:                (handle: string, behaviour: behaviourTransfer) => { return BluenetPromise('updateBehaviour', handle, behaviour) },
  removeBehaviour:                (handle: string, index: number)                => { return BluenetPromise('removeBehaviour', handle, index) },
  getBehaviour:                   (handle: string, index: number)                => { return BluenetPromise('getBehaviour', handle, index) },

  setTapToToggle:                 (handle: string, enabled: boolean)             => { return BluenetPromise('setTapToToggle', handle, enabled); },
  setTapToToggleThresholdOffset:  (handle: string, rssiThresholdOffset: number)  => { return BluenetPromise('setTapToToggleThresholdOffset', handle, rssiThresholdOffset); },
  getTapToToggleThresholdOffset:  (handle: string)                             => { return BluenetPromise('getTapToToggleThresholdOffset', handle); },
  setSoftOnSpeed:                 (handle: string, speed: number)                => { return BluenetPromise('setSoftOnSpeed', handle, speed); },
  getSoftOnSpeed:                 (handle: string)                             => { return BluenetPromise('getSoftOnSpeed', handle); },

  syncBehaviours:                 (handle: string, behaviours: behaviourTransfer[]) => { return BluenetPromise('syncBehaviours', handle, behaviours); },
  getBehaviourMasterHash:         (behaviours: behaviourTransfer[]) => { return BluenetPromise('getBehaviourMasterHash', behaviours); },
  getBehaviourMasterHashCRC:      (behaviours: behaviourTransfer[]) => { return BluenetPromise('getBehaviourMasterHashCRC', behaviours); },

  // dev
  getResetCounter:                (handle: string) => { return BluenetPromise('getResetCounter', handle); },          // return type: uint16

  switchRelay:                    (handle: string, state) => { return BluenetPromise('switchRelay', handle,  state); },  // return type: void
  switchDimmer:                   (handle: string, state) => { return BluenetPromise('switchDimmer', handle, state); }, // return type: void

  getSwitchcraftThreshold:        (handle: string)        => { return BluenetPromise('getSwitchcraftThreshold', handle)},
  setSwitchcraftThreshold:        (handle: string, value) => { return BluenetPromise('setSwitchcraftThreshold', handle, value)},
  getMaxChipTemp:                 (handle: string)        => { return BluenetPromise('getMaxChipTemp', handle)},
  setMaxChipTemp:                 (handle: string, value) => { return BluenetPromise('setMaxChipTemp', handle, value) },
  getDimmerCurrentThreshold:      (handle: string)        => { return BluenetPromise('getDimmerCurrentThreshold', handle) },
  setDimmerCurrentThreshold:      (handle: string, value) => { return BluenetPromise('setDimmerCurrentThreshold', handle, value) },
  getDimmerTempUpThreshold:       (handle: string)        => { return BluenetPromise('getDimmerTempUpThreshold', handle)},
  setDimmerTempUpThreshold:       (handle: string, value) => { return BluenetPromise('setDimmerTempUpThreshold', handle, value)},
  getDimmerTempDownThreshold:     (handle: string)        => { return BluenetPromise('getDimmerTempDownThreshold', handle)},
  setDimmerTempDownThreshold:     (handle: string, value) => { return BluenetPromise('setDimmerTempDownThreshold', handle, value)},
  getVoltageZero:                 (handle: string)        => { return BluenetPromise('getVoltageZero', handle)},
  setVoltageZero:                 (handle: string, value) => { return BluenetPromise('setVoltageZero', handle, value)},
  getCurrentZero:                 (handle: string)        => { return BluenetPromise('getCurrentZero', handle)},
  setCurrentZero:                 (handle: string, value) => { return BluenetPromise('setCurrentZero', handle, value)},
  getPowerZero:                   (handle: string)        => { return BluenetPromise('getPowerZero', handle)},
  setPowerZero:                   (handle: string, value) => { return BluenetPromise('setPowerZero', handle, value)},
  getVoltageMultiplier:           (handle: string)        => { return BluenetPromise('getVoltageMultiplier', handle)},
  setVoltageMultiplier:           (handle: string, value) => { return BluenetPromise('setVoltageMultiplier', handle, value)},
  getCurrentMultiplier:           (handle: string)        => { return BluenetPromise('getCurrentMultiplier', handle)},
  setCurrentMultiplier:           (handle: string, value) => { return BluenetPromise('setCurrentMultiplier', handle, value)},
  setUartState:                   (handle: string, value) => { return BluenetPromise('setUartState', handle, value)},

  getBehaviourDebugInformation:     (handle: string) => { return BluenetPromise('getBehaviourDebugInformation', handle); },
  canUseDynamicBackgroundBroadcasts:() => { return BluenetPromise('canUseDynamicBackgroundBroadcasts'); },

  turnOnMesh:                     (handle: string, stoneIdList: number[]) => { return BluenetPromise('turnOnMesh', handle, stoneIdList)},
  turnOnBroadcast:                (referenceId, stoneId, autoExecute)             => { return BluenetPromise('turnOnBroadcast', referenceId, stoneId, autoExecute)},
  setSunTimesViaConnection:       (handle: string, sunriseSecondsSinceMidnight, sunsetSecondsSinceMidnight) => { return BluenetPromise('setSunTimesViaConnection', handle, sunriseSecondsSinceMidnight, sunsetSecondsSinceMidnight)},
  broadcastBehaviourSettings:     (referenceId, enabled) => { return BluenetPromise('broadcastBehaviourSettings', referenceId, enabled)},

  registerTrackedDevice:          (handle: string,
                                   trackingNumber: number,
                                   locationUID: number,
                                   profileId: number,
                                   rssiOffset: number,
                                   ignoreForPresence: boolean,
                                   tapToToggleEnabled: boolean,
                                   deviceToken: number,
                                   ttlMinutes: number) => { return BluenetPromise('registerTrackedDevice', handle, trackingNumber, locationUID, profileId, rssiOffset, ignoreForPresence, tapToToggleEnabled, deviceToken, ttlMinutes); },
  trackedDeviceHeartbeat:         (handle: string,
                                   trackingNumber: number,
                                   locationUID: number,
                                   deviceToken: number,
                                   ttlMinutes: number) => { return BluenetPromise('trackedDeviceHeartbeat', handle, trackingNumber, locationUID, deviceToken, ttlMinutes); },

  broadcastUpdateTrackedDevice:   (referenceId: string,
                                   trackingNumber:number,
                                   locationUID:number,
                                   profileId:number,
                                   rssiOffset:number,
                                   ignoreForPresence:boolean,
                                   tapToToggleEnabled:boolean,
                                   deviceToken:number,
                                   ttlMinutes:number) => { return BluenetPromise('broadcastUpdateTrackedDevice', referenceId, trackingNumber, locationUID, profileId, rssiOffset, ignoreForPresence, tapToToggleEnabled, deviceToken, ttlMinutes); },


  getCrownstoneUptime:         (handle: string) => { return BluenetPromise('getCrownstoneUptime', handle); },

  getMinSchedulerFreeSpace:    (handle: string) => { return BluenetPromise('getMinSchedulerFreeSpace', handle); },
  getLastResetReason:          (handle: string) => { return BluenetPromise('getLastResetReason', handle); },
  getGPREGRET:                 (handle: string) => { return BluenetPromise('getGPREGRET', handle); },
  getAdcChannelSwaps:          (handle: string) => { return BluenetPromise('getAdcChannelSwaps', handle); },

  getAdcRestarts:              (handle: string) => { return BluenetPromise('getAdcRestarts', handle); },
  getSwitchHistory:            (handle: string) => { return BluenetPromise('getSwitchHistory', handle); },
  getPowerSamples:             (handle: string, type: PowersampleDataType) => { return BluenetPromise('getPowerSamples', handle, type); },

  setUartKey:                  (handle: string, uartKey: string)                   => { return BluenetPromise('setUartKey', handle, uartKey); },
  transferHubTokenAndCloudId:  (handle: string, hubToken: string, cloudId: string) => { return BluenetPromise('transferHubTokenAndCloudId', handle, hubToken, cloudId); },
  requestCloudId:              (handle: string) => { return BluenetPromise('requestCloudId', handle); },
  factoryResetHub:             (handle: string) => { return BluenetPromise('factoryResetHub', handle); },
  factoryResetHubOnly:         (handle: string) => { return BluenetPromise('factoryResetHubOnly', handle); },
};










