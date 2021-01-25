//
//  NativeBridge.m
//  Crownstone
//
//  Created by Alex de Mulder on 16/03/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(BluenetJS, RCTEventEmitter)
RCT_EXTERN_METHOD(rerouteEvents)
RCT_EXTERN_METHOD(clearKeySets)
RCT_EXTERN_METHOD(setKeySets:(NSArray *)keySets callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(isReady:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(isPeripheralReady:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(connect:(NSString *)handle referenceId:(NSString *)referenceId callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(phoneDisconnect:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(disconnectCommand:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(toggleSwitchState:(NSString *)handle stateForOn:(nonnul NSNumber *)stateForOn callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setSwitchState:(NSString *)handle state:(nonnul NSNumber *)state callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getSwitchState:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(startAdvertising)
RCT_EXTERN_METHOD(stopAdvertising)
RCT_EXTERN_METHOD(startScanning)
RCT_EXTERN_METHOD(startScanningForCrownstones)
RCT_EXTERN_METHOD(startScanningForCrownstonesUniqueOnly)
RCT_EXTERN_METHOD(stopScanning)
RCT_EXTERN_METHOD(startIndoorLocalization)
RCT_EXTERN_METHOD(stopIndoorLocalization)
RCT_EXTERN_METHOD(quitApp)
RCT_EXTERN_METHOD(resetBle)
RCT_EXTERN_METHOD(requestBleState)
RCT_EXTERN_METHOD(requestLocation:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(requestLocationPermission)
RCT_EXTERN_METHOD(trackIBeacon:(NSString *)ibeaconUUID sphereId:(NSString *)sphereId)
RCT_EXTERN_METHOD(stopTrackingIBeacon:(NSString *)ibeaconUUID)
RCT_EXTERN_METHOD(pauseTracking)
RCT_EXTERN_METHOD(resumeTracking)
RCT_EXTERN_METHOD(startCollectingFingerprint)
RCT_EXTERN_METHOD(abortCollectingFingerprint)
RCT_EXTERN_METHOD(pauseCollectingFingerprint)
RCT_EXTERN_METHOD(resumeCollectingFingerprint)
RCT_EXTERN_METHOD(finalizeFingerprint:(NSString *)sphereId locationId:(NSString *)locationId callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(clearTrackedBeacons:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(clearFingerprints)
RCT_EXTERN_METHOD(clearFingerprintsPromise:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(loadFingerprint:(NSString *)sphereId locationId:(NSString *)locationId fingerprint:(NSString *)fingerprint)
RCT_EXTERN_METHOD(commandFactoryReset:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getHardwareVersion:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getFirmwareVersion:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getBootloaderVersion:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getMACAddress:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(clearErrors:(NSString *)handle errors:(NSDictionary *)errors callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(restartCrownstone:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(recover:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getBehaviourDebugInformation:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(enableExtendedLogging:(nonnul NSNumber *)enableLogging)
RCT_EXTERN_METHOD(enableLoggingToFile:(nonnul NSNumber *)enableLogging)
RCT_EXTERN_METHOD(clearLogs)
RCT_EXTERN_METHOD(setupCrownstone:(NSString *)handle data:(NSDictionary *)data callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(multiSwitch:(NSString *)handle arrayOfStoneSwitchPackets:(NSArray *)arrayOfStoneSwitchPackets callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(broadcastBehaviourSettings:(NSString *)referenceId enabled:(nonnul NSNumber *)enabled callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(turnOnMesh:(NSString *)handle arrayOfStoneSwitchPackets:(NSArray *)arrayOfStoneSwitchPackets callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(turnOnBroadcast:(NSString *)referenceId stoneId:(nonnul NSNumber *)stoneId autoExecute:(nonnul NSNumber *)autoExecute callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(broadcastSwitch:(NSString *)referenceId
                     stoneId:(nonnul NSNumber *)stoneId
                     switchState:(nonnul NSNumber *)switchState
                     autoExecute:(nonnul NSNumber *)autoExecute
                     callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(broadcastExecute)
RCT_EXTERN_METHOD(setupPutInDFU:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(putInDFU:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(performDFU:(NSString *)handle uri:(NSString *)uri callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setupFactoryReset:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(bootloaderToNormalMode:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setTime:(NSString *)handle time:(nonnul NSNumber *)time callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(batterySaving:(nonnul NSNumber *)state)
RCT_EXTERN_METHOD(setBackgroundScanning:(nonnul NSNumber *)state)
RCT_EXTERN_METHOD(allowDimming:(NSString *)handle allow:(nonnul NSNumber *)allow callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(lockSwitch:(NSString *)handle lock:(nonnul NSNumber *)lock callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setSwitchCraft:(NSString *)handle state:(nonnul NSNumber *)state callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setTapToToggle:(NSString *)handle state:(nonnul NSNumber *)state callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getTapToToggleThresholdOffset:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setTapToToggleThresholdOffset:(NSString *)handle state:(nonnul NSNumber *)state callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(meshSetTime:(NSString *)handle time:(nonnul NSNumber *)time callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(sendNoOp:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(sendMeshNoOp:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setMeshChannel:(NSString *)handle channel:(nonnul NSNumber *)channel callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getTrackingState:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(isDevelopmentEnvironment:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(viewsInitialized)
RCT_EXTERN_METHOD(setLocationState:(nonnul NSNumber *)sphereUID
                     locationId:(nonnul NSNumber *)locationId
                     profileId:(nonnul NSNumber *)profileId
                     deviceToken:(nonnul NSNumber *)deviceToken
                     referenceId:(NSString *)referenceId)
RCT_EXTERN_METHOD(setDevicePreferences:(nonnul NSNumber *)rssiOffset
                     tapToToggle:(nonnul NSNumber *)tapToToggle
                     ignoreForBehaviour:(nonnul NSNumber *)ignoreForBehaviour
                     randomDeviceToken:(nonnul NSNumber *)randomDeviceToken
                     useTimeBasedNonce:(nonnul NSNumber *)useTimeBasedNonce)
RCT_EXTERN_METHOD(canUseDynamicBackgroundBroadcasts:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setCrownstoneNames:(NSDictionary *)names)
RCT_EXTERN_METHOD(setupPulse:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(subscribeToNearest)
RCT_EXTERN_METHOD(unsubscribeNearest)
RCT_EXTERN_METHOD(subscribeToUnverified)
RCT_EXTERN_METHOD(unsubscribeUnverified)
RCT_EXTERN_METHOD(initBroadcasting)
RCT_EXTERN_METHOD(checkBroadcastAuthorization:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(addBehaviour:(NSString *)handle data:(NSDictionary *)data callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(updateBehaviour:(NSString *)handle data:(NSDictionary *)data callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getBehaviour:(NSString *)handle index:(nonnul NSNumber *)index callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(removeBehaviour:(NSString *)handle index:(nonnul NSNumber *)index callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(syncBehaviours:(NSString *)handle behaviours:(NSArray *)behaviours callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getBehaviourMasterHash:(NSArray *)behaviours callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setTimeViaBroadcast:(nonnul NSNumber *)time
                     sunriseSecondsSinceMidnight:(nonnul NSNumber *)sunriseSecondsSinceMidnight
                     sundownSecondsSinceMidnight:(nonnul NSNumber *)sundownSecondsSinceMidnight
                     referenceId:(NSString *)referenceId
                     callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setSunTimes:(nonnul NSNumber *)sunriseSecondsSinceMidnight sundownSecondsSinceMidnight:(nonnul NSNumber *)sundownSecondsSinceMidnight referenceId:(NSString *)referenceId)
RCT_EXTERN_METHOD(setSunTimesViaConnection:(NSString *)handle sunriseSecondsSinceMidnight:(nonnul NSNumber *)sunriseSecondsSinceMidnight sundownSecondsSinceMidnight:(nonnul NSNumber *)sundownSecondsSinceMidnight callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(registerTrackedDevice:(NSString *)handle
                     trackingNumber:(nonnul NSNumber *)trackingNumber
                     locationUid:(nonnul NSNumber *)locationUid
                     profileId:(nonnul NSNumber *)profileId
                     rssiOffset:(nonnul NSNumber *)rssiOffset
                     ignoreForPresence:(nonnul NSNumber *)ignoreForPresence
                     tapToToggleEnabled:(nonnul NSNumber *)tapToToggleEnabled
                     deviceToken:(nonnul NSNumber *)deviceToken
                     ttlMinutes:(nonnul NSNumber *)ttlMinutes
                     callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(trackedDeviceHeartbeat:(NSString *)handle
                     trackingNumber:(nonnul NSNumber *)trackingNumber
                     locationUid:(nonnul NSNumber *)locationUid
                     deviceToken:(nonnul NSNumber *)deviceToken
                     ttlMinutes:(nonnul NSNumber *)ttlMinutes
                     callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(broadcastUpdateTrackedDevice:(NSString *)referenceId
                     trackingNumber:(nonnul NSNumber *)trackingNumber
                     locationUid:(nonnul NSNumber *)locationUid
                     profileId:(nonnul NSNumber *)profileId
                     rssiOffset:(nonnul NSNumber *)rssiOffset
                     ignoreForPresence:(nonnul NSNumber *)ignoreForPresence
                     tapToToggleEnabled:(nonnul NSNumber *)tapToToggleEnabled
                     deviceToken:(nonnul NSNumber *)deviceToken
                     ttlMinutes:(nonnul NSNumber *)ttlMinutes
                     callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(switchRelay:(NSString *)handle state:(nonnul NSNumber *)state callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getCrownstoneUptime:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getAdcRestarts:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getSwitchHistory:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getPowerSamples:(NSString *)handle type:(NSString *)type callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setUartKey:(NSString *)handle uartKey:(NSString *)uartKey callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(transferHubTokenAndCloudId:(NSString *)handle hubToken:(NSString *)hubToken cloudId:(NSString *)cloudId callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(requestCloudId:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(factoryResetHub:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(factoryResetHubOnly:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getMinSchedulerFreeSpace:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getLastResetReason:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getGPREGRET:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getAdcChannelSwaps:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setSoftOnSpeed:(NSString *)handle speed:(nonnul NSNumber *)speed callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getSoftOnSpeed:(NSString *)handle speed:(nonnul NSNumber *)speed callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(switchDimmer:(NSString *)handle state:(nonnul NSNumber *)state callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getResetCounter:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getSwitchcraftThreshold:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setSwitchcraftThreshold:(NSString *)handle value:(nonnul NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getMaxChipTemp:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setMaxChipTemp:(NSString *)handle value:(nonnul NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getDimmerCurrentThreshold:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setDimmerCurrentThreshold:(NSString *)handle value:(nonnul NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getDimmerTempUpThreshold:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setDimmerTempUpThreshold:(NSString *)handle value:(nonnul NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getDimmerTempDownThreshold:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setDimmerTempDownThreshold:(NSString *)handle value:(nonnul NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getVoltageZero:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setVoltageZero:(NSString *)handle value:(nonnul NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getCurrentZero:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setCurrentZero:(NSString *)handle value:(nonnul NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getPowerZero:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setPowerZero:(NSString *)handle value:(nonnul NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getVoltageMultiplier:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setVoltageMultiplier:(NSString *)handle value:(nonnul NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getCurrentMultiplier:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setCurrentMultiplier:(NSString *)handle value:(nonnul NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setUartState:(NSString *)handle state:(nonnul NSNumber *)state callback:(RCTResponseSenderBlock)callback)




+ (BOOL)requiresMainQueueSetup { return YES; }
@end
