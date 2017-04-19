
//  bluenetIntegration.swift
//  Crownstone
//
//  Created by Alex de Mulder on 09/06/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

import Foundation
import PromiseKit
import SwiftyJSON

import BluenetLib
import BluenetShared
import BluenetBasicLocalization

let LOGGER = BluenetShared.LogClass(daysToStoreLogs: 3, logBaseFilename: "BridgeLog")

@objc open class ObjectiveCLogger : NSObject {
  @objc public class func logInfo(log: String) {
    LOGGER.info(log)
  }
}

var GLOBAL_BLUENET : Portal?

typealias voidCallback = () -> Void

@objc open class Portal : NSObject {
  open var bluenet : Bluenet!
  open var bluenetLocalization : BluenetLocalization!
  open var bluenetMotion : BluenetMotion!
  open var trainingHelper : TrainingHelper!
  var classifier : CrownstoneBasicClassifier!
  
  var subscriptions = [voidCallback]()
  
  init(viewController: UIViewController) {
    super.init()
    BluenetLib.setBluenetGlobals(viewController: viewController, appName: "Crownstone")
    
    self.classifier = CrownstoneBasicClassifier()
    
    self.bluenet = Bluenet()

    // do not use the accelerometer.
    // self.bluenetMotion = BluenetMotion()
    
    self.bluenet.setSettings(encryptionEnabled: true, adminKey: nil, memberKey: nil, guestKey: nil, referenceId: "unknown")
    self.bluenetLocalization = BluenetLocalization()
    
    // insert the classifier that will be used for room-level localization.
    self.bluenetLocalization.insertClassifier(classifier: self.classifier)
    
    self.trainingHelper = TrainingHelper(bluenetLocalization: self.bluenetLocalization)
    
    GLOBAL_BLUENET = self
  }
  
  func bluenetOn(_ topic: String, _ callback: @escaping eventCallback) {
    self.subscriptions.append(self.bluenet.on(topic, callback))
  }
  
  func bluenetLocalizationOn(_ topic: String, _ callback: @escaping eventCallback) {
    self.subscriptions.append(self.bluenetLocalization.on(topic, callback))
  }
  
  deinit {
    print("BluenetBridge: CLEANING UP!")
    
    // cleanup
    for unsubscribeCallback in self.subscriptions {
      unsubscribeCallback()
    }
  }
}

func getBleErrorString(_ err: BleError) -> String {
  switch(err) {
  case .DISCONNECTED:
    return "DISCONNECTED"
  case .CONNECTION_CANCELLED:
    return "CONNECTION_CANCELLED"
  case .NOT_CONNECTED:
    return "NOT_CONNECTED"
  case .NO_SERVICES:
    return "NO_SERVICES"
  case .NO_CHARACTERISTICS:
    return "NO_CHARACTERISTICS"
  case .SERVICE_DOES_NOT_EXIST:
    return "SERVICE_DOES_NOT_EXIST"
  case .CHARACTERISTIC_DOES_NOT_EXIST:
    return "CHARACTERISTIC_DOES_NOT_EXIST"
  case .WRONG_TYPE_OF_PROMISE:
    return "WRONG_TYPE_OF_PROMISE"
  case .INVALID_UUID:
    return "INVALID_UUID"
  case .NOT_INITIALIZED:
    return "NOT_INITIALIZED"
  case .CANNOT_SET_TIMEOUT_WITH_THIS_TYPE_OF_PROMISE:
    return "CANNOT_SET_TIMEOUT_WITH_THIS_TYPE_OF_PROMISE"
  case .TIMEOUT:
    return "TIMEOUT"
  case .DISCONNECT_TIMEOUT:
    return "DISCONNECT_TIMEOUT"
  case .CANCEL_PENDING_CONNECTION_TIMEOUT:
    return "CANCEL_PENDING_CONNECTION_TIMEOUT"
  case .CONNECT_TIMEOUT:
    return "CONNECT_TIMEOUT"
  case .GET_SERVICES_TIMEOUT:
    return "GET_SERVICES_TIMEOUT"
  case .GET_CHARACTERISTICS_TIMEOUT:
    return "GET_CHARACTERISTICS_TIMEOUT"
  case .READ_CHARACTERISTIC_TIMEOUT:
    return "READ_CHARACTERISTIC_TIMEOUT"
  case .WRITE_CHARACTERISTIC_TIMEOUT:
    return "WRITE_CHARACTERISTIC_TIMEOUT"
  case .ENABLE_NOTIFICATIONS_TIMEOUT:
    return "ENABLE_NOTIFICATIONS_TIMEOUT"
  case .DISABLE_NOTIFICATIONS_TIMEOUT:
    return "DISABLE_NOTIFICATIONS_TIMEOUT"
  case .CANNOT_WRITE_AND_VERIFY:
    return "CANNOT_WRITE_AND_VERIFY"
  case .CAN_NOT_CONNECT_TO_UUID:
    return "CAN_NOT_CONNECT_TO_UUID"
  case .INVALID_SESSION_DATA:
    return "INVALID_SESSION_DATA"
  case .NO_SESSION_NONCE_SET:
    return "NO_SESSION_NONCE_SET"
  case .COULD_NOT_VALIDATE_SESSION_NONCE:
    return "COULD_NOT_VALIDATE_SESSION_NONCE"
  case .INVALID_SIZE_FOR_ENCRYPTED_PAYLOAD:
    return "INVALID_SIZE_FOR_ENCRYPTED_PAYLOAD"
  case .INVALID_SIZE_FOR_SESSION_NONCE_PACKET:
    return "INVALID_SIZE_FOR_SESSION_NONCE_PACKET"
  case .INVALID_PACKAGE_FOR_ENCRYPTION_TOO_SHORT:
    return "INVALID_PACKAGE_FOR_ENCRYPTION_TOO_SHORT"
  case .INVALID_KEY_FOR_ENCRYPTION:
    return "INVALID_KEY_FOR_ENCRYPTION"
  case .DO_NOT_HAVE_ENCRYPTION_KEY:
    return "DO_NOT_HAVE_ENCRYPTION_KEY"
  case .COULD_NOT_ENCRYPT:
    return "COULD_NOT_ENCRYPT"
  case .COULD_NOT_ENCRYPT_KEYS_NOT_SET:
    return "COULD_NOT_ENCRYPT_KEYS_NOT_SET"
  case .COULD_NOT_DECRYPT_KEYS_NOT_SET:
    return "COULD_NOT_DECRYPT_KEYS_NOT_SET"
  case .COULD_NOT_DECRYPT:
    return "COULD_NOT_DECRYPT"
  case .CAN_NOT_GET_PAYLOAD:
    return "CAN_NOT_GET_PAYLOAD"
  case .USERLEVEL_IN_READ_PACKET_INVALID:
    return "USERLEVEL_IN_READ_PACKET_INVALID"
  case .READ_SESSION_NONCE_ZERO_MAYBE_ENCRYPTION_DISABLED:
    return "READ_SESSION_NONCE_ZERO_MAYBE_ENCRYPTION_DISABLED"
  case .NOT_IN_RECOVERY_MODE:
    return "NOT_IN_RECOVERY_MODE"
  case .CANNOT_READ_FACTORY_RESET_CHARACTERISTIC:
    return "CANNOT_READ_FACTORY_RESET_CHARACTERISTIC"
  case .RECOVER_MODE_DISABLED:
    return "RECOVER_MODE_DISABLED"
  default:
    return "UNKNOWN_BLE_ERROR \(err)"
  }
}

@objc(BluenetJS)
open class BluenetJS: NSObject {
  var bridge: RCTBridge!
  
  @objc func rerouteEvents() {
    if let globalBluenet = GLOBAL_BLUENET {
      print("BluenetBridge: ----- BLUENET BRIDGE: Rerouting events")
      // forward the event streams to react native
      globalBluenet.bluenetOn("verifiedAdvertisementData", {data -> Void in
        if let castData = data as? Advertisement {
//          print("VERIFIED \(castData.getDictionary())")
          if (castData.isSetupPackage()) {
            self.bridge.eventDispatcher().sendAppEvent(withName: "verifiedSetupAdvertisementData", body: castData.getDictionary())
          }
          else if (castData.isDFUPackage()) {
            self.bridge.eventDispatcher().sendAppEvent(withName: "verifiedDFUAdvertisementData", body: castData.getDictionary())
          }
          else {
            self.bridge.eventDispatcher().sendAppEvent(withName: "verifiedAdvertisementData", body: castData.getDictionary())
          }
          
          self.bridge.eventDispatcher().sendAppEvent(withName: "anyVerifiedAdvertisementData", body: castData.getDictionary())
        }
      })
      
      globalBluenet.bluenetOn("bleStatus", {data -> Void in
        if let castData = data as? String {
          self.bridge.eventDispatcher().sendAppEvent(withName: "bleStatus", body: castData)
        }
      })
      
//      we will not forward the unverified events
//      globalBluenet.bluenetOn("advertisementData", {data -> Void in
//        if let castData = data as? Advertisement {
//          print("BluenetBridge: advertisementData", castData.getDictionary())
//          self.bridge.eventDispatcher().sendAppEvent(withName: "advertisementData", body: castData.getDictionary())
//        }
//      })

      globalBluenet.bluenetOn("setupProgress", {data -> Void in
        if let castData = data as? NSNumber {
          self.bridge.eventDispatcher().sendAppEvent(withName: "setupProgress", body: castData)
        }
      })
      
      globalBluenet.bluenetOn("nearestSetupCrownstone", {data -> Void in
        if let castData = data as? NearestItem {
          self.bridge.eventDispatcher().sendAppEvent(withName: "nearestSetupCrownstone", body: castData.getDictionary())
        }
      })
      
      globalBluenet.bluenetOn("nearestCrownstone", {data -> Void in
        if let castData = data as? NearestItem {
          self.bridge.eventDispatcher().sendAppEvent(withName: "nearestCrownstone", body: castData.getDictionary())
        }
      })
      
      // forward the navigation event stream to react native
      globalBluenet.bluenetLocalizationOn("iBeaconAdvertisement", {ibeaconData -> Void in
        var returnArray = [NSDictionary]()
        if let data = ibeaconData as? [iBeaconPacket] {
          for packet in data {
            returnArray.append(packet.getDictionary())
          }
        }
        self.bridge.eventDispatcher().sendAppEvent(withName: "iBeaconAdvertisement", body: returnArray)
      })
      
//      globalBluenet.bluenetLocalizationOn("lowLevelEnterRegion", {data -> Void in
//        print("BluenetBridge: lowLevelEnterRegion")
//      })
//      globalBluenet.bluenetLocalizationOn("lowLevelExitRegion", {data -> Void in
//        print("BluenetBridge: lowLevelExitRegion")
//      })
      
      globalBluenet.bluenetLocalizationOn("enterRegion", {data -> Void in
//        print("BluenetBridge: enterRegion")
        if let castData = data as? String {
          self.bridge.eventDispatcher().sendAppEvent(withName: "enterSphere", body: castData)
        }
      })
      globalBluenet.bluenetLocalizationOn("exitRegion", {data -> Void in
//        print("BluenetBridge: exitRegion")
        if let castData = data as? String {
          self.bridge.eventDispatcher().sendAppEvent(withName: "exitSphere", body: castData)
        }
      })
      globalBluenet.bluenetLocalizationOn("enterLocation", {data -> Void in
//        print("BluenetBridge: enterLocation")
        if let castData = data as? NSDictionary {
          self.bridge.eventDispatcher().sendAppEvent(withName: "enterLocation", body: castData)
        }
      })
      globalBluenet.bluenetLocalizationOn("exitLocation", {data -> Void in
//        print("BluenetBridge: exitLocation")
        if let castData = data as? NSDictionary {
          self.bridge.eventDispatcher().sendAppEvent(withName: "exitLocation", body: castData)
        }
      })
      globalBluenet.bluenetLocalizationOn("currentLocation", {data -> Void in
        if let castData = data as? NSDictionary {
          self.bridge.eventDispatcher().sendAppEvent(withName: "currentLocation", body: castData)
        }
      })
     }
  }
  
  @objc func setSettings(_ settings: NSDictionary, callback: RCTResponseSenderBlock) {
    let adminKey  = settings["adminKey"]  as? String
    let memberKey = settings["memberKey"] as? String
    let guestKey  = settings["guestKey"]  as? String
    let referenceId = settings["referenceId"]  as? String
    
    if (adminKey == nil || memberKey == nil || guestKey == nil || referenceId == nil) {
      callback([["error" : true, "data": "Missing one of the Keys required for Bluenet Settings."]])
      return
    }
    
    if let encryptionEnabled = settings["encryptionEnabled"] as? Bool {
      let settings = BluenetSettings(encryptionEnabled: encryptionEnabled, adminKey: adminKey, memberKey: memberKey, guestKey: guestKey, referenceId: referenceId!)
      print("BluenetBridge: SETTING SETTINGS \(settings)")
      GLOBAL_BLUENET!.bluenet.setSettings(encryptionEnabled: encryptionEnabled, adminKey: adminKey, memberKey: memberKey, guestKey: guestKey, referenceId: referenceId!)
      callback([["error" : false]])
    }
    else {
      callback([["error" : true, "data": "Missing the encryptionEnabled data field required for Bluenet Settings."]])
    }
  }
  
  @objc func isReady(_ callback: @escaping RCTResponseSenderBlock) {
    GLOBAL_BLUENET!.bluenet.isReady()
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN isReady"]])
        }
      }
  }


  @objc func connect(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    GLOBAL_BLUENET!.bluenet.connect(handle)
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN connect \(err)"]])
        }
      }
  }
  
  @objc func phoneDisconnect(_ callback: @escaping RCTResponseSenderBlock) {
    GLOBAL_BLUENET!.bluenet.disconnect()
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN phoneDisconnect \(err)"]])
        }
      }
  }
  
  @objc func disconnect(_ callback: @escaping RCTResponseSenderBlock) {
    GLOBAL_BLUENET!.bluenet.control.disconnect()
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN disconnect \(err)"]])
        }
      }
  }
  
  @objc func setSwitchState(_ state: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    GLOBAL_BLUENET!.bluenet.control.setSwitchState(state.floatValue)
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN setSwitchState \(err)"]])
        }
      }
  }
  
  @objc func keepAliveState(_ changeState: NSNumber, state: NSNumber, timeout: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    var changeStateBool = false
    if (changeState.intValue > 0) {
      changeStateBool = true
    }
    
    GLOBAL_BLUENET!.bluenet.control.keepAliveState(changeState: changeStateBool, state: state.floatValue, timeout: timeout.uint16Value)
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN keepAliveState \(err)"]])
        }
    }
  }
  
  @objc func keepAlive(_ callback: @escaping RCTResponseSenderBlock) {
    GLOBAL_BLUENET!.bluenet.control.keepAlive()
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN keepAliveState \(err)"]])
        }
    }
  }
  
  
  @objc func startScanning() {
    GLOBAL_BLUENET!.bluenet.startScanning()
  }
  
  @objc func startScanningForCrownstones() {
    GLOBAL_BLUENET!.bluenet.startScanningForCrownstones()
  }
  
  @objc func startScanningForCrownstonesUniqueOnly() {
    GLOBAL_BLUENET!.bluenet.startScanningForCrownstonesUniqueOnly()
  }
  
  @objc func stopScanning() {
    GLOBAL_BLUENET!.bluenet.stopScanning()
  }
  
  @objc func startIndoorLocalization() {
    GLOBAL_BLUENET!.bluenetLocalization.startIndoorLocalization()
  }
  
  @objc func stopIndoorLocalization() {
    GLOBAL_BLUENET!.bluenetLocalization.stopIndoorLocalization()
  }
  
  @objc func quitApp() {
    exit(0)
  }
  
  
  @objc func requestLocation(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    let coordinates = GLOBAL_BLUENET!.bluenetLocalization.requestLocation()
    var returnType = [String: NSNumber]();
    returnType["latitude"] = NSNumber(value: coordinates.latitude)
    returnType["longitude"] = NSNumber(value: coordinates.longitude)
    
    callback([["error" : false, "data": returnType]])
  }
  
  @objc func requestLocationPermission() -> Void {
    print("BluenetBridge: Requesting Permission")
    GLOBAL_BLUENET!.bluenetLocalization.requestLocationPermission()
  }
  
  @objc func trackIBeacon(_ ibeaconUUID: String, sphereId: String) -> Void {
    print("BluenetBridge: tracking ibeacons with uuid: \(ibeaconUUID) for sphere: \(sphereId)")
    GLOBAL_BLUENET!.bluenetLocalization.trackIBeacon(uuid: ibeaconUUID, referenceId: sphereId)
  }
  
  @objc func stopTrackingIBeacon(_ ibeaconUUID: String) -> Void {
    print("BluenetBridge: stopIBeaconTracking ")
    GLOBAL_BLUENET!.bluenetLocalization.stopTrackingIBeacon(ibeaconUUID)
    
  }
  
  @objc func forceClearActiveRegion() -> Void {
    print("BluenetBridge: forceClearActiveRegion ")
    GLOBAL_BLUENET!.bluenetLocalization.forceClearActiveRegion()
  }
  
  @objc func pauseTracking() -> Void {
    print("BluenetBridge: stopIBeaconTracking ")
    GLOBAL_BLUENET!.bluenetLocalization.pauseTracking()
  }
  
  @objc func resumeTracking() -> Void {
    print("BluenetBridge: resumeIBeaconTracking ")
    GLOBAL_BLUENET!.bluenetLocalization.resumeTracking()
  }
  
  @objc func startCollectingFingerprint() -> Void {
    print("BluenetBridge: startCollectingFingerprint ")
    
    // abort collecting fingerprint if it is currently happening.
    GLOBAL_BLUENET!.trainingHelper.abortCollectingTrainingData()
    
    // start collection
    GLOBAL_BLUENET!.trainingHelper.startCollectingTrainingData()
  }
  
  @objc func abortCollectingFingerprint() -> Void {
    print("BluenetBridge: abortCollectingFingerprint ")
    GLOBAL_BLUENET!.trainingHelper.abortCollectingTrainingData()
  }
  
  @objc func pauseCollectingFingerprint() -> Void {
    print("BluenetBridge: pauseCollectingFingerprint ")
    GLOBAL_BLUENET!.trainingHelper.pauseCollectingTrainingData()
  }
  
  @objc func resumeCollectingFingerprint() -> Void {
    print("BluenetBridge: resumeCollectingFingerprint ")
    GLOBAL_BLUENET!.trainingHelper.resumeCollectingTrainingData()
  }
  
  
  @objc func finalizeFingerprint(_ sphereId: String, locationId: String, callback: RCTResponseSenderBlock) -> Void {
    print("BluenetBridge: finishCollectingFingerprint")
    
    let stringifiedFingerprint = GLOBAL_BLUENET!.trainingHelper.finishCollectingTrainingData()
    
    if (stringifiedFingerprint != nil) {
      GLOBAL_BLUENET!.classifier.loadTrainingData(locationId, referenceId: sphereId, trainingData: stringifiedFingerprint!)
      callback([["error" : false, "data": stringifiedFingerprint!]])
    }
    else {
      callback([["error" : true, "data": "No samples collected"]])
    }
  }
  
  // this  has a callback so we can chain it in a promise. External calls are always async in RN, we need this to be done before loading new beacons.
  @objc func clearTrackedBeacons(_ callback: RCTResponseSenderBlock) -> Void {
    print("BluenetBridge: clearTrackedBeacons")
    GLOBAL_BLUENET!.bluenetLocalization.clearTrackedBeacons()
    
    callback([["error" : false]])
  }
  
  
  @objc func loadFingerprint(_ sphereId: String, locationId: String, fingerprint: String) -> Void {
    print("BluenetBridge: loadFingerprint \(sphereId) \(locationId)")
    
    GLOBAL_BLUENET!.classifier.loadTrainingData(locationId, referenceId: sphereId, trainingData: fingerprint)
  }
  
  
  @objc func commandFactoryReset(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    GLOBAL_BLUENET!.bluenet.control.commandFactoryReset()
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN recover"]])
        }
      }
  }
  
  
  
  @objc func getFirmwareVersion(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    GLOBAL_BLUENET!.bluenet.device.getFirmwareRevision()
      .then{(firmwareVersion : String) -> Void in callback([["error" : false, "data": firmwareVersion]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN getFirmwareVersion"]])
        }
    }
  }

  
  @objc func getMACAddress(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    GLOBAL_BLUENET!.bluenet.setup.getMACAddress()
      .then{(macAddress : String) -> Void in callback([["error" : false, "data": macAddress]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN getMACAddress"]])
        }
      }
  }
  
  @objc func recover(_ crownstoneHandle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    GLOBAL_BLUENET!.bluenet.control.recoverByFactoryReset(crownstoneHandle)
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN recover"]])
        }
      }
  }
  
  @objc func enableLoggingToFile(_ enableLogging: NSNumber) -> Void {
    if (enableLogging.boolValue == true) {
      BluenetLib.LOG.cleanLogs()
      BluenetLib.LOG.setFileLevel(.INFO)
      BluenetLib.LOG.setPrintLevel(.INFO)
      
      LOGGER.cleanLogs()
      LOGGER.setFileLevel(.INFO)
      LOGGER.setPrintLevel(.INFO)
    }
    else {
      BluenetLib.LOG.setFileLevel(.NONE)
      BluenetLib.LOG.clearLogs()
      BluenetLib.LOG.setPrintLevel(.INFO)
      
      LOGGER.setFileLevel(.NONE)
      LOGGER.clearLogs()
      LOGGER.setPrintLevel(.INFO)
    }
  }
  
  @objc func clearLogs() -> Void {
    BluenetLib.LOG.clearLogs()
    LOGGER.clearLogs()
  }
  
  @objc func setupCrownstone(_ data: NSDictionary, callback: @escaping RCTResponseSenderBlock) -> Void {
    let crownstoneId      = data["crownstoneId"] as? NSNumber
    let adminKey          = data["adminKey"] as? String
    let memberKey         = data["memberKey"] as? String
    let guestKey          = data["guestKey"] as? String
    let meshAccessAddress = data["meshAccessAddress"] as? String
    let ibeaconUUID       = data["ibeaconUUID"] as? String
    let ibeaconMajor      = data["ibeaconMajor"] as? NSNumber
    let ibeaconMinor      = data["ibeaconMinor"] as? NSNumber
    
    print("BluenetBridge: data \(data) 1\(crownstoneId != nil) 2\(adminKey != nil) 3\(memberKey != nil) 4\(guestKey != nil)")
    print("BluenetBridge: 5\(meshAccessAddress != nil) 6\(ibeaconUUID != nil) 7\(ibeaconMajor != nil)  8\(ibeaconMinor != nil)")
    if (crownstoneId != nil &&
      adminKey != nil &&
      memberKey != nil &&
      guestKey != nil &&
      meshAccessAddress != nil &&
      ibeaconUUID != nil &&
      ibeaconMajor != nil &&
      ibeaconMinor != nil) {
      GLOBAL_BLUENET!.bluenet.setup.setup(
        crownstoneId: (crownstoneId!).uint16Value,
        adminKey: adminKey!,
        memberKey: memberKey!,
        guestKey: guestKey!,
        meshAccessAddress: meshAccessAddress!,
        ibeaconUUID: ibeaconUUID!,
        ibeaconMajor: (ibeaconMajor!).uint16Value,
        ibeaconMinor: (ibeaconMinor!).uint16Value)
        .then{_ in callback([["error" : false]])}
        .catch{err in
          if let bleErr = err as? BleError {
            callback([["error" : true, "data": getBleErrorString(bleErr)]])
          }
          else {
            callback([["error" : true, "data": "UNKNOWN ERROR IN setupCrownstone \(err)"]])
          }
        }
    }
    else {
      callback([["error" : true, "data": "Missing one of the datafields required for setup."]])
    }
  }
  
  @objc func meshKeepAlive(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    GLOBAL_BLUENET!.bluenet.mesh.keepAlive()
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN meshKeepAlive \(err)"]])
        }
    }
  }
  
  @objc func meshKeepAliveState(_ timeout: NSNumber, stoneKeepAlivePackets: [NSDictionary], callback: @escaping RCTResponseSenderBlock) -> Void {
//    print("-- Firing meshKeepAliveState timeout: \(timeout), packets: \(stoneKeepAlivePackets)")
    GLOBAL_BLUENET!.bluenet.mesh.keepAliveState(timeout: timeout.uint16Value, stones: stoneKeepAlivePackets as! [[String : NSNumber]])
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN meshKeepAliveState \(err)"]])
        }
    }
  }
  
  @objc func meshCommandSetSwitchState(_ crownstoneIds: [NSNumber], state: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
//    print("-- Firing meshCommandSetSwitchState crownstoneIds: \(crownstoneIds), state: \(state), intent: \(intent)")
    GLOBAL_BLUENET!.bluenet.mesh.meshCommandSetSwitchState(crownstoneIds: crownstoneIds as [UInt16], state: state.floatValue)
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN meshKeepAliveState \(err)"]])
        }
    }
  }
  
  @objc func multiSwitch(_ arrayOfStoneSwitchPackets: [NSDictionary], callback: @escaping RCTResponseSenderBlock) -> Void {
//    print("-- Firing multiSwitch arrayOfStoneSwitchPackets: \(arrayOfStoneSwitchPackets)")
    GLOBAL_BLUENET!.bluenet.mesh.multiSwitch(stones: arrayOfStoneSwitchPackets as! [[String : NSNumber]])
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN meshKeepAliveState \(err)"]])
        }
    }
  }
  
}
