import { NativeModules } from 'react-native';
import { DISABLE_NATIVE } from '../../ExternalConfig'

export let Bluenet;

const BluenetAPI = {
  clearTrackedBeacons: () => {},        // called through BluenetPromiseWrapper --> must be promise.
  rerouteEvents: () => {},
  isReady: () => {},                    // called through BluenetPromiseWrapper --> must be promise.
  connect: () => {},                    // called through BluenetPromiseWrapper --> must be promise.
  disconnectCommand: () => {},          // called through BluenetPromiseWrapper --> must be promise.
  phoneDisconnect: () => {},            // called through BluenetPromiseWrapper --> must be promise.
  resetBle: () => {},
  setSwitchState: () => {},             // called through BluenetPromiseWrapper --> must be promise.
  startScanning: () => {},
  startScanningForCrownstones: () => {},
  startScanningForCrownstonesUniqueOnly: () => {},
  stopScanning: () => {},
  keepAliveState: () => {},
  keepAlive: () => {},
  requestBleState: () => {},

  forceClearActiveRegion: () => {},
  startIndoorLocalization: () => {},
  stopIndoorLocalization: () => {},

  requestLocation: () => {},          // called through BluenetPromiseWrapper --> must be promise.
  requestLocationPermission: () => {},
  trackIBeacon: () => {},
  stopTrackingIBeacon: () => {},
  pauseTracking: () => {},
  resumeTracking: () => {},

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
  setSettings:() => {},
  setupFactoryReset:() => {},
  setupPutInDFU: () => {},
  toggleSwitchState:() => {},
}

if (DISABLE_NATIVE === true) {
  // LOG.info("!----------- --- --- --- -- -- -- - - - -- -- -- --- --- --- -----------!");
  // LOG.info("!-----------  NATIVE CALLS ARE DISABLED BY EXTERNALCONFIG.JS -----------!");
  // LOG.info("!----------- --- --- --- -- -- -- - - - -- -- -- --- --- --- -----------!");
  Bluenet = BluenetAPI;
}
else {
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
