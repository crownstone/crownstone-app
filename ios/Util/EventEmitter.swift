//
//  EventEmitter.swift
//  Crownstone
//
//  Created by Alex de Mulder on 21/11/2017.
//  Based on https://gist.github.com/brennanMKE/1ebba84a0fd7c2e8b481e4f8a5349b99
//  Copyright © 2017 Crownstone. All rights reserved.
//

import Foundation

class EventEmitter {
  
  /// Shared Instance.
  public static var sharedInstance = EventEmitter()
  
  // ReactNativeEventEmitter is instantiated by React Native with the bridge.
  private static var eventEmitter: BluenetJS!
  
  private init() {}
  
  // When React Native instantiates the emitter it is registered here.
  func registerEventEmitter(eventEmitter: BluenetJS) {
    EventEmitter.eventEmitter = eventEmitter
  }
  
  func dispatch(name: String, body: Any?) {
    EventEmitter.eventEmitter.sendEvent(withName: name, body: body)
  }
  
  /// All Events which must be support by React Native.
  lazy var allEvents: [String] = {
    var allEventNames: [String] = []
    
    // Append all events here
    allEventNames.append("verifiedSetupAdvertisementData")
    allEventNames.append("verifiedDFUAdvertisementData")
    allEventNames.append("verifiedAdvertisementData")
    allEventNames.append("unverifiedAdvertisementData")
    allEventNames.append("crownstoneAdvertisementReceived")
    allEventNames.append("bleStatus")
    allEventNames.append("bleBroadcastStatus")
    allEventNames.append("locationStatus")
    allEventNames.append("dfuProgress")
    allEventNames.append("setupProgress")
    allEventNames.append("nearestSetupCrownstone")
    allEventNames.append("nearestCrownstone")
    allEventNames.append("iBeaconAdvertisement")
    allEventNames.append("enterSphere")
    allEventNames.append("exitSphere")
    allEventNames.append("enterLocation")
    allEventNames.append("exitLocation")
    allEventNames.append("currentLocation")
    allEventNames.append("currentLocationKNN")
    allEventNames.append("knn_debug")
    allEventNames.append("libPopup")
    allEventNames.append("libAlert")
    allEventNames.append("classifierResult")
    allEventNames.append("classifierProbabilities")
    allEventNames.append("callbackUrlInvoked")
    allEventNames.append("localizationPausedState")
    
    allEventNames.append("connectedToPeripheral")
    allEventNames.append("connectedToPeripheralFailed")
    allEventNames.append("disconnectedFromPeripheral")
    
    return allEventNames
  }()
  
}
