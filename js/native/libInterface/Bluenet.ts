import { NativeModules } from 'react-native';
import { DISABLE_NATIVE } from '../../ExternalConfig'

export let Bluenet;

const BluenetAPI = {
  clearTrackedBeacons: () => {},        // Clear the list of tracked iBeacons and stop tracking. Called through BluenetPromiseWrapper --> must be promise.
  rerouteEvents: () => {},
  isReady: () => {},                    // called through BluenetPromiseWrapper --> must be promise.
  connect: () => {},                    // called through BluenetPromiseWrapper --> must be promise.
  disconnectCommand: () => {},          // called through BluenetPromiseWrapper --> must be promise.
  phoneDisconnect: () => {},            // called through BluenetPromiseWrapper --> must be promise.
  resetBle: () => {},
  startScanning: () => {},
  startScanningForCrownstones: () => {},
  startScanningForCrownstonesUniqueOnly: () => {},
  stopScanning: () => {},
  keepAliveState: () => {},
  keepAlive: () => {},
  requestBleState: () => {},

  startIndoorLocalization: () => {},
  stopIndoorLocalization: () => {},

  requestLocation: () => {},          // called through BluenetPromiseWrapper --> must be promise.
  requestLocationPermission: () => {},
  trackIBeacon: () => {},        // Add the UUID to the list of tracked iBeacons, associate it with given sphereId, and start tracking.
  stopTrackingIBeacon: () => {}, // Remove the UUID from the list of tracked iBeacons.
  pauseTracking: () => {},       // Stop tracking, but keep the list of tracked iBeacon UUIDs. Stop sending any tracking events: iBeacon, enter/exit region. Assume all tracked iBeacon UUIDs are out the region.
  resumeTracking: () => {},      // Start tracking again, with the list that is already there.

  startCollectingFingerprint: () => {},
  abortCollectingFingerprint: () => {},
  pauseCollectingFingerprint : () => {},
  resumeCollectingFingerprint: () => {},
  finalizeFingerprint: () => {},       // called through BluenetPromiseWrapper --> must be promise. Promise return value is a stringified fingerprint

  loadFingerprint: () => {},
  getMACAddress: () => {},             // called through BluenetPromiseWrapper --> must be promise.
  commandFactoryReset: () => {},       // called through BluenetPromiseWrapper --> must be promise.
  recover: () => {},                   // called through BluenetPromiseWrapper --> must be promise.
  setupCrownstone: () => {},           // called through SetupCrownstone in BLEUtil

  quitApp: () => { NativeModules.BluenetJS.quitApp() },                   // Used to quit the app during logout
  enableLoggingToFile: (enabledBool) => {},
  enableExtendedLogging: (enabledBool) => {},
  clearLogs: () => {},

  // mesh
  meshKeepAlive: () => {},
  meshKeepAliveState: () => {},
  multiSwitch: () => {},

  getHardwareVersion: () => {},
  getBootloaderVersion: () => {},
  getFirmwareVersion: () => {},
  bootloaderToNormalMode: () => {},
  getErrors: () => {},

  clearFingerprintsPromise: () => {},
  clearFingerprints: () => {},
  setTime: () => {},
  meshSetTime: () => {},
  batterySaving: () => {},
  setBackgroundScanning: () => {},

  setSchedule: () => {},
  clearSchedule: () => {},
  addSchedule: () => {},
  getSchedules: () => {},
  getAvailableScheduleEntryIndex: () => {},

  viewsInitialized: () => {},
  lockSwitch:() => {},
  allowDimming:() => {},
  setSwitchCraft:() => {},
  sendNoOp:() => {},
  sendMeshNoOp:() => {},


  getSwitchState:() => {},
  getTime:() => {},
  putInDFU:() => {},
  performDFU:() => {},
  restartCrownstone:() => {},
  setKeySets:() => {},
  setupFactoryReset:() => {},
  setupPutInDFU: () => {},
  toggleSwitchState:() => {},
  setMeshChannel:(channel) => {},
  getTrackingState:() => {},
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
