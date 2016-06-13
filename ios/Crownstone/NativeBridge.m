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

RCT_EXTERN_METHOD(get:(nonnull NSNumber *)what callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(connect:(NSString *)uuid callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(reset)
RCT_EXTERN_METHOD(initBluenet)
RCT_EXTERN_METHOD(startScanning)
RCT_EXTERN_METHOD(stopScanning)
RCT_EXTERN_METHOD(isReady:callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(startCollectingFingerprint:(NSString *)groupId locationId:(NSString *)locationId)
RCT_EXTERN_METHOD(finishCollectingFingerprint)
RCT_EXTERN_METHOD(getFingerprint:(NSString *)locationId  callback:(RCTResponseSenderBlock)callback)

@end