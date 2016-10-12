//
//  CalendarManagerBridge.m
//  Crownstone
//
//  Created by Alex de Mulder on 16/03/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

// CalendarManagerBridge.m
#import "RCTBridgeModule.h"


@interface RCT_EXTERN_MODULE(BluenetJS, NSObject)


RCT_EXTERN_METHOD(setSettings:(NSDictionary *)settings callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(isReady:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(rerouteEvents)
RCT_EXTERN_METHOD(startScanning)
RCT_EXTERN_METHOD(startScanningForCrownstones)
RCT_EXTERN_METHOD(startScanningForCrownstonesUniqueOnly)
RCT_EXTERN_METHOD(startScanningForService:(NSString *)serviceId)
RCT_EXTERN_METHOD(stopScanning)

// Bluenet
RCT_EXTERN_METHOD(connect:(NSString *)uuid callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(disconnect:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(phoneDisconnect:(RCTResponseSenderBlock)callback)
// nonnull IS REQUIRED FOR ALL NUMBER ENTREES
RCT_EXTERN_METHOD(setSwitchState:(nonnull NSNumber *)state callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(commandFactoryReset:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(recover:(NSString *)crownstoneUUID callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(setupCrownstone:(NSDictionary *)data callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getMACAddress:(RCTResponseSenderBlock)callback)


// Bluenet localization
RCT_EXTERN_METHOD(startIndoorLocalization)
RCT_EXTERN_METHOD(stopIndoorLocalization)

RCT_EXTERN_METHOD(trackIBeacon:(NSString *)ibeaconUUID referenceId:(NSString*)referenceId)
RCT_EXTERN_METHOD(stopTrackingIBeacon:(NSString *)ibeaconUUID)

RCT_EXTERN_METHOD(startCollectingFingerprint)
RCT_EXTERN_METHOD(abortCollectingFingerprint)
RCT_EXTERN_METHOD(pauseCollectingFingerprint)
RCT_EXTERN_METHOD(resumeCollectingFingerprint)


RCT_EXTERN_METHOD(resumeTracking)
RCT_EXTERN_METHOD(pauseTracking)

RCT_EXTERN_METHOD(clearTrackedBeacons:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(finalizeFingerprint:(NSString *)sphereId locationId:(NSString *)locationId)
RCT_EXTERN_METHOD(getFingerprint:(NSString *)sphereId locationId:(NSString *)locationId callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(loadFingerprint:(NSString *)sphereId locationId:(NSString *)locationId fingerprint:(NSString *)fingerprint)
@end
