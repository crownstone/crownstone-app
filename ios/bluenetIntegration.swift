
//  bluenetIntegration.swift
//  Crownstone
//
//  Created by Alex de Mulder on 09/06/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

import Foundation
import BluenetLibIOS
import CoreLocation
import PromiseKit
import SwiftyJSON


@objc class ViewPassThrough : NSObject {
  init(viewController: UIViewController) {
    BluenetLibIOS.setViewController(viewController)
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
  var bluenet : Bluenet!
  var bluenetLocalization : BluenetLocalization!
  
  
  // reset the eventbus
  @objc func reset() {
      BluenetContainer.getInstance().bluenet.reset()
      BluenetContainer.getInstance().bluenetLocalization.reset()
  }
  
  
  // singletons are lazyloaded. getInstance will force initialization.
  @objc func initBluenet() {
    self.bluenet = BluenetContainer.getInstance().bluenet
    self.bluenetLocalization = BluenetContainer.getInstance().bluenetLocalization
    
    // forward the event streams to react native
    self.bluenet.on("advertisementData", {data -> Void in
      if let castData = data as? Advertisement {
        self.bridge.eventDispatcher().sendAppEventWithName("advertisementData", body: JSONUtils.stringify(castData.getJSON()))
      }
    })

    // forward the navigation event stream to react native
    self.bluenetLocalization.on("iBeaconAdvertisement", {ibeaconData -> Void in
      var returnArray = [String]()
      if let data = ibeaconData as? [iBeaconPacket] {
        for packet in data {
          returnArray.append(JSONUtils.stringify(packet.getJSON()))
        }
      }
      self.bridge.eventDispatcher().sendAppEventWithName("iBeaconAdvertisement", body: returnArray)
    })
    
    self.bluenetLocalization.on("enterGroup", {data -> Void in
      if let castData = data as? String {
        self.bridge.eventDispatcher().sendAppEventWithName("enterGroup", body: castData)
      }
    })
    self.bluenetLocalization.on("exitGroup", {data -> Void in
      if let castData = data as? String {
        self.bridge.eventDispatcher().sendAppEventWithName("exitGroup", body: castData)
      }
    })
    self.bluenetLocalization.on("enterLocation", {data -> Void in
      if let castData = data as? String {
        self.bridge.eventDispatcher().sendAppEventWithName("enterLocation", body: castData)
      }
    })
    self.bluenetLocalization.on("exitLocation", {data -> Void in
      if let castData = data as? String {
        self.bridge.eventDispatcher().sendAppEventWithName("exitLocation", body: castData)
      }
    })
    self.bluenetLocalization.on("currentLocation", {data -> Void in
      if let castData = data as? String {
        self.bridge.eventDispatcher().sendAppEventWithName("currentLocation", body: castData)
      }
    })
  }
  
  @objc func connect(uuid: String, callback: RCTResponseSenderBlock) {
    self.bluenet.connect(uuid)
      .then({_ in callback([["error" : false]])})
      .error({err in callback([["error" : true, "data": 1]])})
  }
  
  
  @objc func startScanning() {
    //self.bluenet.startScanning()
  }
  
  @objc func stopScanning() {
    //	self.bluenet.stopScanning()
  }
  
  @objc func isReady(callback: RCTResponseSenderBlock) {
    self.bluenet.isReady()
      .then({_ in callback([["error" : false]])})
      .error({err in callback([["error" : true, "data": 1]])})
  }
  
  
  @objc func get(what: NSNumber, callback: RCTResponseSenderBlock) -> Void {
    let resultsDict = [
      "success" : true,
      "title"  : "hello world"
    ];
    callback([resultsDict])
  }
  
  @objc func startCollectingFingerprint(groupId: String, locationId: String) -> Void {
    print("startCollectingFingerprint groupId: \(groupId) locationId: \(locationId)")
  }
  
  
  @objc func finishCollectingFingerprint() -> Void {
    print("finishCollectingFingerprint")
  }
  
  
  @objc func getFingerPrint(locationId: NSString, callback: RCTResponseSenderBlock) -> Void {
    print("getFingerprint \(locationId)")
    callback([])
  }
  
  @objc func setSwitchState(state: NSNumber, callback: RCTResponseSenderBlock) -> Void {
//    self.bluenet.setSwitchState(Float(state))
//      .then({_ in callback([["error" : false]])})
//      .error({err in callback([["error" : true, "data": 1]])})
  }
  
  @objc func getBLEstate(state: NSNumber, callback: RCTResponseSenderBlock) -> Void {
    //    self.bluenet.setSwitchState(Float(state))
    //      .then({_ in callback([["error" : false]])})
    //      .error({err in callback([["error" : true, "data": 1]])})
  }
  
  
}

/**
 This class is here to make the bluenet lib ios into a singleton that is available everywhere in this app.
 */
public class BluenetContainer {
  public var bluenet : Bluenet!
  public var bluenetLocalization : BluenetLocalization!
  
  // this makes the BluenetContainer a singleton!! woohoo!
  static let sharedInstance = BluenetContainer()
  static func getInstance() -> BluenetContainer {
    return sharedInstance
  }
  private init() {
    self.bluenet = Bluenet(appName: "Crownstone");
    self.bluenetLocalization = BluenetLocalization();
  }
}