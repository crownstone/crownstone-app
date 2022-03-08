
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
RCT_EXTERN_METHOD(isReady:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(isPeripheralReady:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(connect:(NSString *)handle referenceId:(NSString *)referenceId highPriority:(nonnull NSNumber *)highPriority callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(cancelConnectionRequest:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(phoneDisconnect:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(disconnectCommand:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(toggleSwitchState:(NSString *)handle stateForOn:(nonnull NSNumber *)stateForOn callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setSwitchState:(NSString *)handle state:(nonnull NSNumber *)state callback:(RCTResponseSenderBlock)callback)
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
RCT_EXTERN_METHOD(crash)
RCT_EXTERN_METHOD(resetBle)
RCT_EXTERN_METHOD(requestBleState)
RCT_EXTERN_METHOD(requestLocation:(RCTResponseSenderBlock)callback)
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
RCT_EXTERN_METHOD(getUICR:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getBootloaderVersion:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getMACAddress:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(clearErrors:(NSString *)handle errors:(NSDictionary *)errors callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(restartCrownstone:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(recover:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getBehaviourDebugInformation:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(enableExtendedLogging:(nonnull NSNumber *)enableLogging)
RCT_EXTERN_METHOD(enableLoggingToFile:(nonnull NSNumber *)enableLogging)
RCT_EXTERN_METHOD(clearLogs)
RCT_EXTERN_METHOD(setupCrownstone:(NSString *)handle data:(NSDictionary *)data callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(multiSwitch:(NSString *)handle arrayOfStoneSwitchPackets:(NSArray *)arrayOfStoneSwitchPackets callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(broadcastBehaviourSettings:(NSString *)referenceId enabled:(nonnull NSNumber *)enabled callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(turnOnMesh:(NSString *)handle arrayOfStoneIds:(NSArray *)arrayOfStoneIds callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(turnOnBroadcast:(NSString *)referenceId stoneId:(nonnull NSNumber *)stoneId autoExecute:(nonnull NSNumber *)autoExecute callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(broadcastSwitch:(NSString *)referenceId
                     stoneId:(nonnull NSNumber *)stoneId
                     switchState:(nonnull NSNumber *)switchState
                     autoExecute:(nonnull NSNumber *)autoExecute
                     callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(broadcastExecute)
RCT_EXTERN_METHOD(setupPutInDFU:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(putInDFU:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(performDFU:(NSString *)handle uri:(NSString *)uri callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setupFactoryReset:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(bootloaderToNormalMode:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setTime:(NSString *)handle time:(nonnull NSNumber *)time callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(batterySaving:(nonnull NSNumber *)state)
RCT_EXTERN_METHOD(setBackgroundScanning:(nonnull NSNumber *)state)
RCT_EXTERN_METHOD(allowDimming:(NSString *)handle allow:(nonnull NSNumber *)allow callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(lockSwitch:(NSString *)handle lock:(nonnull NSNumber *)lock callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setSwitchCraft:(NSString *)handle state:(nonnull NSNumber *)state callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setTapToToggle:(NSString *)handle state:(nonnull NSNumber *)state callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getTapToToggleThresholdOffset:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setTapToToggleThresholdOffset:(NSString *)handle state:(nonnull NSNumber *)state callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(meshSetTime:(NSString *)handle time:(nonnull NSNumber *)time callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(sendNoOp:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(sendMeshNoOp:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getTrackingState:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(isDevelopmentEnvironment:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(viewsInitialized)
RCT_EXTERN_METHOD(setLocationState:(nonnull NSNumber *)sphereUID
                     locationId:(nonnull NSNumber *)locationId
                     profileId:(nonnull NSNumber *)profileId
                     deviceToken:(nonnull NSNumber *)deviceToken
                     referenceId:(NSString *)referenceId)
RCT_EXTERN_METHOD(setDevicePreferences:(nonnull NSNumber *)rssiOffset
                     tapToToggle:(nonnull NSNumber *)tapToToggle
                     ignoreForBehaviour:(nonnull NSNumber *)ignoreForBehaviour
                     randomDeviceToken:(nonnull NSNumber *)randomDeviceToken
                     useTimeBasedNonce:(nonnull NSNumber *)useTimeBasedNonce)
RCT_EXTERN_METHOD(canUseDynamicBackgroundBroadcasts:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setCrownstoneNames:(NSDictionary *)names)
RCT_EXTERN_METHOD(setupPulse:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(subscribeToNearest)
RCT_EXTERN_METHOD(unsubscribeNearest)
RCT_EXTERN_METHOD(subscribeToUnverified)
RCT_EXTERN_METHOD(unsubscribeUnverified)
RCT_EXTERN_METHOD(initBroadcasting)
RCT_EXTERN_METHOD(gotoOsAppSettings)
RCT_EXTERN_METHOD(checkBroadcastAuthorization:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(addBehaviour:(NSString *)handle data:(NSDictionary *)data callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(updateBehaviour:(NSString *)handle data:(NSDictionary *)data callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getBehaviour:(NSString *)handle index:(nonnull NSNumber *)index callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(removeBehaviour:(NSString *)handle index:(nonnull NSNumber *)index callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(syncBehaviours:(NSString *)handle behaviours:(NSArray *)behaviours callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getBehaviourMasterHash:(NSArray *)behaviours callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setTimeViaBroadcast:(nonnull NSNumber *)time
                     sunriseSecondsSinceMidnight:(nonnull NSNumber *)sunriseSecondsSinceMidnight
                     sundownSecondsSinceMidnight:(nonnull NSNumber *)sundownSecondsSinceMidnight
                     referenceId:(NSString *)referenceId
                     enableTimeBasedNonce:(nonnull NSNumber*) enableTimeBasedNonce
                     callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setSunTimes:(nonnull NSNumber *)sunriseSecondsSinceMidnight sundownSecondsSinceMidnight:(nonnull NSNumber *)sundownSecondsSinceMidnight referenceId:(NSString *)referenceId)
RCT_EXTERN_METHOD(setSunTimesViaConnection:(NSString *)handle sunriseSecondsSinceMidnight:(nonnull NSNumber *)sunriseSecondsSinceMidnight sundownSecondsSinceMidnight:(nonnull NSNumber *)sundownSecondsSinceMidnight callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(registerTrackedDevice:(NSString *)handle
                     trackingNumber:(nonnull NSNumber *)trackingNumber
                     locationUid:(nonnull NSNumber *)locationUid
                     profileId:(nonnull NSNumber *)profileId
                     rssiOffset:(nonnull NSNumber *)rssiOffset
                     ignoreForPresence:(nonnull NSNumber *)ignoreForPresence
                     tapToToggleEnabled:(nonnull NSNumber *)tapToToggleEnabled
                     deviceToken:(nonnull NSNumber *)deviceToken
                     ttlMinutes:(nonnull NSNumber *)ttlMinutes
                     callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(trackedDeviceHeartbeat:(NSString *)handle
                     trackingNumber:(nonnull NSNumber *)trackingNumber
                     locationUid:(nonnull NSNumber *)locationUid
                     deviceToken:(nonnull NSNumber *)deviceToken
                     ttlMinutes:(nonnull NSNumber *)ttlMinutes
                     callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(broadcastUpdateTrackedDevice:(NSString *)referenceId
                     trackingNumber:(nonnull NSNumber *)trackingNumber
                     locationUid:(nonnull NSNumber *)locationUid
                     profileId:(nonnull NSNumber *)profileId
                     rssiOffset:(nonnull NSNumber *)rssiOffset
                     ignoreForPresence:(nonnull NSNumber *)ignoreForPresence
                     tapToToggleEnabled:(nonnull NSNumber *)tapToToggleEnabled
                     deviceToken:(nonnull NSNumber *)deviceToken
                     ttlMinutes:(nonnull NSNumber *)ttlMinutes
                     callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getLaunchArguments:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(switchRelay:(NSString *)handle state:(nonnull NSNumber *)state callback:(RCTResponseSenderBlock)callback)
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
RCT_EXTERN_METHOD(setSoftOnSpeed:(NSString *)handle speed:(nonnull NSNumber *)speed callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getSoftOnSpeed:(NSString *)handle speed:(nonnull NSNumber *)speed callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(switchDimmer:(NSString *)handle state:(nonnull NSNumber *)state callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getResetCounter:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getSwitchcraftThreshold:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setSwitchcraftThreshold:(NSString *)handle value:(nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getMaxChipTemp:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setMaxChipTemp:(NSString *)handle value:(nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getDimmerCurrentThreshold:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setDimmerCurrentThreshold:(NSString *)handle value:(nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getDimmerTempUpThreshold:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setDimmerTempUpThreshold:(NSString *)handle value:(nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getDimmerTempDownThreshold:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setDimmerTempDownThreshold:(NSString *)handle value:(nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getVoltageZero:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setVoltageZero:(NSString *)handle value:(nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getCurrentZero:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setCurrentZero:(NSString *)handle value:(nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getPowerZero:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setPowerZero:(NSString *)handle value:(nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getVoltageMultiplier:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setVoltageMultiplier:(NSString *)handle value:(nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getCurrentMultiplier:(NSString *)handle callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setCurrentMultiplier:(NSString *)handle value:(nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setUartState:(NSString *)handle state:(nonnull NSNumber *)state callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(useHighFrequencyScanningInBackground:(nonnull NSNumber *)state)

+ (BOOL)requiresMainQueueSetup { return YES; }
@end
