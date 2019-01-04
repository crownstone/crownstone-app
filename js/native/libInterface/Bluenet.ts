import { NativeModules } from 'react-native';
import { DISABLE_NATIVE } from '../../ExternalConfig'

export let Bluenet;

const BluenetAPI = {
  clearTrackedBeacons:      () => { console.log("clearTrackedBeacons: ", arguments); },        // called through BluenetPromiseWrapper --> must be promise.
  rerouteEvents:            () => { console.log("rerouteEvents:       ", arguments); },
  isReady:                  () => { console.log("isReady:             ", arguments); },                    // called through BluenetPromiseWrapper --> must be promise.
  connect:                  () => { console.log("connect:             ", arguments); },                    // called through BluenetPromiseWrapper --> must be promise.
  disconnectCommand:        () => { console.log("disconnectCommand:   ", arguments); },          // called through BluenetPromiseWrapper --> must be promise.
  phoneDisconnect:          () => { console.log("phoneDisconnect:     ", arguments); },            // called through BluenetPromiseWrapper --> must be promise.
  resetBle:                 () => { console.log("resetBle:            ", arguments); },
  startScanning:            () => { console.log("startScanning:       ", arguments); },
  startScanningForCrownstones:           () => { console.log("startScanningForCrownstones:           ", arguments); },
  startScanningForCrownstonesUniqueOnly: () => { console.log("startScanningForCrownstonesUniqueOnly: ", arguments); },
  stopScanning:             () => { console.log("stopScanning:    ", arguments); },
  keepAliveState:           () => { console.log("keepAliveState:  ", arguments); },
  keepAlive:                () => { console.log("keepAlive:       ", arguments); },
  requestBleState:          () => { console.log("requestBleState: ", arguments); },

  startIndoorLocalization:  () => { console.log("startIndoorLocalization: ", arguments); },
  stopIndoorLocalization:   () => { console.log("stopIndoorLocalization:  ", arguments); },

  requestLocation:          () => { console.log("requestLocation:          ", arguments); },          // called through BluenetPromiseWrapper --> must be promise.
  requestLocationPermission:() => { console.log("requestLocationPermission:", arguments); },
  trackIBeacon:             () => { console.log("trackIBeacon:             ", arguments); },
  stopTrackingIBeacon:      () => { console.log("stopTrackingIBeacon:      ", arguments); },
  pauseTracking:            () => { console.log("pauseTracking:            ", arguments); },
  resumeTracking:           () => { console.log("resumeTracking:           ", arguments); },

  startCollectingFingerprint:  () => { console.log("startCollectingFingerprint:  ", arguments); },
  abortCollectingFingerprint:  () => { console.log("abortCollectingFingerprint:  ", arguments); },
  pauseCollectingFingerprint:  () => { console.log("pauseCollectingFingerprint:  ", arguments); },
  resumeCollectingFingerprint: () => { console.log("resumeCollectingFingerprint: ", arguments); },
  finalizeFingerprint:         () => { console.log("finalizeFingerprint:         ", arguments); },       // called through BluenetPromiseWrapper --> must be promise. Promise return value is a stringified fingerprint

  loadFingerprint:          () => { console.log("loadFingerprint:       ", arguments); },
  getMACAddress:            () => { console.log("getMACAddress:         ", arguments); },             // called through BluenetPromiseWrapper --> must be promise.
  commandFactoryReset:      () => { console.log("commandFactoryReset:   ", arguments); },       // called through BluenetPromiseWrapper --> must be promise.
  recover:                  () => { console.log("recover:               ", arguments); },                   // called through BluenetPromiseWrapper --> must be promise.
  setupCrownstone:          () => { console.log("setupCrownstone:       ", arguments); },           // called through SetupCrownstone in BLEUtil
  quitApp:                  () => { console.log("quitApp:               ", arguments); NativeModules.BluenetJS.quitApp() },                   // Used to quit the app during logout
  enableLoggingToFile:      () => { console.log("enableLoggingToFile:   ", arguments); },
  enableExtendedLogging:    () => { console.log("enableExtendedLogging: ", arguments); },
  clearLogs:                () => { console.log("clearLogs:             ", arguments); },

  // mesh
  meshKeepAlive:            () => { console.log("meshKeepAlive:           ", arguments); },
  meshKeepAliveState:       () => { console.log("meshKeepAliveState:      ", arguments); },
  multiSwitch:              () => { console.log("multiSwitch:             ", arguments); },
  getHardwareVersion:       () => { console.log("getHardwareVersion:      ", arguments); },
  getBootloaderVersion:     () => { console.log("getBootloaderVersion:    ", arguments); },
  getFirmwareVersion:       () => { console.log("getFirmwareVersion:      ", arguments); },
  bootloaderToNormalMode:   () => { console.log("bootloaderToNormalMode:  ", arguments); },
  getErrors:                () => { console.log("getErrors:               ", arguments); },
  clearFingerprintsPromise: () => { console.log("clearFingerprintsPromise:", arguments); },
  clearFingerprints:        () => { console.log("clearFingerprints:       ", arguments); },
  setTime:                  () => { console.log("setTime:                 ", arguments); },
  meshSetTime:              () => { console.log("meshSetTime:             ", arguments); },
  batterySaving:            () => { console.log("batterySaving:           ", arguments); },
  setBackgroundScanning:    () => { console.log("setBackgroundScanning:   ", arguments); },
  setSchedule:              () => { console.log("setSchedule:             ", arguments); },
  clearSchedule:            () => { console.log("clearSchedule:           ", arguments); },
  addSchedule:              () => { console.log("addSchedule:             ", arguments); },
  getSchedules:             () => { console.log("getSchedules:            ", arguments); },
  getAvailableScheduleEntryIndex: () => { console.log("getAvailableScheduleEntryIndex:", arguments); },

  viewsInitialized:         () => { console.log("viewsInitialized:  ", arguments); },
  lockSwitch:               () => { console.log("lockSwitch:        ", arguments); },
  allowDimming:             () => { console.log("allowDimming:      ", arguments); },
  setSwitchCraft:           () => { console.log("setSwitchCraft:    ", arguments); },
  sendNoOp:                 () => { console.log("sendNoOp:          ", arguments); },
  sendMeshNoOp:             () => { console.log("sendMeshNoOp:      ", arguments); },


  getSwitchState:           () => { console.log(" getSwitchState:   ", arguments); },
  getTime:                  () => { console.log(" getTime:          ", arguments); },
  putInDFU:                 () => { console.log(" putInDFU:         ", arguments); },
  performDFU:               () => { console.log(" performDFU:       ", arguments); },
  restartCrownstone:        () => { console.log(" restartCrownstone:", arguments); },
  clearKeySets:             () => { console.log(" clearKeysets:     ", arguments); },
  setKeySets:               () => { console.log(" setKeySets:       ", arguments); },
  setupFactoryReset:        () => { console.log(" setupFactoryReset:", arguments); },
  setupPutInDFU:            () => { console.log(" setupPutInDFU:    ", arguments); },
  toggleSwitchState:        () => { console.log(" toggleSwitchState:", arguments); },
  setMeshChannel:           () => { console.log(" setMeshChannel:   ", arguments); },
  getTrackingState:         () => { console.log(" getTrackingState: ", arguments); },
  setDevicePreferences:     () => { console.log(" setDevicePreferences: ", arguments); },
  setLocationState:         () => { console.log(" setLocationState: ", arguments); },
  startAdvertising:         () => { console.log(" startAdvertising: ", arguments); },
  stopAdvertising:          () => { console.log(" stopAdvertising: ", arguments); },
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
