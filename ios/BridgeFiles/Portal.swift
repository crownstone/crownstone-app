//
//  Portal.swift
//  Crownstone
//
//  Created by Alex de Mulder on 21/11/2017.
//  Copyright © 2017 Crownstone. All rights reserved.
//
import Foundation
import PromiseKit
import SwiftyJSON

import BluenetLib
import BluenetShared

import WatchConnectivity

let GLOBAL_BLUENET = BluenetContainer()

typealias voidCallback = () -> Void

class BluenetContainer : NSObject {
  open var bluenet : Bluenet!
  open var bluenetLocalization : BluenetLocalization!
  open var bluenetMotion : BluenetMotion!
  open var trainingHelper : TrainingHelper!

  open var launchArguments = [String: String]()
  
  var watchStateManager: WatchStateManager!
  
  var localization : Localization!
  
  open var devEnvironment = false
  var watchBridge : WatchBridge!
  
  var subscriptions = [voidCallback]()
  var nearestSubscriptions = [voidCallback]()
  var unverifiedSubscriptions = [voidCallback]()
    
  override init() {

    self.watchBridge = WatchBridge()
    self.watchStateManager = WatchStateManager()
    
    self.localization = Localization()
    
    BluenetLib.setBluenetGlobals(appName: "Crownstone")
    
    BluenetLib.LOG.setTimestampPrinting(newState: true)
    
    self.bluenet = Bluenet(backgroundEnabled: true)
    
    // use the accelerometer.
    // self.bluenetMotion = BluenetMotion()
    
    self.bluenetLocalization = BluenetLocalization(backgroundEnabled: true)
    
    self.trainingHelper = TrainingHelper(bluenetLocalization: self.bluenetLocalization)
    
    // store the environment so the app can request it. This is used to determine which notification key we should use in our installation model in the cloud.
    #if DEBUG
      self.devEnvironment = true
    #else
      self.devEnvironment = false
    #endif
    
    #if CS_DEBUG
      self.devEnvironment = true
    #endif
    
  }
  
  func subscribedToNearest() -> Bool {
    return self.nearestSubscriptions.count > 0
  }
  func subscribedToUnverified() -> Bool {
    return self.unverifiedSubscriptions.count > 0
  }
  func bluenetOnNearest(_ topic: String, _ callback: @escaping eventCallback) {
    self.nearestSubscriptions.append(self.bluenet.on(topic, callback))
  }
  
  func bluenetClearNearest() {
    for unsubscribeCallback in self.nearestSubscriptions {
      unsubscribeCallback()
    }
    self.nearestSubscriptions = []
  }
  
  func bluenetClearUnverified() {
    for unsubscribeCallback in self.unverifiedSubscriptions {
      unsubscribeCallback()
    }
    self.unverifiedSubscriptions = []
  }
  
  func bluenetOnUnverified(_ topic: String, _ callback: @escaping eventCallback) {
    self.unverifiedSubscriptions.append(self.bluenet.on(topic, callback))
  }
  
  func bluenetOn(_ topic: String, _ callback: @escaping eventCallback) {
    self.subscriptions.append(self.bluenet.on(topic, callback))
  }
  
  func bluenetLocalizationOn(_ topic: String, _ callback: @escaping eventCallback) {
    self.subscriptions.append(self.bluenetLocalization.on(topic, callback))
  }
  
  func localizationOn(_ topic: String, _ callback: @escaping eventCallback) {
    self.subscriptions.append(self.localization.eventBus.on(topic, callback))
  }
  
  open func applicationDidEnterBackground() {
    // check if we have to use this to stop the scanning in the background
    self.bluenet.applicationDidEnterBackground()
    //self.bluenetLocalization.applicationDidEnterBackground()
  }
  
  open func applicationWillEnterForeground() {
    // check if we have to use this to stop the scanning in the background
     self.bluenet.applicationWillEnterForeground()
    // self.bluenetLocalization.applicationWillEnterForeground()
  }
  
  open func parseUserActivity(userActivity: NSUserActivity) -> Bool {
    if (userActivity.activityType == NSUserActivityTypeBrowsingWeb) {
      if let url = userActivity.webpageURL {
        AppEventBus.emit("callbackUrlInvoked", url.absoluteString)
        return true
      }
    }
    return false
  }
  
  deinit {
    print("BluenetBridge: CLEANING UP!")
    
    // cleanup
    for unsubscribeCallback in self.subscriptions {
      unsubscribeCallback()
    }
    
    for unsubscribeCallback in self.nearestSubscriptions {
      unsubscribeCallback()
    }
    
    for unsubscribeCallback in self.unverifiedSubscriptions {
      unsubscribeCallback()
    }
  }
}



@objc class Portal : NSObject {

  @objc func applicationWillResignActive() {
      // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
      // Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
      LOGGER.info("applicationWillResignActive");
  }

  @objc func applicationDidEnterBackground() {
      // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
      // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
      LOGGER.info("applicationDidEnterBackground");
      GLOBAL_BLUENET.applicationDidEnterBackground();
  }

  @objc func applicationWillEnterForeground() {
      // Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background.
      LOGGER.info("applicationWillEnterForeground");
      GLOBAL_BLUENET.applicationWillEnterForeground();
  }

  @objc func applicationDidBecomeActive() {
      // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
      LOGGER.info("applicationDidBecomeActive");
  }

  @objc func applicationWillTerminate() {
      // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
      LOGGER.info("applicationWillTerminate");
  }

  @objc func applicationDidReceiveMemoryWarning() {
      LOGGER.info("applicationDidReceiveMemoryWarning");
  }

  // required to hook web urls
  @objc func handleUserActivity(_ userActivity: NSUserActivity) -> Bool {
      return GLOBAL_BLUENET.parseUserActivity(userActivity: userActivity)
  }
  
  @objc func setLaunchArguments(_ arguments: [String])  {
    var map = [String: String]()
    var prevValue = ""
    for thing in arguments {
      if (thing == "--args") { continue }
      if (prevValue.starts(with: "-")) {
        map[prevValue.replacingOccurrences(of: "-", with:"")] = thing
      }
      prevValue = thing;
    }
    
    GLOBAL_BLUENET.launchArguments = map
  }
}




//func isDevelopmentEnvironment() -> Bool {
//  guard let filePath = Bundle.main.path(forResource: "embedded", ofType:"mobileprovision") else {
//    return false
//  }
//  do {
//    let url = URL(fileURLWithPath: filePath)
//    let data = try Data(contentsOf: url)
//    guard let string = String(data: data, encoding: .ascii) else {
//      return false
//    }
//    if string.contains("<key>aps-environment</key>\n\t\t<string>development</string>") {
//      return true
//    }
//  } catch {}
//  return false
//}


class WatchBridge: NSObject, WCSessionDelegate {
  var watchSupported : Bool = false
  
  override init() {
    super.init()
    if (WCSession.isSupported()) {
        let session = WCSession.default
        session.delegate = self
        watchSupported = true
        print("Activating Session on iosApp")
        session.activate()
    }
  }

  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    print("Session. activationDidCompleteWith", activationState)
  }
  
  func sessionDidBecomeInactive(_ session: WCSession) {
    print("sessionDidBecomeInactive")
  }
  
  public func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String : Any]) {
    print("didReceiveApplicationContext",applicationContext)
  }
  
  func sessionDidDeactivate(_ session: WCSession) {
    print("sessionDidDeactivate")
  }
  
  
  public func sessionReachabilityDidChange(_ session: WCSession) {
    print("sessionReachabilityDidChange")
  }
  
  
  /** Called on the delegate of the receiver. Will be called on startup if the incoming message caused the receiver to launch. */
  public func session(_ session: WCSession, didReceiveMessage message: [String : Any]){
    print("didReceiveMessage")
  }
  
  
  /** Called on the delegate of the receiver when the sender sends a message that expects a reply. Will be called on startup if the incoming message caused the receiver to launch. */
  public func session(_ session: WCSession, didReceiveMessage message: [String : Any], replyHandler: @escaping ([String : Any]) -> Void){
    print("didReceiveMessage")
  }
  
  
  /** Called on the delegate of the receiver. Will be called on startup if the incoming message data caused the receiver to launch. */
  public func session(_ session: WCSession, didReceiveMessageData messageData: Data){
    print("didReceiveMessageData")
  }
  
  
  /** Called on the delegate of the receiver when the sender sends message data that expects a reply. Will be called on startup if the incoming message data caused the receiver to launch. */
  public func session(_ session: WCSession, didReceiveMessageData messageData: Data, replyHandler: @escaping (Data) -> Void){
    print("didReceiveMessageData")
  }
}


