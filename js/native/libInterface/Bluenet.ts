import { NativeModules } from 'react-native';
import { DISABLE_NATIVE } from '../../ExternalConfig'

export let Bluenet;

const BluenetAPI = {
  clearTrackedBeacons:      () => { console.log("BluenetAPI clearTrackedBeacons: ", arguments); },        // called through BluenetPromiseWrapper --> must be promise.
  rerouteEvents:            () => { console.log("BluenetAPI rerouteEvents:       ", arguments); },
  isReady:                  () => { console.log("BluenetAPI isReady:             ", arguments); },                    // called through BluenetPromiseWrapper --> must be promise.
  connect:                  () => { console.log("BluenetAPI connect:             ", arguments); },                    // called through BluenetPromiseWrapper --> must be promise.
  disconnectCommand:        () => { console.log("BluenetAPI disconnectCommand:   ", arguments); },          // called through BluenetPromiseWrapper --> must be promise.
  phoneDisconnect:          () => { console.log("BluenetAPI phoneDisconnect:     ", arguments); },            // called through BluenetPromiseWrapper --> must be promise.
  resetBle:                 () => { console.log("BluenetAPI resetBle:            ", arguments); },
  startScanning:            () => { console.log("BluenetAPI startScanning:       ", arguments); },
  startScanningForCrownstones:           () => { console.log("BluenetAPI startScanningForCrownstones:           ", arguments); },
  startScanningForCrownstonesUniqueOnly: () => { console.log("BluenetAPI startScanningForCrownstonesUniqueOnly: ", arguments); },
  stopScanning:             () => { console.log("BluenetAPI stopScanning:    ", arguments); },
  keepAliveState:           () => { console.log("BluenetAPI keepAliveState:  ", arguments); },
  keepAlive:                () => { console.log("BluenetAPI keepAlive:       ", arguments); },
  requestBleState:          () => { console.log("BluenetAPI requestBleState: ", arguments); },// Send events "bleStatus" and "locationStatus" with the current state.

  startIndoorLocalization:  () => { console.log("BluenetAPI startIndoorLocalization: ", arguments); },
  stopIndoorLocalization:   () => { console.log("BluenetAPI stopIndoorLocalization:  ", arguments); },

  requestLocation:          () => { console.log("BluenetAPI requestLocation:          ", arguments); },// Should return data {"latitude": number, "longitude": number}. Called through BluenetPromiseWrapper --> must be promise.
  requestLocationPermission:() => { console.log("BluenetAPI requestLocationPermission:", arguments); },// Request for location permission during tutorial.
  trackIBeacon:             () => { console.log("BluenetAPI trackIBeacon:             ", arguments); },// Add the UUID to the list of tracked iBeacons, associate it with given sphereId, and start tracking.
  stopTrackingIBeacon:      () => { console.log("BluenetAPI stopTrackingIBeacon:      ", arguments); },// Remove the UUID from the list of tracked iBeacons.
  pauseTracking:            () => { console.log("BluenetAPI pauseTracking:            ", arguments); },// Stop tracking, but keep the list of tracked iBeacon UUIDs. Stop sending any tracking events: iBeacon, enter/exit region. Assume all tracked iBeacon UUIDs are out the region.
  resumeTracking:           () => { console.log("BluenetAPI resumeTracking:           ", arguments); },// Start tracking again, with the list that is already there.



  startCollectingFingerprint:  () => { console.log("BluenetAPI startCollectingFingerprint:  ", arguments); },
  abortCollectingFingerprint:  () => { console.log("BluenetAPI abortCollectingFingerprint:  ", arguments); },
  pauseCollectingFingerprint:  () => { console.log("BluenetAPI pauseCollectingFingerprint:  ", arguments); },
  resumeCollectingFingerprint: () => { console.log("BluenetAPI resumeCollectingFingerprint: ", arguments); },
  finalizeFingerprint:         () => { console.log("BluenetAPI finalizeFingerprint:         ", arguments); },       // called through BluenetPromiseWrapper --> must be promise. Promise return value is a stringified fingerprint

  loadFingerprint:          () => { console.log("BluenetAPI loadFingerprint:       ", arguments); },
  getMACAddress:            () => { console.log("BluenetAPI getMACAddress:         ", arguments); },             // called through BluenetPromiseWrapper --> must be promise.
  commandFactoryReset:      () => { console.log("BluenetAPI commandFactoryReset:   ", arguments); },       // called through BluenetPromiseWrapper --> must be promise.
  recover:                  () => { console.log("BluenetAPI recover:               ", arguments); },                   // called through BluenetPromiseWrapper --> must be promise.
  setupCrownstone:          () => { console.log("BluenetAPI setupCrownstone:       ", arguments); },           // called through SetupCrownstone in BLEUtil
  quitApp:                  () => { console.log("BluenetAPI quitApp:               ", arguments); NativeModules.BluenetJS.quitApp() },                   // Used to quit the app during logout
  enableLoggingToFile:      () => { console.log("BluenetAPI enableLoggingToFile:   ", arguments); },
  enableExtendedLogging:    () => { console.log("BluenetAPI enableExtendedLogging: ", arguments); },
  clearLogs:                () => { console.log("BluenetAPI clearLogs:             ", arguments); },

  // mesh
  meshKeepAlive:            () => { console.log("BluenetAPI meshKeepAlive:           ", arguments); },
  meshKeepAliveState:       () => { console.log("BluenetAPI meshKeepAliveState:      ", arguments); },
  multiSwitch:              () => { console.log("BluenetAPI multiSwitch:             ", arguments); },
  getHardwareVersion:       () => { console.log("BluenetAPI getHardwareVersion:      ", arguments); },
  getBootloaderVersion:     () => { console.log("BluenetAPI getBootloaderVersion:    ", arguments); },
  getFirmwareVersion:       () => { console.log("BluenetAPI getFirmwareVersion:      ", arguments); },
  bootloaderToNormalMode:   () => { console.log("BluenetAPI bootloaderToNormalMode:  ", arguments); },
  getErrors:                () => { console.log("BluenetAPI getErrors:               ", arguments); },
  clearFingerprintsPromise: () => { console.log("BluenetAPI clearFingerprintsPromise:", arguments); },
  clearFingerprints:        () => { console.log("BluenetAPI clearFingerprints:       ", arguments); },
  setTime:                  () => { console.log("BluenetAPI setTime:                 ", arguments); },
  meshSetTime:              () => { console.log("BluenetAPI meshSetTime:             ", arguments); },
  batterySaving:            () => { console.log("BluenetAPI batterySaving:           ", arguments); },
  setBackgroundScanning:    () => { console.log("BluenetAPI setBackgroundScanning:   ", arguments); },
  setSchedule:              () => { console.log("BluenetAPI setSchedule:             ", arguments); },
  clearSchedule:            () => { console.log("BluenetAPI clearSchedule:           ", arguments); },
  addSchedule:              () => { console.log("BluenetAPI addSchedule:             ", arguments); },
  getSchedules:             () => { console.log("BluenetAPI getSchedules:            ", arguments); },
  getAvailableScheduleEntryIndex: () => { console.log("BluenetAPI getAvailableScheduleEntryIndex:", arguments); },

  viewsInitialized:         () => { console.log("BluenetAPI viewsInitialized:  ", arguments); },
  lockSwitch:               () => { console.log("BluenetAPI lockSwitch:        ", arguments); },
  allowDimming:             () => { console.log("BluenetAPI allowDimming:      ", arguments); },
  setSwitchCraft:           () => { console.log("BluenetAPI setSwitchCraft:    ", arguments); },
  sendNoOp:                 () => { console.log("BluenetAPI sendNoOp:          ", arguments); },
  sendMeshNoOp:             () => { console.log("BluenetAPI sendMeshNoOp:      ", arguments); },


  getSwitchState:           () => { console.log("BluenetAPI getSwitchState:   ", arguments); },
  getTime:                  () => { console.log("BluenetAPI getTime:          ", arguments); },
  putInDFU:                 () => { console.log("BluenetAPI putInDFU:         ", arguments); },
  performDFU:               () => { console.log("BluenetAPI performDFU:       ", arguments); },
  restartCrownstone:        () => { console.log("BluenetAPI restartCrownstone:", arguments); },
  clearKeySets:             () => { console.log("BluenetAPI clearKeysets:     ", arguments); },
  setKeySets:               () => { console.log("BluenetAPI setKeySets:       ", arguments); },
  setupFactoryReset:        () => { console.log("BluenetAPI setupFactoryReset:", arguments); },
  setupPutInDFU:            () => { console.log("BluenetAPI setupPutInDFU:    ", arguments); },
  toggleSwitchState:        () => { console.log("BluenetAPI toggleSwitchState:", arguments); },
  setMeshChannel:           () => { console.log("BluenetAPI setMeshChannel:   ", arguments); },
  getTrackingState:         () => { console.log("BluenetAPI getTrackingState: ", arguments); },
  setDevicePreferences:     () => { console.log("BluenetAPI setDevicePreferences: ", arguments); },
  setLocationState:         () => { console.log("BluenetAPI setLocationState: ", arguments); },
  startAdvertising:         () => { console.log("BluenetAPI startAdvertising: ", arguments); },
  stopAdvertising:          () => { console.log("BluenetAPI stopAdvertising: ", arguments); },
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
