
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
      globalBluenet.bluenet.on("advertisementData", {data -> Void in
        if let castData = data as? Advertisement {
          self.bridge.eventDispatcher().sendAppEventWithName("advertisementData", body: castData.stringify())
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
      
      globalBluenet.bluenetLocalization.on("enterGroup", {data -> Void in
        if let castData = data as? String {
          self.bridge.eventDispatcher().sendAppEventWithName("enterGroup", body: castData)
        }
      })
      globalBluenet.bluenetLocalization.on("exitGroup", {data -> Void in
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

  @objc func connect(uuid: String, callback: RCTResponseSenderBlock) {
    GLOBAL_BLUENET!.bluenet.connect(uuid)
      .then({_ in callback([["error" : false]])})
      .error({err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN connect"]])
        }
      })
  }
  
  @objc func disconnect(callback: RCTResponseSenderBlock) {
    GLOBAL_BLUENET!.bluenet.disconnect()
      .then({_ in callback([["error" : false]])})
      .error({err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN disconnect"]])
        }
      })

  }
  
  @objc func setSwitchState(state: NSNumber, callback: RCTResponseSenderBlock) {
    GLOBAL_BLUENET!.bluenet.setSwitchState(state)
      .then({_ in callback([["error" : false]])})
      .error({err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN setSwitchState"]])
        }
      })
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
  

  @objc func trackUUID(groupUUID: String, groupId: String) -> Void {
    print("tracking ibeacons with uuid: \(groupUUID) for group: \(groupId)")
    GLOBAL_BLUENET!.bluenetLocalization.trackUUID(groupUUID, groupId: groupId)
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
  
  @objc func getBLEstate(state: NSNumber, callback: RCTResponseSenderBlock) -> Void {
    //    self.bluenet.setSwitchState(Float(state))
    //      .then({_ in callback([["error" : false]])})
    //      .error({err in callback([["error" : true, "data": 1]])})
  }
  
  
}