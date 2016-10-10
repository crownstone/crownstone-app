/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AppDelegate.h"

#import "RCTBundleURLProvider.h"
#import "RCTRootView.h"
#import "Crownstone-Swift.h"
#import "RCTSplashScreen.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  NSURL *jsCodeLocation;
  NSLog(@"------------------------------------- 1");

  jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index.ios" fallbackResource:nil];
  
  jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];

  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"Crownstone"
                                               initialProperties:nil
                                                   launchOptions:launchOptions];
  NSLog(@"------------------------------------- 2");
  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];
  NSLog(@"------------------------------------- 3");
  // Show splash screen (rn-splash-screen)
  [RCTSplashScreen show:rootView];
  NSLog(@"------------------------------------- 4");
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  
  UIViewController *rootViewController = [UIViewController new];
  NSLog(@"------------------------------------- 5");
  rootViewController.view = rootView;
  
  // We use the passthrough to init the Bluenet Lib iOS and to provide the viewcontroller to the lib
  ViewPassThrough *pass = [[ViewPassThrough alloc] initWithViewController: rootViewController];
  NSLog(@"------------------------------------- 6");
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}

@end
