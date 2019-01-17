import { NativeModules } from 'react-native';
import { DISABLE_NATIVE } from '../../ExternalConfig'

export let Bluenet;

const BluenetAPI = {
  clearTrackedBeacons:      () => { console.log("clearTrackedBeacons: "); },        // called through BluenetPromiseWrapper --> must be promise.
  rerouteEvents:            () => { console.log("rerouteEvents:       "); },
  isReady:                  () => { console.log("isReady:             "); },                    // called through BluenetPromiseWrapper --> must be promise.
  connect:                  () => { console.log("connect:             "); },                    // called through BluenetPromiseWrapper --> must be promise.
  disconnectCommand:        () => { console.log("disconnectCommand:   "); },          // called through BluenetPromiseWrapper --> must be promise.
  phoneDisconnect:          () => { console.log("phoneDisconnect:     "); },            // called through BluenetPromiseWrapper --> must be promise.
  resetBle:                 () => { console.log("resetBle:            "); },
  startScanning:            () => { console.log("startScanning:       "); },
  startScanningForCrownstones:           () => { console.log("startScanningForCrownstones:           "); },
  startScanningForCrownstonesUniqueOnly: () => { console.log("startScanningForCrownstonesUniqueOnly: "); },
  stopScanning:             () => { console.log("stopScanning:    "); },
  keepAliveState:           () => { console.log("keepAliveState:  "); },
  keepAlive:                () => { console.log("keepAlive:       "); },
  requestBleState:          () => { console.log("requestBleState: "); },// Send events "bleStatus" and "locationStatus" with the current state.

  startIndoorLocalization:  () => { console.log("startIndoorLocalization: "); },
  stopIndoorLocalization:   () => { console.log("stopIndoorLocalization:  "); },

  requestLocation:          () => { console.log("requestLocation:          "); },// Should return data {"latitude": number, "longitude": number}. Called through BluenetPromiseWrapper --> must be promise.
  requestLocationPermission:() => { console.log("requestLocationPermission:"); },// Request for location permission during tutorial.
  trackIBeacon:             () => { console.log("trackIBeacon:             "); },// Add the UUID to the list of tracked iBeacons, associate it with given sphereId, and start tracking.
  stopTrackingIBeacon:      () => { console.log("stopTrackingIBeacon:      "); },// Remove the UUID from the list of tracked iBeacons.
  pauseTracking:            () => { console.log("pauseTracking:            "); },// Stop tracking, but keep the list of tracked iBeacon UUIDs. Stop sending any tracking events: iBeacon, enter/exit region. Assume all tracked iBeacon UUIDs are out the region.
  resumeTracking:           () => { console.log("resumeTracking:           "); },// Start tracking again, with the list that is already there.

  startCollectingFingerprint:  () => { console.log("startCollectingFingerprint:  "); },
  abortCollectingFingerprint:  () => { console.log("abortCollectingFingerprint:  "); },
  pauseCollectingFingerprint:  () => { console.log("pauseCollectingFingerprint:  "); },
  resumeCollectingFingerprint: () => { console.log("resumeCollectingFingerprint: "); },
  finalizeFingerprint:         () => { console.log("finalizeFingerprint:         "); },       // called through BluenetPromiseWrapper --> must be promise. Promise return value is a stringified fingerprint

  loadFingerprint:          () => { console.log("loadFingerprint:       "); },
  getMACAddress:            () => { console.log("getMACAddress:         "); },             // called through BluenetPromiseWrapper --> must be promise.
  commandFactoryReset:      () => { console.log("commandFactoryReset:   "); },       // called through BluenetPromiseWrapper --> must be promise.
  recover:                  () => { console.log("recover:               "); },                   // called through BluenetPromiseWrapper --> must be promise.
  setupCrownstone:          () => { console.log("setupCrownstone:       "); },           // called through SetupCrownstone in BLEUtil
  quitApp:                  () => { console.log("quitApp:               "); NativeModules.BluenetJS.quitApp() },                   // Used to quit the app during logout
  enableLoggingToFile:      () => { console.log("enableLoggingToFile:   "); },
  enableExtendedLogging:    () => { console.log("enableExtendedLogging: "); },
  clearLogs:                () => { console.log("clearLogs:             "); },

  // mesh
  meshKeepAlive:            () => { console.log("meshKeepAlive:           "); },
  meshKeepAliveState:       () => { console.log("meshKeepAliveState:      "); },
  multiSwitch:              () => { console.log("multiSwitch:             "); },
  getHardwareVersion:       () => { console.log("getHardwareVersion:      "); },
  getBootloaderVersion:     () => { console.log("getBootloaderVersion:    "); },
  getFirmwareVersion:       () => { console.log("getFirmwareVersion:      "); },
  bootloaderToNormalMode:   () => { console.log("bootloaderToNormalMode:  "); },
  getErrors:                () => { console.log("getErrors:               "); },
  clearFingerprintsPromise: () => { console.log("clearFingerprintsPromise:"); },
  clearFingerprints:        () => { console.log("clearFingerprints:       "); },
  setTime:                  () => { console.log("setTime:                 "); },
  meshSetTime:              () => { console.log("meshSetTime:             "); },
  batterySaving:            () => { console.log("batterySaving:           "); },
  setBackgroundScanning:    () => { console.log("setBackgroundScanning:   "); },
  setSchedule:              () => { console.log("setSchedule:             "); },
  clearSchedule:            () => { console.log("clearSchedule:           "); },
  addSchedule:              () => { console.log("addSchedule:             "); },
  getSchedules:             () => { console.log("getSchedules:            "); },
  getAvailableScheduleEntryIndex: () => { console.log("getAvailableScheduleEntryIndex:"); },

  viewsInitialized:         () => { console.log("viewsInitialized:  "); },
  lockSwitch:               () => { console.log("lockSwitch:        "); },
  allowDimming:             () => { console.log("allowDimming:      "); },
  setSwitchCraft:           () => { console.log("setSwitchCraft:    "); },
  sendNoOp:                 () => { console.log("sendNoOp:          "); },
  sendMeshNoOp:             () => { console.log("sendMeshNoOp:      "); },


  getSwitchState:           () => { console.log(" getSwitchState:   "); },
  getTime:                  () => { console.log(" getTime:          "); },
  putInDFU:                 () => { console.log(" putInDFU:         "); },
  performDFU:               () => { console.log(" performDFU:       "); },
  restartCrownstone:        () => { console.log(" restartCrownstone:"); },
  clearKeySets:             () => { console.log(" clearKeysets:     "); },
  setKeySets:               () => { console.log(" setKeySets:       "); },
  setupFactoryReset:        () => { console.log(" setupFactoryReset:"); },
  setupPutInDFU:            () => { console.log(" setupPutInDFU:    "); },
  toggleSwitchState:        () => { console.log(" toggleSwitchState:"); },
  setMeshChannel:           () => { console.log(" setMeshChannel:   "); },
  getTrackingState:         () => { console.log(" getTrackingState: "); },
  setDevicePreferences:     () => { console.log(" setDevicePreferences: "); },
  setLocationState:         () => { console.log(" setLocationState: "); },
  startAdvertising:         () => { console.log(" startAdvertising: "); },
  stopAdvertising:          () => { console.log(" stopAdvertising: "); },
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
