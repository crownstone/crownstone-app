
//  bluenetIntegration.swift
//  Crownstone
//
//  Created by Alex de Mulder on 09/06/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

import Foundation
import BluenetLibIOS
import PromiseKit
import SwiftyJSON

var GLOBAL_BLUENET : ViewPassThrough?

typealias voidCallback = () -> Void

@objc open class ViewPassThrough : NSObject {
  open var bluenet : Bluenet!
  open var bluenetLocalization : BluenetLocalization!
  open var bluenetMotion : BluenetMotion!
  var subscriptions = [voidCallback]()
  
  init(viewController: UIViewController) {
    super.init()

    BluenetLibIOS.setBluenetGlobals(viewController: viewController, appName: "Crownstone", loggingFile: false, debugLogEnabled: false)

    self.bluenet = Bluenet()

    // do not use the accelerometer.
    // self.bluenetMotion = BluenetMotion()
    
    self.bluenet.setSettings(encryptionEnabled: true, adminKey: nil, memberKey: nil, guestKey: nil, referenceId: "unknown")
    self.bluenetLocalization = BluenetLocalization()
    

    GLOBAL_BLUENET = self
  }
  
  func bluenetOn(_ topic: String, _ callback: @escaping eventCallback) {
    self.subscriptions.append(self.bluenet.on(topic, callback))
  }
  
  func bluenetLocalizationOn(_ topic: String, _ callback: @escaping eventCallback) {
    self.subscriptions.append(self.bluenetLocalization.on(topic, callback))
  }
  
  deinit {
    print ("CLEANING UP!")
    
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
      print("----- BLUENET BRIDGE: Rerouting events")
      // forward the event streams to react native
      globalBluenet.bluenetOn("verifiedAdvertisementData", {data -> Void in
        if let castData = data as? Advertisement {
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
//      globalBluenet.bluenet.on("advertisementData", {data -> Void in
//        if let castData = data as? Advertisement {
//          self.bridge.eventDispatcher().sendAppEventWithName("advertisementData", body: castData.stringify())
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
      
      
      
      globalBluenet.bluenetLocalizationOn("enterRegion", {data -> Void in
        if let castData = data as? String {
          self.bridge.eventDispatcher().sendAppEvent(withName: "enterSphere", body: castData)
        }
      })
      globalBluenet.bluenetLocalizationOn("exitRegion", {data -> Void in
        if let castData = data as? String {
          self.bridge.eventDispatcher().sendAppEvent(withName: "exitSphere", body: castData)
        }
      })
      globalBluenet.bluenetLocalizationOn("enterLocation", {data -> Void in
        if let castData = data as? NSDictionary {
          self.bridge.eventDispatcher().sendAppEvent(withName: "enterLocation", body: castData)
        }
      })
      globalBluenet.bluenetLocalizationOn("exitLocation", {data -> Void in
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
      print("SETTING SETTINGS \(settings)")
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
  

  @objc func trackIBeacon(_ ibeaconUUID: String, referenceId: String) -> Void {
    print("tracking ibeacons with uuid: \(ibeaconUUID) for sphere: \(referenceId)")
    GLOBAL_BLUENET!.bluenetLocalization.trackIBeacon(uuid: ibeaconUUID, referenceId: referenceId)
  }
  
  @objc func stopTrackingIBeacon(_ ibeaconUUID: String) -> Void {
    GLOBAL_BLUENET!.bluenetLocalization.stopTrackingIBeacon(ibeaconUUID)
    print("stopIBeaconTracking ")
  }
  
  @objc func forceClearActiveRegion() -> Void {
    GLOBAL_BLUENET!.bluenetLocalization.forceClearActiveRegion()
    print("forceClearActiveRegion ")
  }
  
  
  
  @objc func pauseTracking() -> Void {
    GLOBAL_BLUENET!.bluenetLocalization.pauseTracking()
    print("stopIBeaconTracking ")
  }
  
  @objc func resumeTracking() -> Void {
    GLOBAL_BLUENET!.bluenetLocalization.resumeTracking()
    print("resumeIBeaconTracking ")
  }
  
  
  @objc func startCollectingFingerprint() -> Void {
    GLOBAL_BLUENET!.bluenetLocalization.startCollectingFingerprint()
    print("startCollectingFingerprint ")
  }
  
  @objc func abortCollectingFingerprint() -> Void {
    GLOBAL_BLUENET!.bluenetLocalization.abortCollectingFingerprint()
    print("abortCollectingFingerprint ")
  }
  
  @objc func pauseCollectingFingerprint() -> Void {
    GLOBAL_BLUENET!.bluenetLocalization.pauseCollectingFingerprint()
    print("pauseCollectingFingerprint ")
  }
  
  @objc func resumeCollectingFingerprint() -> Void {
    GLOBAL_BLUENET!.bluenetLocalization.resumeCollectingFingerprint()
    print("resumeCollectingFingerprint ")
  }
  
  
  @objc func finalizeFingerprint(_ sphereId: String, locationId: String) -> Void {
    GLOBAL_BLUENET!.bluenetLocalization.finalizeFingerprint(sphereId, locationId: locationId)
    print("finishCollectingFingerprint")
  }
  
  // this  has a callback so we can chain it in a promise. External calls are always async in RN, we need this to be done before loading new beacons.
  @objc func clearTrackedBeacons(_ callback: RCTResponseSenderBlock) -> Void {
    GLOBAL_BLUENET!.bluenetLocalization.clearTrackedBeacons()
    callback([["error" : false]])
  }
  
  
  @objc func getFingerprint(_ sphereId: String, locationId: String, callback: RCTResponseSenderBlock) -> Void {
    let fingerprint = GLOBAL_BLUENET!.bluenetLocalization.getFingerprint(sphereId, locationId: locationId)
    if let fingerprintData = fingerprint {
      callback([fingerprintData.stringify()])
    }
    else {
      callback([])
    }
    print("getFingerprint \(sphereId) \(locationId)")

  }
  
  
  @objc func loadFingerprint(_ sphereId: String, locationId: String, fingerprint: String) -> Void {
    let fingerprint = Fingerprint(stringifiedData: fingerprint)
    GLOBAL_BLUENET!.bluenetLocalization.loadFingerprint(referenceId: sphereId, locationId: locationId, fingerprint: fingerprint)
    print("loadFingerprint \(sphereId) \(locationId)")
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
  
  @objc func setupCrownstone(_ data: NSDictionary, callback: @escaping RCTResponseSenderBlock) -> Void {
    let crownstoneId      = data["crownstoneId"] as? NSNumber
    let adminKey          = data["adminKey"] as? String
    let memberKey         = data["memberKey"] as? String
    let guestKey          = data["guestKey"] as? String
    let meshAccessAddress = data["meshAccessAddress"] as? String
    let ibeaconUUID       = data["ibeaconUUID"] as? String
    let ibeaconMajor      = data["ibeaconMajor"] as? NSNumber
    let ibeaconMinor      = data["ibeaconMinor"] as? NSNumber
    
    print("data \(data) 1\(crownstoneId != nil) 2\(adminKey != nil) 3\(memberKey != nil) 4\(guestKey != nil)")
    print ("5\(meshAccessAddress != nil) 6\(ibeaconUUID != nil) 7\(ibeaconMajor != nil)  8\(ibeaconMinor != nil)")
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
  
}
