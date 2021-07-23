//
//  AppDelegate.swift
//  Crownstone
//
//  Created by Alex de Mulder on 28/03/2019.
//  Copyright © 2019 Crownstone. All rights reserved.
//

import Foundation
import UIKit
import Embrace

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        print("LaunchOps", launchOptions)
        Embrace.sharedInstance().start(launchOptions: launchOptions)
        Embrace.sharedInstance().setCleanLogsEnabled(true)
        
        #if CS_DEBUG
            print("DEBUG")
            let jsBundleUrl =  RCTBundleURLProvider.sharedSettings()?.jsBundleURL(forBundleRoot: "index", fallbackResource: nil)
            print("BUNDLE URL", jsBundleUrl)
        #else
            print("RELEASE")
            let jsBundleUrl =  Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif

        ReactNativeNavigation.bootstrap(jsBundleUrl!, launchOptions: launchOptions)
        
        GLOBAL_BLUENET.initController(viewController: nil)

        RNSplashScreen.show()        

        return true
    }
    
    
    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
        LOGGER.info("applicationWillResignActive");
    }
    
    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
        LOGGER.info("applicationDidEnterBackground");
        GLOBAL_BLUENET.applicationDidEnterBackground();
    }
    
    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background.
        LOGGER.info("applicationWillEnterForeground");
        GLOBAL_BLUENET.applicationWillEnterForeground();
    }
    
    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
        LOGGER.info("applicationDidBecomeActive");
    }
    
    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
        LOGGER.info("applicationWillTerminate");
    }
    
    func applicationDidReceiveMemoryWarning(_ application: UIApplication) {
        LOGGER.info("applicationDidReceiveMemoryWarning");
    }
    
    func application(_ application: UIApplication, didRegister notificationSettings: UIUserNotificationSettings) {
        RNCPushNotificationIOS.didRegister(notificationSettings)
    }
    
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        RNCPushNotificationIOS.didRegisterForRemoteNotifications(withDeviceToken: deviceToken)
    }
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        RNCPushNotificationIOS.didFailToRegisterForRemoteNotificationsWithError(error)
    }

    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        RNCPushNotificationIOS.didReceiveRemoteNotification(userInfo, fetchCompletionHandler: completionHandler)
    }

    func application(_ application: UIApplication, didReceive notification: UILocalNotification) {
        RNCPushNotificationIOS.didReceive(notification)
    }
    
    // required to hook web urls
    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return GLOBAL_BLUENET.parseUserActivity(userActivity: userActivity)
    }
    
    #if RCT_DEV
    func bridge(bridge: RCTBridge, didNotFindModule: String) {
      return YES;
    }
    #endif
}
