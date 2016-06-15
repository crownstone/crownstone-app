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

RCT_EXTERN_METHOD(isReady:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(rerouteEvents)
RCT_EXTERN_METHOD(startScanning)
RCT_EXTERN_METHOD(startScanningForCrownstones)
RCT_EXTERN_METHOD(startScanningForService:(NSString *)serviceId)
RCT_EXTERN_METHOD(stopScanning)

// Bluenet
RCT_EXTERN_METHOD(connect:(NSString *)uuid callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(disconnect:(RCTResponseSenderBlock)callback)
// nonnull IS REQUIRED FOR ALL NUMBER ENTREES
RCT_EXTERN_METHOD(setSwitchState:(nonnull NSNumber *)state callback:(RCTResponseSenderBlock)callback)

// Bluenet localization
RCT_EXTERN_METHOD(trackUUID:(NSString *)groupId groupName:(NSString*)groupName)
RCT_EXTERN_METHOD(startCollectingFingerprint)
RCT_EXTERN_METHOD(abortCollectingFingerprint)
RCT_EXTERN_METHOD(finalizeFingerprint:(NSString *)groupId locationId:(NSString *)locationId)
RCT_EXTERN_METHOD(getFingerprint:(NSString *)groupId locationId:(NSString *)locationId callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(loadFingerprint:(NSString *)groupId locationId:(NSString *)locationId fingerprint:(NSString *)fingerprint)
@end