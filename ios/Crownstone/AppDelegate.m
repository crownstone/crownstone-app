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
#import "RCTSplashScreen.h"
#import "Crownstone-Swift.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  NSURL *jsCodeLocation;

  jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index.ios" fallbackResource:nil];

  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"Crownstone"
                                               initialProperties:nil
                                                   launchOptions:launchOptions];
  rootView.backgroundColor = [[UIColor alloc] initWithRed:0.0f green:0.149f blue:0.243f alpha:1];
  
  // Show splash screen (rn-splash-screen)
  [RCTSplashScreen show:rootView];
  
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  
  // We use the passthrough to init the Bluenet Lib iOS and to provide the viewcontroller to the lib
  ViewPassThrough *pass = [[ViewPassThrough alloc] initWithViewController: rootViewController];
  
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}

- (void)applicationWillResignActive:(UIApplication *)application
{
  // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
  // Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
  NSString *date = [NSString stringWithFormat:@"%f", [[NSDate init] timeIntervalSince1970]];
  NSString *message = [NSString stringWithFormat:@"%@/%@/", date, @" applicationWillResignActive"];
  appendToFile(message);
}

- (void)applicationWillTerminate:(UIApplication *)application
{
  // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
  NSString *date = [NSString stringWithFormat:@"%f", [[NSDate init] timeIntervalSince1970]];
  NSString *message = [NSString stringWithFormat:@"%@/%@/", date, @" applicationWillTerminate"];
  appendToFile(message);
}


- (void)applicationDidEnterBackground:(UIApplication *)application
{
  NSString *date = [NSString stringWithFormat:@"%f", [[NSDate init] timeIntervalSince1970]];
  NSString *message = [NSString stringWithFormat:@"%@/%@/", date, @" applicationDidEnterBackground"];
  appendToFile(message);
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
  NSString *date = [NSString stringWithFormat:@"%f", [[NSDate init] timeIntervalSince1970]];
  NSString *message = [NSString stringWithFormat:@"%@/%@/", date, @" applicationWillEnterForeground"];
  appendToFile(message);
}

void appendToFile(NSString *msg){
  NSLog(@"%@", msg);
  // get path to Documents/somefile.txt
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  NSString *documentsDirectory = [paths objectAtIndex:0];
  NSString *path = [documentsDirectory stringByAppendingPathComponent:@"logfile.txt"];
  // create if needed
  if (![[NSFileManager defaultManager] fileExistsAtPath:path]){
    fprintf(stderr,"Creating file at %s",[path UTF8String]);
    [[NSData data] writeToFile:path atomically:YES];
  }
  // append
  NSFileHandle *handle = [NSFileHandle fileHandleForWritingAtPath:path];
  [handle truncateFileAtOffset:[handle seekToEndOfFile]];
  [handle writeData:[msg dataUsingEncoding:NSUTF8StringEncoding]];
  [handle closeFile];
}


@end
