
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

@objc(BluenetJS)
open class BluenetJS: RCTEventEmitter {
  
  override init() {
    super.init()
    EventEmitter.sharedInstance.registerEventEmitter(eventEmitter: self)
  }
  
  /// Base overide for RCTEventEmitter.
  ///
  /// - Returns: all supported events
  @objc open override func supportedEvents() -> [String] {
    return EventEmitter.sharedInstance.allEvents
  }
  
  @objc func rerouteEvents() {
    LOGGER.info("BluenetBridge: Called rerouteEvents")
    if let globalBluenet = GLOBAL_BLUENET {
      print("BluenetBridge: ----- BLUENET BRIDGE: Rerouting events")
      // forward the event streams to react native
      globalBluenet.bluenetOn("verifiedAdvertisementData", {data -> Void in
        if let castData = data as? Advertisement {
          if (castData.isSetupPackage()) {
            self.sendEvent(withName: "verifiedSetupAdvertisementData", body: castData.getDictionary())
            
            
            //self.bridge.eventDispatcher().sendAppEvent(withName: "verifiedSetupAdvertisementData", body: castData.getDictionary())
          }
          else if (castData.isDFUPackage()) {
            self.sendEvent(withName: "verifiedDFUAdvertisementData", body: castData.getDictionary())
            
            //self.bridge.eventDispatcher().sendAppEvent(withName: "verifiedDFUAdvertisementData", body: castData.getDictionary())
          }
          else {
            self.sendEvent(withName: "verifiedAdvertisementData", body: castData.getDictionary())
            
            //self.bridge.eventDispatcher().sendAppEvent(withName: "verifiedAdvertisementData", body: castData.getDictionary())
          }

          self.sendEvent(withName: "anyVerifiedAdvertisementData", body: castData.getDictionary())
          
          //self.bridge.eventDispatcher().sendAppEvent(withName: "anyVerifiedAdvertisementData", body: castData.getDictionary())
        }
      })
      
      globalBluenet.bluenetOn("bleStatus", {data -> Void in
        if let castData = data as? String {
          self.sendEvent(withName: "bleStatus", body: castData)
          
          //self.bridge.eventDispatcher().sendAppEvent(withName: "bleStatus", body: castData)
        }
      })
      
      globalBluenet.bluenetLocalizationOn("locationStatus", {data -> Void in
        if let castData = data as? String {
          self.sendEvent(withName: "locationStatus", body: castData)
          //self.bridge.eventDispatcher().sendAppEvent(withName: "locationStatus", body: castData)
        }
      })
      
//      we will not forward the unverified events
//      globalBluenet.bluenetOn("advertisementData", {data -> Void in
//        if let castData = data as? Advertisement {
//          print("BluenetBridge: advertisementData", castData.getDictionary())
//         // self.bridge.eventDispatcher().sendAppEvent(withName: "advertisementData", body: castData.getDictionary())
//        }
//      })

      globalBluenet.bluenetOn("dfuProgress", {data -> Void in
        if let castData = data as? [String: NSNumber] {
          // data["percentage"]  = NSNumber(value: percentage)
          // data["part"]        = NSNumber(value: part)
          // data["totalParts"]  = NSNumber(value: totalParts)
          // data["progress"]    = NSNumber(value: progress)
          // data["currentSpeedBytesPerSecond"] = NSNumber(value: currentSpeedBytesPerSecond)
          // data["avgSpeedBytesPerSecond"]     = NSNumber(value: avgSpeedBytesPerSecond)
          self.sendEvent(withName: "dfuProgress", body: castData)
          //self.bridge.eventDispatcher().sendAppEvent(withName: "dfuProgress", body: castData)
        }
      })
      
      globalBluenet.bluenetOn("setupProgress", {data -> Void in
        if let castData = data as? NSNumber {
          self.sendEvent(withName: "setupProgress", body: castData)
//          self.bridge.eventDispatcher().sendAppEvent(withName: "setupProgress", body: castData)
        }
      })

      
      globalBluenet.bluenetOn("nearestSetupCrownstone", {data -> Void in
        if let castData = data as? NearestItem {
          self.sendEvent(withName: "nearestSetupCrownstone", body: castData.getDictionary())
          //self.bridge.eventDispatcher().sendAppEvent(withName: "nearestSetupCrownstone", body: castData.getDictionary())
        }
      })
      
      globalBluenet.bluenetOn("nearestCrownstone", {data -> Void in
        if let castData = data as? NearestItem {
          self.sendEvent(withName: "nearestCrownstone", body: castData.getDictionary())
          //self.bridge.eventDispatcher().sendAppEvent(withName: "nearestCrownstone", body: castData.getDictionary())
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
        self.sendEvent(withName: "iBeaconAdvertisement", body: returnArray)
        //self.bridge.eventDispatcher().sendAppEvent(withName: "iBeaconAdvertisement", body: returnArray)
      })
      
//      globalBluenet.bluenetLocalizationOn("lowLevelEnterRegion", {data -> Void in
//        print("BluenetBridge: lowLevelEnterRegion")
//      })
//      globalBluenet.bluenetLocalizationOn("lowLevelExitRegion", {data -> Void in
//        print("BluenetBridge: lowLevelExitRegion")
//      })
      
      globalBluenet.bluenetLocalizationOn("enterRegion", {data -> Void in
        print("BluenetBridge: enterRegion")
        if let castData = data as? String {
          self.sendEvent(withName: "enterSphere", body: castData)
          //self.bridge.eventDispatcher().sendAppEvent(withName: "enterSphere", body: castData)
        }
      })
      globalBluenet.bluenetLocalizationOn("exitRegion", {data -> Void in
        print("BluenetBridge: exitRegion")
        if let castData = data as? String {
          self.sendEvent(withName: "exitSphere", body: castData)
          //self.bridge.eventDispatcher().sendAppEvent(withName: "exitSphere", body: castData)
        }
      })
      globalBluenet.bluenetLocalizationOn("enterLocation", {data -> Void in
        print("BluenetBridge: enterLocation")
        if let castData = data as? NSDictionary {
          self.sendEvent(withName: "enterLocation", body: castData)
          //self.bridge.eventDispatcher().sendAppEvent(withName: "enterLocation", body: castData)
        }
      })
      globalBluenet.bluenetLocalizationOn("exitLocation", {data -> Void in
        print("BluenetBridge: exitLocation")
        if let castData = data as? NSDictionary {
          self.sendEvent(withName: "exitLocation", body: castData)
          //self.bridge.eventDispatcher().sendAppEvent(withName: "exitLocation", body: castData)
        }
      })
      globalBluenet.bluenetLocalizationOn("currentLocation", {data -> Void in
        //print("BluenetBridge: currentLocation")
        if let castData = data as? NSDictionary {
          //print("BluenetBridge: currentLocation \(castData)")
          self.sendEvent(withName: "currentLocation", body: castData)
          //self.bridge.eventDispatcher().sendAppEvent(withName: "currentLocation", body: castData)
        }
      })
     }
  }
  
  @objc func setSettings(_ settings: NSDictionary, callback: RCTResponseSenderBlock) {
    LOGGER.info("BluenetBridge: Called setSettings")
    let adminKey  = settings["adminKey"]  as? String
    let memberKey = settings["memberKey"] as? String
    let guestKey  = settings["guestKey"]  as? String
    let referenceId = settings["referenceId"]  as? String
    
    if (adminKey == nil && memberKey == nil && guestKey == nil) {
      callback([["error" : true, "data": "Missing the Keys required for Bluenet Settings. At least one of the following should be provided: adminKey, memberKey or guestKey."]])
      return
    }
    
    if (referenceId == nil) {
      callback([["error" : true, "data": "Missing the referenceId required for Bluenet Settings."]])
      return
    }
    
    if let encryptionEnabled = settings["encryptionEnabled"] as? Bool {
      print("BluenetBridge: SETTING SETTINGS adminKey: \(String(describing: adminKey)) memberKey: \(String(describing: memberKey)) guestKey: \(String(describing: guestKey)) referenceId: \(String(describing: referenceId))")
      GLOBAL_BLUENET!.bluenet.setSettings(encryptionEnabled: encryptionEnabled, adminKey: adminKey, memberKey: memberKey, guestKey: guestKey, referenceId: referenceId!)
      callback([["error" : false]])
    }
    else {
      callback([["error" : true, "data": "Missing the encryptionEnabled data field required for Bluenet Settings."]])
    }
  }
  
  @objc func isReady(_ callback: @escaping RCTResponseSenderBlock) {
    LOGGER.info("BluenetBridge: Called isReady")
    GLOBAL_BLUENET!.bluenet.isReady()
      .then{_ -> Void in
        LOGGER.info("BluenetBridge: returned isReady")
        callback([["error" : false]]
      )}
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
    LOGGER.info("BluenetBridge: Called connect")
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
    LOGGER.info("BluenetBridge: Called phoneDisconnect")
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
  
  @objc func disconnectCommand(_ callback: @escaping RCTResponseSenderBlock) {
    LOGGER.info("BluenetBridge: Called disconnectCommand")
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
  
  @objc func toggleSwitchState(_ callback: @escaping RCTResponseSenderBlock) {
    LOGGER.info("BluenetBridge: Called toggleSwitchState")
    GLOBAL_BLUENET!.bluenet.control.toggleSwitchState()
      .then{newState in callback([["error" : false, "data": newState]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN toggleSwitchState \(err)"]])
        }
      }
  }
  
  @objc func setSwitchState(_ state: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    LOGGER.info("BluenetBridge: Called setSwitchState")
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
  
  
  @objc func getSwitchState(_ callback: @escaping RCTResponseSenderBlock) {
    LOGGER.info("BluenetBridge: Called getSwitchState")
    GLOBAL_BLUENET!.bluenet.state.getSwitchState()
      .then{switchState in callback([["error" : false, "data":switchState]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN getSwitchState \(err)"]])
        }
    }
  }
  
  
  
  @objc func keepAliveState(_ changeState: NSNumber, state: NSNumber, timeout: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    LOGGER.info("BluenetBridge: Called keepAliveState")
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
    LOGGER.info("BluenetBridge: Called keepAlive")
    GLOBAL_BLUENET!.bluenet.control.keepAliveRepeat()
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
    LOGGER.info("BluenetBridge: Called startScanning")
    GLOBAL_BLUENET!.bluenet.startScanning()
  }
  
  @objc func startScanningForCrownstones() {
    LOGGER.info("BluenetBridge: Called startScanningForCrownstones")
    GLOBAL_BLUENET!.bluenet.startScanningForCrownstones()
  }
  
  @objc func startScanningForCrownstonesUniqueOnly() {
    LOGGER.info("BluenetBridge: Called startScanningForCrownstonesUniqueOnly")
    GLOBAL_BLUENET!.bluenet.startScanningForCrownstonesUniqueOnly()
  }
  
  @objc func stopScanning() {
    LOGGER.info("BluenetBridge: Called stopScanning")
    GLOBAL_BLUENET!.bluenet.stopScanning()
  }
  
  @objc func startIndoorLocalization() {
    LOGGER.info("BluenetBridge: Called startIndoorLocalization")
    GLOBAL_BLUENET!.bluenetLocalization.startIndoorLocalization()
  }
  
  @objc func stopIndoorLocalization() {
    LOGGER.info("BluenetBridge: Called stopIndoorLocalization")
    GLOBAL_BLUENET!.bluenetLocalization.stopIndoorLocalization()
  }
  
  @objc func quitApp() {
    LOGGER.info("BluenetBridge: Called quitApp")
    exit(0)
  }
  
  @objc func requestBleState() {
    GLOBAL_BLUENET!.bluenet.emitBleState()
  }
  
  @objc func requestLocation(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called requestLocation")
    let coordinates = GLOBAL_BLUENET!.bluenetLocalization.requestLocation()
    var returnType = [String: NSNumber]();
    returnType["latitude"] = NSNumber(value: coordinates.latitude)
    returnType["longitude"] = NSNumber(value: coordinates.longitude)
    
    callback([["error" : false, "data": returnType]])
  }
  
  @objc func requestLocationPermission() -> Void {
    LOGGER.info("BluenetBridge: Called requestLocationPermission")
    GLOBAL_BLUENET!.bluenetLocalization.requestLocationPermission()
  }
  
  @objc func trackIBeacon(_ ibeaconUUID: String, sphereId: String) -> Void {
    LOGGER.info("BluenetBridge: Called trackIBeacon \(ibeaconUUID) for sphere: \(sphereId)")
    GLOBAL_BLUENET!.bluenetLocalization.trackIBeacon(uuid: ibeaconUUID, referenceId: sphereId)
  }
  
  @objc func stopTrackingIBeacon(_ ibeaconUUID: String) -> Void {
    LOGGER.info("BluenetBridge: Called stopTrackingIBeacon")
    GLOBAL_BLUENET!.bluenetLocalization.stopTrackingIBeacon(ibeaconUUID)
    
  }
  
  @objc func forceClearActiveRegion() -> Void {
    LOGGER.info("BluenetBridge: Called forceClearActiveRegion")
    GLOBAL_BLUENET!.bluenetLocalization.forceClearActiveRegion()
  }
  
  @objc func pauseTracking() -> Void {
    LOGGER.info("BluenetBridge: Called pauseTracking")
    GLOBAL_BLUENET!.bluenetLocalization.pauseTracking()
  }
  
  @objc func resumeTracking() -> Void {
    LOGGER.info("BluenetBridge: Called resumeTracking")
    GLOBAL_BLUENET!.bluenetLocalization.resumeTracking()
  }
  
  @objc func startCollectingFingerprint() -> Void {
    LOGGER.info("BluenetBridge: Called startCollectingFingerprint")
    // abort collecting fingerprint if it is currently happening.
    GLOBAL_BLUENET!.trainingHelper.abortCollectingTrainingData()
    
    // start collection
    GLOBAL_BLUENET!.trainingHelper.startCollectingTrainingData()
  }
  
  @objc func abortCollectingFingerprint() -> Void {
    LOGGER.info("BluenetBridge: Called abortCollectingFingerprint")
    GLOBAL_BLUENET!.trainingHelper.abortCollectingTrainingData()
  }
  
  @objc func pauseCollectingFingerprint() -> Void {
    LOGGER.info("BluenetBridge: Called pauseCollectingFingerprint")
    GLOBAL_BLUENET!.trainingHelper.pauseCollectingTrainingData()
  }
  
  @objc func resumeCollectingFingerprint() -> Void {
    LOGGER.info("BluenetBridge: Called resumeCollectingFingerprint")
    GLOBAL_BLUENET!.trainingHelper.resumeCollectingTrainingData()
  }
  
  
  @objc func finalizeFingerprint(_ sphereId: String, locationId: String, callback: RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called finalizeFingerprint \(sphereId) \(locationId)")
    
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
    LOGGER.info("BluenetBridge: Called clearTrackedBeacons")
    GLOBAL_BLUENET!.bluenetLocalization.clearTrackedBeacons()
    
    callback([["error" : false]])
  }
  
  
  @objc func clearFingerprints() {
    LOGGER.info("BluenetBridge: Called clearFingerprints")
    GLOBAL_BLUENET!.classifier.resetAllTrainingData()
  }
  
  @objc func clearFingerprintsPromise(_ callback: RCTResponseSenderBlock) {
    LOGGER.info("BluenetBridge: Called clearFingerprintsPromise")
    GLOBAL_BLUENET!.classifier.resetAllTrainingData()
    
    callback([["error" : false]])
  }
  
  @objc func loadFingerprint(_ sphereId: String, locationId: String, fingerprint: String) -> Void {
    LOGGER.info("BluenetBridge: Called loadFingerprint \(sphereId) \(locationId) \(fingerprint)")
    GLOBAL_BLUENET!.classifier.loadTrainingData(locationId, referenceId: sphereId, trainingData: fingerprint)
  }
  
  
  @objc func commandFactoryReset(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called commandFactoryReset")
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
  
  @objc func getHardwareVersion(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called getHardwareVersion")
    GLOBAL_BLUENET!.bluenet.device.getHardwareRevision()
      .then{(harwareVersion : String) -> Void in
        callback([["error" : false, "data": harwareVersion]]
      )}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN getHardwareVersion"]])
        }
    }
  }
  
  @objc func getFirmwareVersion(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called getFirmwareVersion")
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
  
  @objc func getBootloaderVersion(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called getBootloaderVersion")
    GLOBAL_BLUENET!.bluenet.device.getBootloaderRevision()
      .then{(bootloaderVersion : String) -> Void in callback([["error" : false, "data": bootloaderVersion]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN getBootloaderRevision"]])
        }
    }
  }

  
  @objc func getMACAddress(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called getMACAddress")
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
  
  
  @objc func getErrors(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called getErrors")
    GLOBAL_BLUENET!.bluenet.state.getErrors()
      .then{(errors : CrownstoneErrors) -> Void in callback([["error" : false, "data": errors.getDictionary()]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN getErrors"]])
        }
    }
  }
  
  @objc func clearErrors(_ errors: NSDictionary, callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called clearErrors")
    GLOBAL_BLUENET!.bluenet.control.clearError(errorDict: errors)
      .then{_ -> Void in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN getErrors"]])
        }
    }
  }
  
  @objc func restartCrownstone(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called restartCrownstone")
    GLOBAL_BLUENET!.bluenet.control.reset()
      .then{_ -> Void in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN getErrors"]])
        }
    }
  }
  
  
  @objc func recover(_ crownstoneHandle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called recover")
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
  
  @objc func enableExtendedLogging(_ enableLogging: NSNumber) -> Void {
    LOGGER.info("BluenetBridge: Called enableExtendedLogging")
    if (enableLogging.boolValue == true) {
      BluenetLib.LOG.setFileLevel(.VERBOSE)
      BluenetLib.LOG.setPrintLevel(.INFO)
      
      LOGGER.setFileLevel(.VERBOSE)
      LOGGER.setPrintLevel(.VERBOSE)
    }
    else {
      BluenetLib.LOG.setFileLevel(.INFO)
      BluenetLib.LOG.setPrintLevel(.INFO)
      
      LOGGER.setFileLevel(.INFO)
      LOGGER.setPrintLevel(.VERBOSE)
    }
  }
  
  @objc func enableLoggingToFile(_ enableLogging: NSNumber) -> Void {
    LOGGER.info("BluenetBridge: Called enableLoggingToFile enableLogging: \(enableLogging)")
    if (enableLogging.boolValue == true) {
      BluenetLib.LOG.setFileLevel(.INFO)
      BluenetLib.LOG.setPrintLevel(.INFO)
      
      LOGGER.setFileLevel(.INFO)
      LOGGER.setPrintLevel(.INFO)
    }
    else {
      BluenetLib.LOG.clearLogs()
      BluenetLib.LOG.setFileLevel(.NONE)
      BluenetLib.LOG.setPrintLevel(.NONE)
      
      LOGGER.clearLogs()
      LOGGER.setFileLevel(.NONE)
      LOGGER.setPrintLevel(.NONE)
    }
  }
  
  @objc func clearLogs() -> Void {
    LOGGER.info("BluenetBridge: Called clearLogs")
    BluenetLib.LOG.clearLogs()
    LOGGER.clearLogs()
  }
  
  @objc func setupCrownstone(_ data: NSDictionary, callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called setupCrownstone")
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
      callback([["error" : true, "data": "Missing one of the datafields required for setup. 1:\(String(describing: crownstoneId)) 2:\(adminKey) 3:\(String(describing: memberKey)) 4:\(String(describing: guestKey)) 5:\(meshAccessAddress) 6:\(String(describing: ibeaconUUID)) 7:\(ibeaconMajor) 8:\(ibeaconMinor)"]])
    }
  }
  
  @objc func meshKeepAlive(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called meshKeepAlive")
    GLOBAL_BLUENET!.bluenet.mesh.keepAliveRepeat()
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
    LOGGER.info("BluenetBridge: Called meshKeepAliveState")
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
  
  
  @objc func multiSwitch(_ arrayOfStoneSwitchPackets: [NSDictionary], callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called multiSwitch")
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
  
  
  // DFU
  
  @objc func setupPutInDFU(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called setupPutInDFU")
    GLOBAL_BLUENET!.bluenet.setup.putInDFU()
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN putInDFU \(err)"]])
        }
    }
  }
  
  
  @objc func putInDFU(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called putInDFU")
    GLOBAL_BLUENET!.bluenet.control.putInDFU()
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN putInDFU \(err)"]])
        }
    }
  }
  
  @objc func performDFU(_ handle: String, uri: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called performDFU")
    let firmwareURL = URL(fileURLWithPath: uri)
    GLOBAL_BLUENET!.bluenet.dfu.startDFU(handle: handle, firmwareURL: firmwareURL)
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN putInDFU \(err)"]])
        }
    }
  }
  
  @objc func setupFactoryReset(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called setupFactoryReset")
    GLOBAL_BLUENET!.bluenet.setup.factoryReset()
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN putInDFU \(err)"]])
        }
    }
  }
  
  @objc func bootloaderToNormalMode(_ uuid: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called bootloaderToNormalMode")
    GLOBAL_BLUENET!.bluenet.dfu.bootloaderToNormalMode(uuid: uuid)
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN bootloaderToNormalMode \(err)"]])
        }
    }
  }

  
  @objc func setTime(_ time: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called setTime")
    GLOBAL_BLUENET!.bluenet.control.setTime(time)
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN setTime"]])
        }
    }
  }
  
  @objc func getTime(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called getTime")
    GLOBAL_BLUENET!.bluenet.state.getTime()
      .then{time in callback([["error" : false, "data": time]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN setTime"]])
        }
    }
  }


  @objc func batterySaving(_ state: NSNumber) -> Void {
    let batterySavingState : Bool = state.boolValue
    LOGGER.info("BluenetBridge: batterySaving set to \(batterySavingState)")

    if (batterySavingState) {
      GLOBAL_BLUENET!.bluenet.enableBatterySaving()
      GLOBAL_BLUENET!.bluenetLocalization.pauseTracking()
    }
    else {
      GLOBAL_BLUENET!.bluenet.disableBatterySaving()
      GLOBAL_BLUENET!.bluenetLocalization.resumeTracking()
    }
  }

  
  @objc func setBackgroundScanning(_ state: NSNumber) -> Void {
    let backgroundScanning : Bool = state.boolValue
    print("BluenetBridge: backgroundScanning set to \(backgroundScanning)")
    LOGGER.info("BluenetBridge: backgroundScanning set to \(backgroundScanning)")
    
    GLOBAL_BLUENET!.bluenet.setBackgroundScanning(newBackgroundState: backgroundScanning)
    GLOBAL_BLUENET!.bluenetLocalization.setBackgroundScanning(newBackgroundState: backgroundScanning)
  }

  @objc func addSchedule(_ data: NSDictionary, callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called addSchedule")
    let nextTime               = data["nextTime"]           as? NSNumber
    let switchState            = data["switchState"]        as? NSNumber
    let fadeDuration           = data["fadeDuration"]       as? NSNumber
    let intervalInMinutes      = data["intervalInMinutes"]  as? NSNumber
    let ignoreLocationTriggers = data["ignoreLocationTriggers"] as? NSNumber
    let active                 = data["active"]             as? NSNumber
    let repeatMode             = data["repeatMode"]         as? String
    let activeMonday           = data["activeMonday"]       as? NSNumber
    let activeTuesday          = data["activeTuesday"]      as? NSNumber
    let activeWednesday        = data["activeWednesday"]    as? NSNumber
    let activeThursday         = data["activeThursday"]     as? NSNumber
    let activeFriday           = data["activeFriday"]       as? NSNumber
    let activeSaturday         = data["activeSaturday"]     as? NSNumber
    let activeSunday           = data["activeSunday"]       as? NSNumber
    
    
    if (
        nextTime               == nil ||
        switchState            == nil ||
        fadeDuration           == nil ||
        intervalInMinutes      == nil ||
        ignoreLocationTriggers == nil ||
        active                 == nil ||
        repeatMode             == nil ||
        activeMonday           == nil ||
        activeTuesday          == nil ||
        activeWednesday        == nil ||
        activeThursday         == nil ||
        activeFriday           == nil ||
        activeSaturday         == nil ||
        activeSunday           == nil
      ) {
      var failureString = "Not all required fields have been defined. Require additional fields: { "
      failureString += nextTime == nil ?               "nextTime: number (timestamp since epoch in seconds), " : ""
      failureString += switchState == nil ?            "switchState: number (switch, float, [ 0 .. 1 ] ), " : ""
      failureString += fadeDuration == nil ?           "fadeDuration: number (UInt16)" : ""
      failureString += intervalInMinutes == nil ?      "intervalInMinutes: number (UInt16)" : ""
      failureString += ignoreLocationTriggers == nil ? "ignoreLocationTriggers: Boolean" : ""
      failureString += active == nil ?                 "active: Boolean, " : ""
      failureString += repeatMode == nil ?             "repeatMode: string ('24h' / 'minute' / 'none'), " : ""
      failureString += activeMonday == nil ?           "activeMonday: Boolean, " : ""
      failureString += activeTuesday == nil ?          "activeTuesday: Boolean, " : ""
      failureString += activeWednesday == nil ?        "activeWednesday: Boolean, " : ""
      failureString += activeThursday == nil ?         "activeThursday: Boolean, " : ""
      failureString += activeFriday == nil ?           "activeFriday: Boolean, " : ""
      failureString += activeSaturday == nil ?         "activeSaturday: Boolean, " : ""
      failureString += activeSunday == nil ?           "activeSunday: Boolean" : ""
      failureString += " }"
      callback([["error" : true, "data": failureString]])
      return
    }
    
    if (active!.boolValue == false) {
      callback([["error" : true, "data": "If you want to deactivate the schedule, use the clearSchedule command"]])
      return
    }
    GLOBAL_BLUENET!.bluenet.state.getAvailableScheduleEntryIndex()
      .then{scheduleEntryIndex -> Void in
        let config = ScheduleConfigurator(
          scheduleEntryIndex: scheduleEntryIndex,
          startTime: nextTime!.doubleValue,
          switchState: switchState!.floatValue
        )
        config.fadeDuration = fadeDuration!.uint16Value
        config.intervalInMinutes = intervalInMinutes!.uint16Value
        config.override.location = ignoreLocationTriggers!.boolValue
        config.repeatDay.Monday = activeMonday!.boolValue
        config.repeatDay.Tuesday = activeTuesday!.boolValue
        config.repeatDay.Wednesday = activeWednesday!.boolValue
        config.repeatDay.Thursday = activeThursday!.boolValue
        config.repeatDay.Friday = activeFriday!.boolValue
        config.repeatDay.Saturday = activeSaturday!.boolValue
        config.repeatDay.Sunday = activeSunday!.boolValue
        
        GLOBAL_BLUENET!.bluenet.control.setSchedule(scheduleConfig: config)
          .then{time in callback([["error" : false, "data": scheduleEntryIndex]])}
          .catch{err in
            if let bleErr = err as? BleError {
              callback([["error" : true, "data": getBleErrorString(bleErr)]])
            }
            else {
              callback([["error" : true, "data": "UNKNOWN ERROR IN setSchedule"]])
            }
        }
      }
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN setSchedule"]])
        }
    }
  }
  
  @objc func setSchedule(_ data: NSDictionary, callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called setSchedule")
    let scheduleEntryIndex     = data["scheduleEntryIndex"] as? NSNumber
    let nextTime               = data["nextTime"]           as? NSNumber
    let switchState            = data["switchState"]        as? NSNumber
    let fadeDuration           = data["fadeDuration"]       as? NSNumber
    let intervalInMinutes      = data["intervalInMinutes"]  as? NSNumber
    let ignoreLocationTriggers = data["ignoreLocationTriggers"] as? NSNumber
    let active                 = data["active"]             as? NSNumber
    let repeatMode             = data["repeatMode"]         as? String
    let activeMonday           = data["activeMonday"]       as? NSNumber
    let activeTuesday          = data["activeTuesday"]      as? NSNumber
    let activeWednesday        = data["activeWednesday"]    as? NSNumber
    let activeThursday         = data["activeThursday"]     as? NSNumber
    let activeFriday           = data["activeFriday"]       as? NSNumber
    let activeSaturday         = data["activeSaturday"]     as? NSNumber
    let activeSunday           = data["activeSunday"]       as? NSNumber
    
    
    if (
        scheduleEntryIndex     == nil ||
        nextTime               == nil ||
        switchState            == nil ||
        fadeDuration           == nil ||
        intervalInMinutes      == nil ||
        ignoreLocationTriggers == nil ||
        active                 == nil ||
        repeatMode             == nil ||
        activeMonday           == nil ||
        activeTuesday          == nil ||
        activeWednesday        == nil ||
        activeThursday         == nil ||
        activeFriday           == nil ||
        activeSaturday         == nil ||
        activeSunday           == nil
      ) {
      var failureString = "Not all required fields have been defined. Require additional fields: { "
      failureString += scheduleEntryIndex == nil ?     "scheduleEntryIndex: number (index of timer, [0 .. 9]), " : ""
      failureString += nextTime == nil ?               "nextTime: number (timestamp since epoch in seconds), " : ""
      failureString += switchState == nil ?            "switchState: number (switch, float, [ 0 .. 1 ] ), " : ""
      failureString += fadeDuration == nil ?           "fadeDuration: number (UInt16)" : ""
      failureString += intervalInMinutes == nil ?      "intervalInMinutes: number (UInt16)" : ""
      failureString += ignoreLocationTriggers == nil ? "ignoreLocationTriggers: Boolean" : ""
      failureString += active == nil ?                 "active: Boolean, " : ""
      failureString += repeatMode == nil ?             "repeatMode: string ('24h' / 'minute' / 'none'), " : ""
      failureString += activeMonday == nil ?           "activeMonday: Boolean, " : ""
      failureString += activeTuesday == nil ?          "activeTuesday: Boolean, " : ""
      failureString += activeWednesday == nil ?        "activeWednesday: Boolean, " : ""
      failureString += activeThursday == nil ?         "activeThursday: Boolean, " : ""
      failureString += activeFriday == nil ?           "activeFriday: Boolean, " : ""
      failureString += activeSaturday == nil ?         "activeSaturday: Boolean, " : ""
      failureString += activeSunday == nil ?           "activeSunday: Boolean" : ""
      failureString += " }"
      callback([["error" : true, "data": failureString]])
      return
    }
    
    if (active!.boolValue == false) {
      callback([["error" : true, "data": "If you want to deactivate the schedule, use the clearSchedule command"]])
      return
    }
    

    let config = ScheduleConfigurator(
      scheduleEntryIndex: scheduleEntryIndex!.uint8Value,
      startTime: nextTime!.doubleValue,
      switchState: switchState!.floatValue
    )
    
    config.fadeDuration = fadeDuration!.uint16Value
    config.intervalInMinutes = intervalInMinutes!.uint16Value
    config.override.location = ignoreLocationTriggers!.boolValue
    config.repeatDay.Monday = activeMonday!.boolValue
    config.repeatDay.Tuesday = activeTuesday!.boolValue
    config.repeatDay.Wednesday = activeWednesday!.boolValue
    config.repeatDay.Thursday = activeThursday!.boolValue
    config.repeatDay.Friday = activeFriday!.boolValue
    config.repeatDay.Saturday = activeSaturday!.boolValue
    config.repeatDay.Sunday = activeSunday!.boolValue

    
    GLOBAL_BLUENET!.bluenet.control.setSchedule(scheduleConfig: config)
      .then{time in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN setSchedule"]])
        }
    }
  }
  
  @objc func clearSchedule(_ scheduleEntryIndex: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called clearSchedule")
    GLOBAL_BLUENET!.bluenet.control.clearSchedule(scheduleEntryIndex: scheduleEntryIndex.uint8Value)
      .then{time in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN clearSchedule"]])
        }
    }
  }
  
  
  @objc func getAvailableScheduleEntryIndex(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called getAvailableScheduleEntryIndex")
    GLOBAL_BLUENET!.bluenet.state.getAvailableScheduleEntryIndex()
      .then{index in callback([["error" : false, "data": index]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN getAvailableSchedulerIndex"]])
        }
    }
  }
  
  @objc func getSchedules(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called getSchedules")
    GLOBAL_BLUENET!.bluenet.state.getAllSchedules()
      .then{data -> Void in
        var returnData = [NSDictionary]()
        for schedule in data {
          if (schedule.isActive()) {
            returnData.append(schedule.getScheduleDataFormat())
          }
        }
        callback([["error" : false, "data": returnData]])
      }
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN getAvailableSchedulerIndex"]])
        }
    }
    
  }

  @objc func allowDimming(_ allow: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    let allowBool = allow.boolValue
    LOGGER.info("BluenetBridge: Called allowDimming")
    GLOBAL_BLUENET!.bluenet.control.allowDimming(allow: allowBool)
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN allowDimming"]])
        }
    }
  }
  
  @objc func lockSwitch(_ lock: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    let lockBool = lock.boolValue
    LOGGER.info("BluenetBridge: Called lockSwitch")
    GLOBAL_BLUENET!.bluenet.control.lockSwitch(lock: lockBool)
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN lockSwitch"]])
        }
    }
  }
  
  @objc func meshSetTime(_ time: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called meshSetTime")
    GLOBAL_BLUENET!.bluenet.mesh.batchCommand(crownstoneIds: [], commandPacket: ControlPacketsGenerator.getSetTimePacket(time.uint32Value))
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN meshSetTime"]])
        }
    }
  }
  
  
  @objc func sendNoOp(_  callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called sendNoOp")
    GLOBAL_BLUENET!.bluenet.control.sendNoOp()
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN sendNoOp"]])
        }
    }
  }
  
  @objc func sendMeshNoOp(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called sendMeshNoOp")
    GLOBAL_BLUENET!.bluenet.mesh.batchCommand(crownstoneIds: [], commandPacket: ControlPacketsGenerator.getNoOpPacket())
      .then{_ in callback([["error" : false]])}
      .catch{err in
        if let bleErr = err as? BleError {
          callback([["error" : true, "data": getBleErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN sendMeshNoOp"]])
        }
    }
  }
  
  @objc func viewsInitialized() {
    LOGGER.info("BluenetBridge: Called viewsInitialized")
  }
  
}
