import { NativeModules } from 'react-native';
import { DISABLE_NATIVE } from '../../ExternalConfig'

export let Bluenet;

const BluenetAPI = {
  clearTrackedBeacons:      () => { console.log("BluenetBridgeCall: clearTrackedBeacons: "); },        // called through BluenetPromiseWrapper --> must be promise.
  rerouteEvents:            () => { console.log("BluenetBridgeCall: rerouteEvents:       "); },
  isReady:                  () => { console.log("BluenetBridgeCall: isReady:             "); },                    // called through BluenetPromiseWrapper --> must be promise.
  connect:                  () => { console.log("BluenetBridgeCall: connect:             "); },                    // called through BluenetPromiseWrapper --> must be promise.
  disconnectCommand:        () => { console.log("BluenetBridgeCall: disconnectCommand:   "); },          // called through BluenetPromiseWrapper --> must be promise.
  phoneDisconnect:          () => { console.log("BluenetBridgeCall: phoneDisconnect:     "); },            // called through BluenetPromiseWrapper --> must be promise.
  resetBle:                 () => { console.log("BluenetBridgeCall: resetBle:            "); },
  startScanning:            () => { console.log("BluenetBridgeCall: startScanning:       "); },
  startScanningForCrownstones:           () => { console.log("BluenetBridgeCall: startScanningForCrownstones:           "); },
  startScanningForCrownstonesUniqueOnly: () => { console.log("BluenetBridgeCall: startScanningForCrownstonesUniqueOnly: "); },
  stopScanning:             () => { console.log("BluenetBridgeCall: stopScanning:    "); },
  keepAliveState:           () => { console.log("BluenetBridgeCall: keepAliveState:  "); },
  keepAlive:                () => { console.log("BluenetBridgeCall: keepAlive:       "); },
  requestBleState:          () => { console.log("BluenetBridgeCall: requestBleState: "); },// Send events "bleStatus" and "locationStatus" with the current state.

  startIndoorLocalization:  () => { console.log("BluenetBridgeCall: startIndoorLocalization: "); },
  stopIndoorLocalization:   () => { console.log("BluenetBridgeCall: stopIndoorLocalization:  "); },

  requestLocation:          () => { console.log("BluenetBridgeCall: requestLocation:          "); },// Should return data {"latitude": number, "longitude": number}. Called through BluenetPromiseWrapper --> must be promise.
  requestLocationPermission:() => { console.log("BluenetBridgeCall: requestLocationPermission:"); },// Request for location permission during tutorial.
  trackIBeacon:             () => { console.log("BluenetBridgeCall: trackIBeacon:             "); },// Add the UUID to the list of tracked iBeacons, associate it with given sphereId, and start tracking.
  stopTrackingIBeacon:      () => { console.log("BluenetBridgeCall: stopTrackingIBeacon:      "); },// Remove the UUID from the list of tracked iBeacons.
  pauseTracking:            () => { console.log("BluenetBridgeCall: pauseTracking:            "); },// Stop tracking, but keep the list of tracked iBeacon UUIDs. Stop sending any tracking events: iBeacon, enter/exit region. Assume all tracked iBeacon UUIDs are out the region.
  resumeTracking:           () => { console.log("BluenetBridgeCall: resumeTracking:           "); },// Start tracking again, with the list that is already there.

  startCollectingFingerprint:  () => { console.log("BluenetBridgeCall: startCollectingFingerprint:  "); },
  abortCollectingFingerprint:  () => { console.log("BluenetBridgeCall: abortCollectingFingerprint:  "); },
  pauseCollectingFingerprint:  () => { console.log("BluenetBridgeCall: pauseCollectingFingerprint:  "); },
  resumeCollectingFingerprint: () => { console.log("BluenetBridgeCall: resumeCollectingFingerprint: "); },
  finalizeFingerprint:         () => { console.log("BluenetBridgeCall: finalizeFingerprint:         "); },       // called through BluenetPromiseWrapper --> must be promise. Promise return value is a stringified fingerprint

  loadFingerprint:          () => { console.log("BluenetBridgeCall: loadFingerprint:       "); },
  getMACAddress:            () => { console.log("BluenetBridgeCall: getMACAddress:         "); },             // called through BluenetPromiseWrapper --> must be promise.
  commandFactoryReset:      () => { console.log("BluenetBridgeCall: commandFactoryReset:   "); },       // called through BluenetPromiseWrapper --> must be promise.
  recover:                  () => { console.log("BluenetBridgeCall: recover:               "); },                   // called through BluenetPromiseWrapper --> must be promise.
  setupCrownstone:          () => { console.log("BluenetBridgeCall: setupCrownstone:       "); },           // called through SetupCrownstone in BLEUtil
  quitApp:                  () => { console.log("BluenetBridgeCall: quitApp:               "); NativeModules.BluenetJS.quitApp() },                   // Used to quit the app during logout
  enableLoggingToFile:      () => { console.log("BluenetBridgeCall: enableLoggingToFile:   "); },
  enableExtendedLogging:    () => { console.log("BluenetBridgeCall: enableExtendedLogging: "); },
  clearLogs:                () => { console.log("BluenetBridgeCall: clearLogs:             "); },

  // mesh
  meshKeepAlive:            () => { console.log("BluenetBridgeCall: meshKeepAlive:           "); },
  meshKeepAliveState:       () => { console.log("BluenetBridgeCall: meshKeepAliveState:      "); },
  multiSwitch:              () => { console.log("BluenetBridgeCall: multiSwitch:             "); },
  getHardwareVersion:       () => { console.log("BluenetBridgeCall: getHardwareVersion:      "); },
  getBootloaderVersion:     () => { console.log("BluenetBridgeCall: getBootloaderVersion:    "); },
  getFirmwareVersion:       () => { console.log("BluenetBridgeCall: getFirmwareVersion:      "); },
  bootloaderToNormalMode:   () => { console.log("BluenetBridgeCall: bootloaderToNormalMode:  "); },
  getErrors:                () => { console.log("BluenetBridgeCall: getErrors:               "); },
  clearFingerprintsPromise: () => { console.log("BluenetBridgeCall: clearFingerprintsPromise:"); },
  clearFingerprints:        () => { console.log("BluenetBridgeCall: clearFingerprints:       "); },
  setTime:                  () => { console.log("BluenetBridgeCall: setTime:                 "); },
  meshSetTime:              () => { console.log("BluenetBridgeCall: meshSetTime:             "); },
  batterySaving:            () => { console.log("BluenetBridgeCall: batterySaving:           "); },
  setBackgroundScanning:    () => { console.log("BluenetBridgeCall: setBackgroundScanning:   "); },
  setSchedule:              () => { console.log("BluenetBridgeCall: setSchedule:             "); },
  clearSchedule:            () => { console.log("BluenetBridgeCall: clearSchedule:           "); },
  addSchedule:              () => { console.log("BluenetBridgeCall: addSchedule:             "); },
  getSchedules:             () => { console.log("BluenetBridgeCall: getSchedules:            "); },
  getAvailableScheduleEntryIndex: () => { console.log("BluenetBridgeCall: getAvailableScheduleEntryIndex:"); },

  viewsInitialized:         () => { console.log("BluenetBridgeCall: viewsInitialized:  "); },
  lockSwitch:               () => { console.log("BluenetBridgeCall: lockSwitch:        "); },
  allowDimming:             () => { console.log("BluenetBridgeCall: allowDimming:      "); },
  setSwitchCraft:           () => { console.log("BluenetBridgeCall: setSwitchCraft:    "); },
  sendNoOp:                 () => { console.log("BluenetBridgeCall: sendNoOp:          "); },
  sendMeshNoOp:             () => { console.log("BluenetBridgeCall: sendMeshNoOp:      "); },


  getSwitchState:           () => { console.log("BluenetBridgeCall:  getSwitchState:   "); },
  getTime:                  () => { console.log("BluenetBridgeCall:  getTime:          "); },
  putInDFU:                 () => { console.log("BluenetBridgeCall:  putInDFU:         "); },
  performDFU:               () => { console.log("BluenetBridgeCall:  performDFU:       "); },
  restartCrownstone:        () => { console.log("BluenetBridgeCall:  restartCrownstone:"); },
  clearKeySets:             () => { console.log("BluenetBridgeCall:  clearKeysets:     "); },
  setKeySets:               () => { console.log("BluenetBridgeCall:  setKeySets:       "); },
  setupFactoryReset:        () => { console.log("BluenetBridgeCall:  setupFactoryReset:"); },
  setupPutInDFU:            () => { console.log("BluenetBridgeCall:  setupPutInDFU:    "); },
  toggleSwitchState:        () => { console.log("BluenetBridgeCall:  toggleSwitchState:"); },
  setMeshChannel:           () => { console.log("BluenetBridgeCall:  setMeshChannel:   "); },
  getTrackingState:         () => { console.log("BluenetBridgeCall:  getTrackingState: "); },
  setDevicePreferences:     () => { console.log("BluenetBridgeCall:  setDevicePreferences: "); },
  setLocationState:         () => { console.log("BluenetBridgeCall:  setLocationState: "); },
  startAdvertising:         () => { console.log("BluenetBridgeCall:  startAdvertising: "); },
  stopAdvertising:          () => { console.log("BluenetBridgeCall:  stopAdvertising: "); },
}

if (DISABLE_NATIVE === true) {
  // LOG.info("!----------- --- --- --- -- -- -- - - - -- -- -- --- --- --- -----------!");
  // LOG.info("!-----------  NATIVE CALLS ARE DISABLED BY EXTERNALCONFIG.JS -----------!");
  // LOG.info("!----------- --- --- --- -- -- -- - - - -- -- -- --- --- --- -----------!");
  Bluenet = BluenetAPI;
}
else if (NativeModules.BluenetJS) {
  Bluenet = NativeModules.BluenetJS;

  let API_Keys = Object.keys(BluenetAPI);
  let notImplemented = [];
  for (let i = 0; i < API_Keys.length; i++) {
    if (Bluenet[API_Keys[i]] === undefined) {
      notImplemented.push(API_Keys[i])
    }
  }
  if (notImplemented.length > 0) {
    console.error("Unimplemented method in Bridge file:", notImplemented);
  }

  let existingKeys = Object.keys(Bluenet);
  let extraMethods = [];
  for (let i = 0; i < existingKeys.length; i++) {
    if (BluenetAPI[existingKeys[i]] === undefined) {
      extraMethods.push(existingKeys[i])
    }
  }
  if (extraMethods.length > 0) {
    console.warn("Additional methods detected in Bridge file:", extraMethods);
  }
}
