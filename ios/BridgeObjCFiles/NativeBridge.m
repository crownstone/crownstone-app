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

RCT_EXTERN_METHOD(clearKeySets)
RCT_EXTERN_METHOD(setKeySets:(NSArray *)keySets callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(isReady:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(isPeripheralReady:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(rerouteEvents)
RCT_EXTERN_METHOD(startAdvertising)
RCT_EXTERN_METHOD(stopAdvertising)

RCT_EXTERN_METHOD(startScanning)
RCT_EXTERN_METHOD(startScanningForCrownstones)
RCT_EXTERN_METHOD(startScanningForCrownstonesUniqueOnly)
RCT_EXTERN_METHOD(stopScanning)

// Bluenet
RCT_EXTERN_METHOD(connect:(NSString *)uuid referenceId:(NSString *)referenceId callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(disconnectCommand:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(phoneDisconnect:(RCTResponseSenderBlock)callback)
// nonnull IS REQUIRED FOR ALL NUMBER ENTREES
RCT_EXTERN_METHOD(toggleSwitchState:(nonnull NSNumber *)stateForOn callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setSwitchState:(nonnull NSNumber *)state callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getSwitchState:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(keepAliveState:(nonnull NSNumber *)changeState state:(nonnull NSNumber *)state timeout:(nonnull NSNumber *)timeout callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(keepAlive:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(isDevelopmentEnvironment:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(commandFactoryReset:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(recover:(NSString *)crownstoneUUID callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setupCrownstone:(NSDictionary *)data callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getMACAddress:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getFirmwareVersion:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getBootloaderVersion:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getHardwareVersion:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getErrors:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(clearErrors:(NSDictionary *)errors callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(restartCrownstone:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(requestBleState)

// Bluenet localization
RCT_EXTERN_METHOD(requestLocation:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(requestLocationPermission)
RCT_EXTERN_METHOD(forceClearActiveRegion)
RCT_EXTERN_METHOD(startIndoorLocalization)
RCT_EXTERN_METHOD(stopIndoorLocalization)

RCT_EXTERN_METHOD(trackIBeacon:(NSString *)ibeaconUUID sphereId:(NSString*)sphereId)
RCT_EXTERN_METHOD(stopTrackingIBeacon:(NSString *)ibeaconUUID)

RCT_EXTERN_METHOD(startCollectingFingerprint)
RCT_EXTERN_METHOD(abortCollectingFingerprint)
RCT_EXTERN_METHOD(pauseCollectingFingerprint)
RCT_EXTERN_METHOD(resumeCollectingFingerprint)

RCT_EXTERN_METHOD(resumeTracking)
RCT_EXTERN_METHOD(pauseTracking)

RCT_EXTERN_METHOD(clearTrackedBeacons:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(finalizeFingerprint:(NSString *)sphereId locationId:(NSString *)locationId callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(loadFingerprint:(NSString *)sphereId locationId:(NSString *)locationId fingerprint:(NSString *)fingerprint)
RCT_EXTERN_METHOD(clearFingerprints)
RCT_EXTERN_METHOD(clearFingerprintsPromise:(RCTResponseSenderBlock)callback)


// MISC
RCT_EXTERN_METHOD(enableLoggingToFile:(nonnull NSNumber *)enableLogging)
RCT_EXTERN_METHOD(enableExtendedLogging:(nonnull NSNumber *)enableLogging)
RCT_EXTERN_METHOD(clearLogs)
RCT_EXTERN_METHOD(quitApp)
RCT_EXTERN_METHOD(setTime:(nonnull NSNumber *)time callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getTime:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(batterySaving:(nonnull NSNumber *)state)
RCT_EXTERN_METHOD(setBackgroundScanning:(nonnull NSNumber *)state)
RCT_EXTERN_METHOD(viewsInitialized)
RCT_EXTERN_METHOD(resetBle)

RCT_EXTERN_METHOD(allowDimming:(nonnull NSNumber *)allow callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(lockSwitch:(nonnull NSNumber *)lock callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setSwitchCraft:(nonnull NSNumber *)state callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setTapToToggle:(nonnull NSNumber *)state callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setTapToToggleThresholdOffset:(nonnull NSNumber *)state callback:(RCTResponseSenderBlock)callback)

// MESH
RCT_EXTERN_METHOD(meshSetTime:(nonnull NSNumber *)time callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(meshKeepAlive:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(meshKeepAliveState:(nonnull NSNumber *)timeout stoneKeepAlivePackets:(NSArray *)stoneKeepAlivePackets callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(multiSwitch:(NSArray *)arrayOfStoneSwitchPackets callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(turnOnMesh:(NSArray *)arrayOfStoneSwitchPackets callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setMeshChannel:(nonnull NSNumber *)channel callback:(RCTResponseSenderBlock)callback)

// DFU
RCT_EXTERN_METHOD(putInDFU:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setupPutInDFU:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(performDFU:(NSString *)uuid uri:(NSString *)uri callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setupFactoryReset:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(bootloaderToNormalMode:(NSString *)handle callback:(RCTResponseSenderBlock)callback)

// scheduler
RCT_EXTERN_METHOD(addSchedule:(NSDictionary *)data callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setSchedule:(NSDictionary *)data callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(clearSchedule:(nonnull NSNumber *)scheduleEntryIndex callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getAvailableScheduleEntryIndex:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getSchedules:(RCTResponseSenderBlock)callback)

// no op
RCT_EXTERN_METHOD(sendNoOp:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(sendMeshNoOp:(RCTResponseSenderBlock)callback)


RCT_EXTERN_METHOD(getTrackingState:(RCTResponseSenderBlock)callback)

// Broadcast
RCT_EXTERN_METHOD(broadcastSwitch:(NSString *)referenceId stoneId:(nonnull NSNumber *)stoneId switchState:(nonnull NSNumber *)switchState callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(turnOnBroadcast:(NSString *)referenceId stoneId:(nonnull NSNumber *)stoneId callback:(RCTResponseSenderBlock)callback)

// set states for broadcast
RCT_EXTERN_METHOD(setLocationState:(nonnull NSNumber *)sphereUID locationId:(nonnull NSNumber *)locationId profileIndex:(nonnull NSNumber *)profileIndex deviceToken:(nonnull NSNumber *)deviceToken referenceId:(NSString *)referenceId)
RCT_EXTERN_METHOD(setDevicePreferences:(nonnull NSNumber *)rssiOffset tapToToggle:(nonnull NSNumber *)tapToToggle ignoreForBehaviour:(nonnull NSNumber *)ignoreForBehaviour)

RCT_EXTERN_METHOD(setCrownstoneNames:(NSDictionary *)names)

// Setup
RCT_EXTERN_METHOD(setupPulse:(RCTResponseSenderBlock)callback)


RCT_EXTERN_METHOD(initBroadcasting)
RCT_EXTERN_METHOD(checkBroadcastAuthorization:(RCTResponseSenderBlock)callback)


// events
RCT_EXTERN_METHOD(subscribeToNearest)
RCT_EXTERN_METHOD(unsubscribeNearest)
RCT_EXTERN_METHOD(subscribeToUnverified)
RCT_EXTERN_METHOD(unsubscribeUnverified)

// Behaviour
RCT_EXTERN_METHOD(addBehaviour:   (NSDictionary *)data       callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(updateBehaviour:(NSDictionary *)data       callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(removeBehaviour:(nonnull NSNumber *)index  callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getBehaviour:   (nonnull NSNumber *)index  callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(syncBehaviours:          (NSArray *)behaviours   callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getBehaviourMasterHash:  (NSArray *)behaviours   callback:(RCTResponseSenderBlock)callback)


RCT_EXTERN_METHOD(setTimeViaBroadcast:(nonnull NSNumber *)time
                  sunriseSecondsSinceMidnight:(nonnull NSNumber *)sunriseSecondsSinceMidnight
                  sundownSecondsSinceMidnight:(nonnull NSNumber *)sundownSecondsSinceMidnight
                  referenceId:(NSString *)referenceId
                  callback:(RCTResponseSenderBlock)callback
              )
RCT_EXTERN_METHOD(setSunTimes: (nonnull NSNumber *)sunriseSecondsSinceMidnight  sundownSecondsSinceMidnight:(nonnull NSNumber *)sundownSecondsSinceMidnight)






// dev
RCT_EXTERN_METHOD(switchRelay: (nonnull NSNumber *)state callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(switchDimmer:(nonnull NSNumber *)state callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getResetCounter:(RCTResponseSenderBlock)callback)

// Bart Config Methods
RCT_EXTERN_METHOD(getSwitchcraftThreshold: (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getMaxChipTemp: (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getDimmerCurrentThreshold: (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getDimmerTempUpThreshold: (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getDimmerTempDownThreshold: (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getVoltageZero: (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getCurrentZero: (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getPowerZero: (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getVoltageMultiplier: (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getCurrentMultiplier: (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setSwitchcraftThreshold: (nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setMaxChipTemp: (nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setDimmerCurrentThreshold: (nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setDimmerTempUpThreshold: (nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setDimmerTempDownThreshold: (nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setVoltageZero: (nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setCurrentZero: (nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setPowerZero: (nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setVoltageMultiplier: (nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setCurrentMultiplier: (nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setUartState: (nonnull NSNumber *)value callback:(RCTResponseSenderBlock)callback)








+ (BOOL)requiresMainQueueSetup { return YES; }
@end
