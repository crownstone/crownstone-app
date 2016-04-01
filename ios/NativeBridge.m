//
//  CalendarManagerBridge.m
//  Crownstone
//
//  Created by Alex de Mulder on 16/03/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

// CalendarManagerBridge.m
#import "RCTBridgeModule.h"

@interface RCT_EXTERN_MODULE(TitleMaker, NSObject)

RCT_EXTERN_METHOD(get:(nonnull NSNumber *)what callback:(RCTResponseSenderBlock)callback)

@end