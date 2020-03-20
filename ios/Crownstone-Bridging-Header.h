//
//  CustomSwiftComponent-Bridging-Header.h
//  CustomSwiftComponent

// This file seems to be neccessary for the module export to work.
// It's created when we create a Cocoa Touch Class file via the 'File>New File' Menu

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTEventEmitter.h>

#import <React/RCTBundleURLProvider.h>
#import <RNCPushNotificationIOS.h>
#import <UserNotifications/UserNotifications.h>
#import <React/RCTRootView.h>
#import <ReactNativeNavigation/ReactNativeNavigation.h>



#if __has_include(<React/RNSentry.h>)
#import <React/RNSentry.h> // This is used for versions of react >= 0.40
#else
#import "RNSentry.h" // This is used for versions of react < 0.40
#endif
#import "RNSplashScreen.h"

