
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


@objc public class ViewPassThrough : NSObject {
  public var bluenet : Bluenet!
  public var bluenetLocalization : BluenetLocalization!
  
  init(viewController: UIViewController) {
    super.init()
    

    BluenetLibIOS.setBluenetGlobals(viewController: viewController, appName: "Crownstone")

    self.bluenet = Bluenet();
    
    let defaultSettings = BluenetSettings(encryptionEnabled: true, adminKey: nil, memberKey: nil, guestKey: nil)
    self.bluenet.setSettings(defaultSettings);
    self.bluenetLocalization = BluenetLocalization();
    

    GLOBAL_BLUENET = self
  }
}

func getBleErrorString(err: BleError) -> String {
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
  default:
     return "UNKNOWN_BLE_ERROR \(err)"
  }
}


@objc(BluenetJS)
class BluenetJS: NSObject {
  
  var bridge: RCTBridge!
  

  @objc func rerouteEvents() {
    if let globalBluenet = GLOBAL_BLUENET {
      // forward the event streams to react native
      globalBluenet.bluenet.on("verifiedAdvertisementData", {data -> Void in
        if let castData = data as? Advertisement {
          self.bridge.eventDispatcher().sendAppEventWithName("verifiedAdvertisementData", body: castData.stringify())
        }
      })
      
      // forward the event streams to react native
      globalBluenet.bluenet.on("advertisementData", {data -> Void in
        if let castData = data as? Advertisement {
          self.bridge.eventDispatcher().sendAppEventWithName("advertisementData", body: castData.stringify())
        }
      })

      globalBluenet.bluenet.on("nearestSetupCrownstone", {data -> Void in
        if let castData = data as? NearestItem {
          self.bridge.eventDispatcher().sendAppEventWithName("nearestSetupCrownstone", body: castData.stringify())
        }
      })
      
      globalBluenet.bluenet.on("nearestCrownstone", {data -> Void in
        if let castData = data as? NearestItem {
          self.bridge.eventDispatcher().sendAppEventWithName("nearestCrownstone", body: castData.stringify())
        }
      })
      
      // forward the navigation event stream to react native
      globalBluenet.bluenetLocalization.on("iBeaconAdvertisement", {ibeaconData -> Void in
        var returnArray = [String]()
        if let data = ibeaconData as? [iBeaconPacket] {
          for packet in data {
            returnArray.append(packet.stringify())
          }
        }
        self.bridge.eventDispatcher().sendAppEventWithName("iBeaconAdvertisement", body: returnArray)
      })
      
     
      
      globalBluenet.bluenetLocalization.on("enterRegion", {data -> Void in
        if let castData = data as? String {
          self.bridge.eventDispatcher().sendAppEventWithName("enterGroup", body: castData)
        }
      })
      globalBluenet.bluenetLocalization.on("exitRegion", {data -> Void in
        if let castData = data as? String {
          self.bridge.eventDispatcher().sendAppEventWithName("exitGroup", body: castData)
        }
      })
      globalBluenet.bluenetLocalization.on("enterLocation", {data -> Void in
        if let castData = data as? String {
          self.bridge.eventDispatcher().sendAppEventWithName("enterLocation", body: castData)
        }
      })
      globalBluenet.bluenetLocalization.on("exitLocation", {data -> Void in
        if let castData = data as? String {
          self.bridge.eventDispatcher().sendAppEventWithName("exitLocation", body: castData)
        }
      })
      globalBluenet.bluenetLocalization.on("currentLocation", {data -> Void in
        if let castData = data as? String {
          self.bridge.eventDispatcher().sendAppEventWithName("currentLocation", body: castData)
        }
      })
     }
  }
  
  @objc func setSettings(configJSON: String, callback: RCTResponseSenderBlock) {
    let data = JSON.parse(configJSON);
    let encryptionEnabled = data["encryptionEnabled"].bool
    let adminKey          = data["adminKey"].string
    let memberKey         = data["memberKey"].string
    let guestKey          = data["guestKey"].string
    
    if (encryptionEnabled != nil && adminKey != nil && memberKey != nil && guestKey != nil) {
      let settings = BluenetSettings(encryptionEnabled: encryptionEnabled!, adminKey: adminKey!, memberKey: memberKey!, guestKey: guestKey!)
      GLOBAL_BLUENET!.bluenet.setSettings(settings)
      callback([["error" : false]])
    }
    else {
      callback([["error" : true, "data": "Missing one of the datafields required for setup."]])
    }
  }
  
  @objc func isReady(callback: RCTResponseSenderBlock) {
    GLOBAL_BLUENET!.bluenet.isReady()
      .then({_ in callback([["error" : false]])})
      .error({err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN isReady"]])
        }
      })
  }


  @objc func connect(uuid: String, callback: RCTResponseSenderBlock) {
    GLOBAL_BLUENET!.bluenet.connect(uuid)
      .then({_ in callback([["error" : false]])})
      .error({err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN connect \(err)"]])
        }
      })
  }
  
  @objc func phoneDisconnect(callback: RCTResponseSenderBlock) {
    GLOBAL_BLUENET!.bluenet.disconnect()
      .then({_ in callback([["error" : false]])})
      .error({err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN phoneDisconnect \(err)"]])
        }
      })
  }
  
  @objc func disconnect(callback: RCTResponseSenderBlock) {
    GLOBAL_BLUENET!.bluenet.control.disconnect()
      .then({_ in callback([["error" : false]])})
      .error({err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN disconnect \(err)"]])
        }
      })
  }
  
  @objc func setSwitchState(state: NSNumber, callback: RCTResponseSenderBlock) {
    GLOBAL_BLUENET!.bluenet.control.setSwitchState(state.floatValue)
      .then({_ in callback([["error" : false]])})
      .error({err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN setSwitchState \(err)"]])
        }
      })
  }
  
  
  @objc func startScanning() {
    GLOBAL_BLUENET!.bluenet.startScanning()
  }
  
  @objc func startScanningForCrownstones() {
    GLOBAL_BLUENET!.bluenet.startScanningForCrownstones()
  }
  
  @objc func startScanning(serviceId: String) {
    GLOBAL_BLUENET!.bluenet.startScanningForService(serviceId)
  }
  
  @objc func stopScanning() {
    GLOBAL_BLUENET!.bluenet.stopScanning()
  }
  

  @objc func trackIBeacon(groupUUID: String, groupId: String) -> Void {
    print("tracking ibeacons with uuid: \(groupUUID) for group: \(groupId)")
    GLOBAL_BLUENET!.bluenetLocalization.trackIBeacon(groupUUID, groupId: groupId)
  }
  
  @objc func stopIBeaconTracking() -> Void {
    GLOBAL_BLUENET!.bluenetLocalization.stopTracking()
    print("stopIBeaconTracking ")
  }
  
  @objc func resumeIBeaconTracking() -> Void {
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
  
  
  @objc func finalizeFingerprint(groupId: String, locationId: String) -> Void {
    GLOBAL_BLUENET!.bluenetLocalization.finalizeFingerprint(groupId, locationId: locationId)
    print("finishCollectingFingerprint")
  }
  
  
  @objc func clearTrackedBeacons(callback: RCTResponseSenderBlock) -> Void {
    GLOBAL_BLUENET!.bluenetLocalization.clearTrackedBeacons()
    callback([["error" : false]])
    print("finishCollectingFingerprint")
  }
  
  
  @objc func getFingerprint(groupId: String, locationId: String, callback: RCTResponseSenderBlock) -> Void {
    let fingerprint = GLOBAL_BLUENET!.bluenetLocalization.getFingerprint(groupId, locationId: locationId)
    if let fingerprintData = fingerprint {
      callback([fingerprintData.stringify()])
    }
    else {
      callback([])
    }
    print("getFingerprint \(groupId) \(locationId)")

  }
  
  
  @objc func loadFingerprint(groupId: String, locationId: String, fingerprint: String) -> Void {
    let fingerprint = Fingerprint(stringifiedData: fingerprint)
    GLOBAL_BLUENET!.bluenetLocalization.loadFingerprint(groupId, locationId: locationId, fingerprint: fingerprint)
    print("loadFingerprint \(groupId) \(locationId)")
  }
  
  
  @objc func factoryReset(callback: RCTResponseSenderBlock) -> Void {
    GLOBAL_BLUENET!.bluenet.control.commandFactoryReset()
      .then({_ in callback([["error" : false]])})
      .error({err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN recover"]])
        }
      })
  }
  
  
  @objc func getMACAddress(callback: RCTResponseSenderBlock) -> Void {
    GLOBAL_BLUENET!.bluenet.setup.getMACAddress()
      .then({(macAddress : String) -> Void in callback([["error" : false, "data": macAddress]])})
      .error({err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN getMACAddress"]])
        }
      })
  }
  
  @objc func recover(crownstoneUUID: String, callback: RCTResponseSenderBlock) -> Void {
    GLOBAL_BLUENET!.bluenet.control.recoverByFactoryReset(crownstoneUUID)
      .then({_ in callback([["error" : false]])})
      .error({err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN recover"]])
        }
      })
  }
  
  @objc func setupCrownstone(configJSON: String, callback: RCTResponseSenderBlock) -> Void {
    let data = JSON.parse(configJSON);
    let crownstoneId      = data["crownstoneId"].uInt16
    let adminKey          = data["adminKey"].string
    let memberKey         = data["memberKey"].string
    let guestKey          = data["guestKey"].string
    let meshAccessAddress = data["meshAccessAddress"].uInt32
    let ibeaconUUID       = data["ibeaconUUID"].string
    let ibeaconMajor      = data["ibeaconMajor"].uInt16
    let ibeaconMinor      = data["ibeaconMinor"].uInt16
    
    if (crownstoneId != nil &&
      adminKey != nil &&
      memberKey != nil &&
      guestKey != nil &&
      meshAccessAddress != nil &&
      ibeaconUUID != nil &&
      ibeaconMajor != nil &&
      ibeaconMinor != nil) {
      GLOBAL_BLUENET!.bluenet.setup.setup(
        crownstoneId!,
        adminKey: adminKey!,
        memberKey: memberKey!,
        guestKey: guestKey!,
        meshAccessAddress: meshAccessAddress!,
        ibeaconUUID: ibeaconUUID!,
        ibeaconMajor: ibeaconMajor!,
        ibeaconMinor: ibeaconMinor!)
        .then({_ in callback([["error" : false]])})
        .error({err in
          if let bleErr = err as? BleError {
            callback([["error" : true, "data": getBleErrorString(bleErr)]])
          }
          else {
            callback([["error" : true, "data": "UNKNOWN ERROR IN setupCrownstone"]])
          }
        })
    }
    else {
      callback([["error" : true, "data": "Missing one of the datafields required for setup."]])
    }
  }
  
}