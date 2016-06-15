
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

var BASE : ViewPassThrough?


@objc public class ViewPassThrough : NSObject {
  public var bluenet : Bluenet!
  public var bluenetLocalization : BluenetLocalization!
  
  init(viewController: UIViewController) {
    super.init()
    

    BluenetLibIOS.setViewController(viewController)

    self.bluenet = Bluenet(appName: "Crownstone");

    self.bluenetLocalization = BluenetLocalization();
    

    BASE = self
    
//    self.bluenetLocalization.trackUUID("a643423e-e175-4af0-a2e4-31e32f729a8a", groupName: "test")
//    self.bluenetLocalization.on("iBeaconAdvertisement", {ibeaconData -> Void in
//      var returnArray = [String]()
//      if let data = ibeaconData as? [iBeaconPacket] {
//        for packet in data {
//          returnArray.append(JSONUtils.stringify(packet.getJSON()))
//        }
//      }
//      print(returnArray)
//    })
  }
}

func getBleErrorString(err: BleError) -> String {
  switch(err) {
    case .DISCONNECTED:
      return "DISCONNECTED"
    case .CONNECTION_CANCELLED:
      return "CONNECTION_CANCELLED"
    case .CONNECTION_TIMEOUT:
      return "CONNECTION_TIMEOUT"
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
  }
}


@objc(BluenetJS)
class BluenetJS: NSObject {
  
  var bridge: RCTBridge!
  

  @objc func rerouteEvents() {
    if let base = BASE {
      // forward the event streams to react native
      base.bluenet.on("advertisementData", {data -> Void in
        if let castData = data as? Advertisement {
          self.bridge.eventDispatcher().sendAppEventWithName("advertisementData", body: castData.stringify())
        }
      })

      // forward the navigation event stream to react native
      base.bluenetLocalization.on("iBeaconAdvertisement", {ibeaconData -> Void in
        var returnArray = [String]()
        if let data = ibeaconData as? [iBeaconPacket] {
          for packet in data {
            returnArray.append(packet.stringify())
          }
        }
        self.bridge.eventDispatcher().sendAppEventWithName("iBeaconAdvertisement", body: returnArray)
      })
      
      base.bluenetLocalization.on("enterGroup", {data -> Void in
        if let castData = data as? String {
          self.bridge.eventDispatcher().sendAppEventWithName("enterGroup", body: castData)
        }
      })
      base.bluenetLocalization.on("exitGroup", {data -> Void in
        if let castData = data as? String {
          self.bridge.eventDispatcher().sendAppEventWithName("exitGroup", body: castData)
        }
      })
      base.bluenetLocalization.on("enterLocation", {data -> Void in
        if let castData = data as? String {
          self.bridge.eventDispatcher().sendAppEventWithName("enterLocation", body: castData)
        }
      })
      base.bluenetLocalization.on("exitLocation", {data -> Void in
        if let castData = data as? String {
          self.bridge.eventDispatcher().sendAppEventWithName("exitLocation", body: castData)
        }
      })
      base.bluenetLocalization.on("currentLocation", {data -> Void in
        if let castData = data as? String {
          self.bridge.eventDispatcher().sendAppEventWithName("currentLocation", body: castData)
        }
      })
     }
  }

  @objc func connect(uuid: String, callback: RCTResponseSenderBlock) {
    print("Conecting \(uuid)")
    BASE!.bluenet.connect(uuid)
      .then({_ in
        print("connected!")
        callback([["error" : false]])
      })
      .error({err in callback([["error" : true, "data": 1]])})
  }
  
  @objc func disconnect(callback: RCTResponseSenderBlock) {
    BASE!.bluenet.disconnect()
      .then({_ in callback([["error" : false]])})
      .error({err in callback([["error" : true, "data": 1]])})
  }
  
  @objc func setSwitchState(state: NSNumber, callback: RCTResponseSenderBlock) {
    BASE!.bluenet.setSwitchState(Float(state))
      .then({_ in callback([["error" : false]])})
      .error({err in
        print ("error in setSwitchState \(err)")
        callback([["error" : true, "data": 1]])})
  }
  
  
  @objc func startScanning() {
    BASE!.bluenet.startScanning()
  }
  
  @objc func startScanningForCrownstones() {
    BASE!.bluenet.startScanningForCrownstones()
  }
  
  @objc func startScanning(serviceId: String) {
    BASE!.bluenet.startScanningForService(serviceId)
  }
  
  @objc func stopScanning() {
    BASE!.bluenet.stopScanning()
  }
  
  @objc func isReady(callback: RCTResponseSenderBlock) {
    BASE!.bluenet.isReady()
      .then({_ in callback([["error" : false]])})
      .error({err in callback([["error" : true, "data": 1]])})
  }
  
  @objc func trackUUID(groupId: String, groupName: String) -> Void {
    BASE!.bluenetLocalization.trackUUID(groupId, groupName: groupName)
    print("trackUUID groupId: \(groupId) locationId: \(groupName)")
  }
  
  @objc func startCollectingFingerprint() -> Void {
    BASE!.bluenetLocalization.startCollectingFingerprint()
    print("startCollectingFingerprint ")
  }
  
  @objc func abortCollectingFingerprint() -> Void {
    BASE!.bluenetLocalization.abortCollectingFingerprint()
    print("abortCollectingFingerprint ")
  }
  
  
  @objc func finalizeFingerprint(groupId: String, locationId: String) -> Void {
    BASE!.bluenetLocalization.finalizeFingerprint(groupId, locationId: locationId)
    print("finishCollectingFingerprint")
  }
  
  
  @objc func getFingerprint(groupId: String, locationId: String, callback: RCTResponseSenderBlock) -> Void {
    let fingerprint = BASE!.bluenetLocalization.getFingerprint(groupId, locationId: locationId)
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
    BASE!.bluenetLocalization.loadFingerprint(groupId, locationId: locationId, fingerprint: fingerprint)
    print("loadFingerprint \(groupId) \(locationId)")
    
  }
  
  @objc func getBLEstate(state: NSNumber, callback: RCTResponseSenderBlock) -> Void {
    //    self.bluenet.setSwitchState(Float(state))
    //      .then({_ in callback([["error" : false]])})
    //      .error({err in callback([["error" : true, "data": 1]])})
  }
  
  
}

//  @objc func get(what: NSNumber, callback: RCTResponseSenderBlock) -> Void {
//    let resultsDict = [
//      "success" : true,
//      "title"  : "hello world"
//    ];
//    callback([resultsDict])
//  }

//
///**
// This class is here to make the bluenet lib ios into a singleton that is available everywhere in this app.
// */
//public class BluenetContainer {
//  public var bluenet : Bluenet!
//  public var bluenetLocalization : BluenetLocalization!
//  
//  // this makes the BluenetContainer a singleton!! woohoo!
//  static let sharedInstance = BluenetContainer()
//  static func getInstance() -> BluenetContainer {
//    return sharedInstance
//  }
//  private init() {
//    print("init!")
//    self.bluenet = Bluenet(appName: "Crownstone");
//    self.bluenetLocalization = BluenetLocalization();
//  }
//}