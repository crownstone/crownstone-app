import { NativeModules } from 'react-native';
import { DISABLE_NATIVE } from '../../ExternalConfig'

export let Bluenet;
if (DISABLE_NATIVE === true) {
  // LOG.info("!----------- --- --- --- -- -- -- - - - -- -- -- --- --- --- -----------!");
  // LOG.info("!-----------  NATIVE CALLS ARE DISABLED BY EXTERNALCONFIG.JS -----------!");
  // LOG.info("!----------- --- --- --- -- -- -- - - - -- -- -- --- --- --- -----------!");
  Bluenet = {
    clearTrackedBeacons: () => {},        // called through BluenetPromiseWrapper --> must be promise.
    rerouteEvents: () => {},
    isReady: () => {},                    // called through BluenetPromiseWrapper --> must be promise.
    connect: () => {},                    // called through BluenetPromiseWrapper --> must be promise.
    disconnect: () => {},                 // called through BluenetPromiseWrapper --> must be promise.
    phoneDisconnect: () => {},            // called through BluenetPromiseWrapper --> must be promise.
    resetBle: () => {},
    setSwitchState: () => {},             // called through BluenetPromiseWrapper --> must be promise.
    startScanning: () => {},
    startScanningForCrownstones: () => {},
    startScanningForCrownstonesUniqueOnly: () => {},
    stopScanning: () => {},
    keepAliveState: () => {},
    keepAlive: () => {},

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
    enableLoggingToFile: () => {},
    clearLogs: () => {},

    // mesh
    meshKeepAlive: () => {},
    meshKeepAliveState: () => {},
    multiSwitch: () => {},
  }
}
else {
  Bluenet = NativeModules.BluenetJS;
}
