
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

import WatchConnectivity

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

    _ = AppEventBus.on("callbackUrlInvoked", { (data) -> Void in
      if let urlStr = data as? String {
        self.sendEvent(withName: "callbackUrlInvoked", body: urlStr)
      }
    })
    
    print("BluenetBridge: ----- BLUENET BRIDGE: Rerouting events")
    
    _ = GLOBAL_BLUENET.classifier.subscribe("__classifierProbabilities", callback:{ (data) -> Void in
      //print("__classifierProbabilities",data)
      if let dict = data as? NSDictionary {
        self.sendEvent(withName: "classifierProbabilities", body: dict)
      }
    })
    
    _ = GLOBAL_BLUENET.classifier.subscribe("__classifierResult", callback: { (data) -> Void in
      //print("__classifierResult",data)
      if let dict = data as? NSDictionary {
        self.sendEvent(withName: "classifierResult", body: dict)
      }
    })
    
    
    // forward the event streams to react native
    GLOBAL_BLUENET.bluenetOn("verifiedAdvertisementData", {data -> Void in
      if let castData = data as? Advertisement {
        if (castData.operationMode == .setup) {
          self.sendEvent(withName: "verifiedSetupAdvertisementData", body: castData.getDictionary())
        }
        else if (castData.operationMode == .dfu) {
          self.sendEvent(withName: "verifiedDFUAdvertisementData", body: castData.getDictionary())
        }
        else {
          self.sendEvent(withName: "verifiedAdvertisementData", body: castData.getDictionary())
        }
      }
    })
    
    GLOBAL_BLUENET.bluenetOn("bleStatus", {data -> Void in
      if let castData = data as? String {
        self.sendEvent(withName: "bleStatus", body: castData)
      }
    })
    
    GLOBAL_BLUENET.bluenetOn("bleBroadcastStatus", {data -> Void in
      if let castData = data as? String {
        self.sendEvent(withName: "bleBroadcastStatus", body: castData)
      }
    })
    
  
    GLOBAL_BLUENET.bluenetLocalizationOn("locationStatus", {data -> Void in
      print("BluenetBridge: ----- LocationStatus", data)
      if let castData = data as? String {
        self.sendEvent(withName: "locationStatus", body: castData)
      }
    })
    
    


    GLOBAL_BLUENET.bluenetOn("dfuProgress", {data -> Void in
      if let castData = data as? [String: NSNumber] {
        // data["percentage"]  = NSNumber(value: percentage)
        // data["part"]        = NSNumber(value: part)
        // data["totalParts"]  = NSNumber(value: totalParts)
        // data["progress"]    = NSNumber(value: progress)
        // data["currentSpeedBytesPerSecond"] = NSNumber(value: currentSpeedBytesPerSecond)
        // data["avgSpeedBytesPerSecond"]     = NSNumber(value: avgSpeedBytesPerSecond)
        self.sendEvent(withName: "dfuProgress", body: castData)
      }
    })
    
    GLOBAL_BLUENET.bluenetOn("setupProgress", {data -> Void in
      if let castData = data as? NSNumber {
        self.sendEvent(withName: "setupProgress", body: castData)
      }
    })
    
    
    GLOBAL_BLUENET.bluenetOn("LOCALIZATION_PAUSED_STATE", {data -> Void in
      if let castData = data as? NSNumber {
        self.sendEvent(withName: "localizationPausedState", body: castData)
      }
    })
    
    
    GLOBAL_BLUENET.bluenetOn("connectedToPeripheral", {data -> Void in
      if let castData = data as? String {
        self.sendEvent(withName: "connectedToPeripheral", body: castData)
      }
    })
    
    GLOBAL_BLUENET.bluenetOn("connectedToPeripheralFailed", {data -> Void in
      if let castData = data as? String {
        self.sendEvent(withName: "connectedToPeripheralFailed", body: castData)
      }
    })
    
    GLOBAL_BLUENET.bluenetOn("disconnectedFromPeripheral", {data -> Void in
      if let castData = data as? String {
        self.sendEvent(withName: "disconnectedFromPeripheral", body: castData)
      }
    })

    // forward the navigation event stream to react native
    GLOBAL_BLUENET.bluenetLocalizationOn("iBeaconAdvertisement", {ibeaconData -> Void in
      var returnArray = [NSDictionary]()
      if let data = ibeaconData as? [iBeaconPacket] {
        for packet in data {
          returnArray.append(packet.getDictionary())
        }
      }
      self.sendEvent(withName: "iBeaconAdvertisement", body: returnArray)
    })
    GLOBAL_BLUENET.bluenetLocalizationOn("enterRegion", {data -> Void in
      print("BluenetBridge: enterRegion")
      if let castData = data as? String {
        self.sendEvent(withName: "enterSphere", body: castData)
      }
    })
    GLOBAL_BLUENET.bluenetLocalizationOn("exitRegion", {data -> Void in
      print("BluenetBridge: exitRegion")
      if let castData = data as? String {
        self.sendEvent(withName: "exitSphere", body: castData)
      }
    })
    GLOBAL_BLUENET.bluenetLocalizationOn("enterLocation", {data -> Void in
      print("BluenetBridge: enterLocation")
      if let castData = data as? NSDictionary {
        self.sendEvent(withName: "enterLocation", body: castData)
      }
    })
    GLOBAL_BLUENET.bluenetLocalizationOn("exitLocation", {data -> Void in
      print("BluenetBridge: exitLocation")
      if let castData = data as? NSDictionary {
        self.sendEvent(withName: "exitLocation", body: castData)
      }
    })
    GLOBAL_BLUENET.bluenetLocalizationOn("currentLocation", {data -> Void in
      //print("BluenetBridge: currentLocation")
      if let castData = data as? NSDictionary {
        //print("BluenetBridge: currentLocation \(castData)")
        self.sendEvent(withName: "currentLocation", body: castData)
      }
    })
  }
  
  
  
  @objc func clearKeySets() {
    GLOBAL_BLUENET.bluenet.loadKeysets(encryptionEnabled: true, keySets: [])
  }
  
  @objc func setKeySets(_ keySets: [NSDictionary], callback: @escaping RCTResponseSenderBlock) {
    LOGGER.info("BluenetBridge: Called setKeySets")
    var sets : [KeySet] = []
    var watchSets = [String: [String: String?]]()
    
    if let castSets = keySets as? [NSDictionary] {
      for keyData in castSets {
        let adminKey     = keyData["adminKey"]  as? String
        let memberKey    = keyData["memberKey"] as? String
        let basicKey     = keyData["basicKey"]  as? String
        let localizationKey = keyData["localizationKey"] as? String
        let serviceDataKey = keyData["serviceDataKey"]  as? String
        let referenceId  = keyData["referenceId"]  as? String
        if (adminKey == nil && memberKey == nil && basicKey == nil || referenceId == nil) {
          callback([["error" : true, "data": "Missing the Keys required for Bluenet Settings. At least one of the following should be provided: adminKey, memberKey, basicKey and referenceId."]])
          return
        }
        sets.append(KeySet(adminKey: adminKey, memberKey: memberKey, basicKey: basicKey, localizationKey: localizationKey, serviceDataKey: serviceDataKey, referenceId: referenceId!))
        
        watchSets[referenceId!] = ["adminKey": adminKey, "memberKey": memberKey, "basicKey": basicKey, "localizationKey": localizationKey, "serviceDataKey": serviceDataKey]
        
      }
    }
    else {
      callback([["error" : true, "data": "Invalid keyset types"]])
      return
    }
    
    GLOBAL_BLUENET.bluenet.loadKeysets(encryptionEnabled: true, keySets: sets)
    
    GLOBAL_BLUENET.watchStateManager.loadState("keysets", watchSets)
   
    callback([["error" : false]])
  }
  
  @objc func isReady(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    wrapForBluenet("isReady", callback, GLOBAL_BLUENET.bluenet.isReady())
  }
  
  @objc func isPeripheralReady(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    LOGGER.info("BluenetBridge: Called isPeripheralReady")
    GLOBAL_BLUENET.bluenet.isPeripheralReady()
      .done{_ -> Void in
        LOGGER.info("BluenetBridge: returned isPeripheralReady")
        callback([["error" : false]]
        )}
      .catch{err in
        if let bleErr = err as? BluenetError {
          callback([["error" : true, "data": getBluenetErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN isPeripheralReady"]])
        }
    }
  }


  @objc func connect(_ handle: String, referenceId: String, callback: @escaping RCTResponseSenderBlock) {
    LOGGER.info("BluenetBridge: Called connect to handle \(handle)")
    GLOBAL_BLUENET.bluenet.connect(handle, referenceId: referenceId)
      .done{ crownstoneMode in callback([["error" : false, "data": "\(crownstoneMode)"]]) }
      .catch{err in
        if let bleErr = err as? BluenetError {
          callback([["error" : true, "data": getBluenetErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN \(label) \(err)"]])
        }
    }
  }
  
  @objc func phoneDisconnect(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("phoneDisconnect", callback, GLOBAL_BLUENET.bluenet.disconnect(handle: handle))
  }
  
  @objc func disconnectCommand(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("disconnectCommand", callback, GLOBAL_BLUENET.bluenet.control(handleUUID!).disconnect())
  }
  
  @objc func toggleSwitchState(_ handle: String, stateForOn: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("toggleSwitchState", callback, GLOBAL_BLUENET.bluenet.control(handleUUID!).toggleSwitchState(stateForOn: stateForOn.uint8Value))
  }
  
  @objc func setSwitchState(_ handle: String, state: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("setSwitchState", callback, GLOBAL_BLUENET.bluenet.control(handleUUID!).setSwitchState(state.uint8Value))
  }
  
  @objc func getSwitchState(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("getSwitchState", callback, GLOBAL_BLUENET.bluenet.state(handleUUID!).getSwitchState())
  }
  
  @objc func startAdvertising() {
    LOGGER.info("BluenetBridge: Called startAdvertising")
    GLOBAL_BLUENET.bluenet.startAdvertising()
  }
  @objc func stopAdvertising() {
    LOGGER.info("BluenetBridge: Called stopAdvertising")
    GLOBAL_BLUENET.bluenet.stopAdvertising()
  }
  
  
  @objc func startScanning() {
    LOGGER.info("BluenetBridge: Called startScanning")
    GLOBAL_BLUENET.bluenet.startScanning()
  }
  
  @objc func startScanningForCrownstones() {
    LOGGER.info("BluenetBridge: Called startScanningForCrownstones")
    GLOBAL_BLUENET.bluenet.startScanningForCrownstones()
  }
  
  @objc func startScanningForCrownstonesUniqueOnly() {
    LOGGER.info("BluenetBridge: Called startScanningForCrownstonesUniqueOnly")
    GLOBAL_BLUENET.bluenet.startScanningForCrownstonesUniqueOnly()
  }
  
  @objc func stopScanning() {
    LOGGER.info("BluenetBridge: Called stopScanning")
    GLOBAL_BLUENET.bluenet.stopScanning()
  }
  
  @objc func startIndoorLocalization() {
    LOGGER.info("BluenetBridge: Called startIndoorLocalization")
    GLOBAL_BLUENET.bluenetLocalization.startIndoorLocalization()
  }
  
  @objc func stopIndoorLocalization() {
    LOGGER.info("BluenetBridge: Called stopIndoorLocalization")
    GLOBAL_BLUENET.bluenetLocalization.stopIndoorLocalization()
  }
  
  @objc func quitApp() {
    LOGGER.info("BluenetBridge: Called quitApp")
    exit(0)
  }
  
  @objc func resetBle() {
    LOGGER.info("BluenetBridge: called resetBle, do nothing, this is only used in Android")
  }
  
  @objc func requestBleState() {
    GLOBAL_BLUENET.bluenet.emitBleState()
  }
  
  @objc func requestLocation(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called requestLocation")
    GLOBAL_BLUENET.bluenetLocalization.requestLocation()
      .done{ coordinates in
        var returnType = [String: NSNumber]();
        returnType["latitude"] = NSNumber(value: coordinates.latitude)
        returnType["longitude"] = NSNumber(value: coordinates.longitude)
        
        callback([["error" : false, "data": returnType]])
      }
      .catch{err in
        if let bleErr = err as? BluenetError {
          callback([["error" : true, "data": getBluenetErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN requestLocation \(err)"]])
        }
      }
  }
  
  @objc func requestLocationPermission() -> Void {
    LOGGER.info("BluenetBridge: Called requestLocationPermission")
    GLOBAL_BLUENET.bluenetLocalization.requestLocationPermission()
  }
  
  @objc func trackIBeacon(_ ibeaconUUID: String, sphereId: String) -> Void {
    LOGGER.info("BluenetBridge: Called trackIBeacon \(ibeaconUUID) for sphere: \(sphereId)")
    GLOBAL_BLUENET.bluenetLocalization.trackIBeacon(uuid: ibeaconUUID, referenceId: sphereId)
  }
  
  @objc func stopTrackingIBeacon(_ ibeaconUUID: String) -> Void {
    LOGGER.info("BluenetBridge: Called stopTrackingIBeacon")
    GLOBAL_BLUENET.bluenetLocalization.stopTrackingIBeacon(ibeaconUUID)
    
  }
  
  @objc func pauseTracking() -> Void {
    LOGGER.info("BluenetBridge: Called pauseTracking")
    GLOBAL_BLUENET.bluenetLocalization.pauseTracking()
  }
  
  @objc func resumeTracking() -> Void {
    LOGGER.info("BluenetBridge: Called resumeTracking")
    GLOBAL_BLUENET.bluenetLocalization.resumeTracking()
  }
  
  @objc func startCollectingFingerprint() -> Void {
    LOGGER.info("BluenetBridge: Called startCollectingFingerprint")
    // abort collecting fingerprint if it is currently happening.
    GLOBAL_BLUENET.trainingHelper.abortCollectingTrainingData()
    
    // start collection
    GLOBAL_BLUENET.trainingHelper.startCollectingTrainingData()
  }
  
  @objc func abortCollectingFingerprint() -> Void {
    LOGGER.info("BluenetBridge: Called abortCollectingFingerprint")
    GLOBAL_BLUENET.trainingHelper.abortCollectingTrainingData()
  }
  
  @objc func pauseCollectingFingerprint() -> Void {
    LOGGER.info("BluenetBridge: Called pauseCollectingFingerprint")
    GLOBAL_BLUENET.trainingHelper.pauseCollectingTrainingData()
  }
  
  @objc func resumeCollectingFingerprint() -> Void {
    LOGGER.info("BluenetBridge: Called resumeCollectingFingerprint")
    GLOBAL_BLUENET.trainingHelper.resumeCollectingTrainingData()
  }
  
  
  @objc func finalizeFingerprint(_ sphereId: String, locationId: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called finalizeFingerprint \(sphereId) \(locationId)")
    
    let stringifiedFingerprint = GLOBAL_BLUENET.trainingHelper.finishCollectingTrainingData()
    if (stringifiedFingerprint != nil) {
      GLOBAL_BLUENET.classifier.loadTrainingData(locationId, referenceId: sphereId, trainingData: stringifiedFingerprint!)
      callback([["error" : false, "data": stringifiedFingerprint!]])
    }
    else {
      callback([["error" : true, "data": "No samples collected"]])
    }
  }
  
  // this  has a callback so we can chain it in a promise. External calls are always async in RN, we need this to be done before loading new beacons.
  @objc func clearTrackedBeacons(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called clearTrackedBeacons")
    GLOBAL_BLUENET.bluenetLocalization.clearTrackedBeacons()
    callback([["error" : false]])
  }
  
  
  @objc func clearFingerprints() {
    LOGGER.info("BluenetBridge: Called clearFingerprints")
    GLOBAL_BLUENET.classifier.resetAllTrainingData()
  }
  
  @objc func clearFingerprintsPromise(_ callback: @escaping RCTResponseSenderBlock) {
    LOGGER.info("BluenetBridge: Called clearFingerprintsPromise")
    GLOBAL_BLUENET.classifier.resetAllTrainingData()
    callback([["error" : false]])
  }
  
  @objc func loadFingerprint(_ sphereId: String, locationId: String, fingerprint: String) -> Void {
    LOGGER.info("BluenetBridge: Called loadFingerprint \(sphereId) \(locationId)")
    GLOBAL_BLUENET.classifier.loadTrainingData(locationId, referenceId: sphereId, trainingData: fingerprint)
  }
  
  @objc func commandFactoryReset(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("commandFactoryReset", callback, GLOBAL_BLUENET.bluenet.control(handleUUID!).commandFactoryReset())
  }
  
  @objc func getHardwareVersion(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("getHardwareVersion", callback, GLOBAL_BLUENET.bluenet.device(handleUUID!).getHardwareRevision())
  }
  
  @objc func getFirmwareVersion(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("getFirmwareVersion", callback, GLOBAL_BLUENET.bluenet.device(handleUUID!).getFirmwareRevision())
  }
  
  @objc func getBootloaderVersion(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("getBootloaderVersion", callback, GLOBAL_BLUENET.bluenet.device(handleUUID!).getBootloaderRevision())
  }

  
  @objc func getMACAddress(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("getMACAddress", callback, GLOBAL_BLUENET.bluenet.setup(handleUUID!).getMACAddress())
  }
  
  @objc func clearErrors(_ handle: String, errors: NSDictionary, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("clearErrors", callback, GLOBAL_BLUENET.bluenet.control(handleUUID!).clearError(errorDict: errors))
  }
  
  @objc func restartCrownstone(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("restartCrownstone", callback, GLOBAL_BLUENET.bluenet.control(handleUUID!).reset())
  }
  
  @objc func recover(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("recover", callback, GLOBAL_BLUENET.bluenet.control(handleUUID!).recoverByFactoryReset())
  }
  
  @objc func getBehaviourDebugInformation(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("getBehaviourDebugInformation", callback, GLOBAL_BLUENET.bluenet.debug(handleUUID!).getBehaviourDebugInformation())
  }
  
  @objc func enableExtendedLogging(_ enableLogging: NSNumber) -> Void {
    LOGGER.info("BluenetBridge: Called enableExtendedLogging")
    if (enableLogging.boolValue == true) {
      BluenetLib.LOG.setFileLevel(.VERBOSE)
      BluenetLib.LOG.setPrintLevel(.DEBUG)
      
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
  
  @objc func setupCrownstone(_ handle: String, data: NSDictionary, callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called setupCrownstone")
    let crownstoneId       = data["crownstoneId"] as? NSNumber
    let sphereId           = data["sphereId"] as? NSNumber
    let adminKey           = data["adminKey"] as? String
    let memberKey          = data["memberKey"] as? String
    let basicKey           = data["basicKey"] as? String
    let localizationKey    = data["localizationKey"] as? String
    let serviceDataKey     = data["serviceDataKey"] as? String
    let meshNetworkKey     = data["meshNetworkKey"] as? String
    let meshApplicationKey = data["meshApplicationKey"] as? String
    let meshDeviceKey      = data["meshDeviceKey"] as? String
    let ibeaconUUID        = data["ibeaconUUID"] as? String
    let ibeaconMajor       = data["ibeaconMajor"] as? NSNumber
    let ibeaconMinor       = data["ibeaconMinor"] as? NSNumber
    
    let handleUUID = UUID(uuidString: handle)
    if (
      crownstoneId != nil &&
      sphereId != nil &&
      adminKey != nil &&
      memberKey != nil &&
      basicKey != nil &&
      localizationKey != nil &&
      serviceDataKey != nil &&
      meshNetworkKey != nil &&
      meshApplicationKey != nil &&
      meshDeviceKey != nil &&
      ibeaconUUID != nil &&
      ibeaconMajor != nil &&
      ibeaconMinor != nil) {
      GLOBAL_BLUENET.bluenet.setup(handleUUID!).setup(
        crownstoneId: (crownstoneId!).uint16Value,
        sphereId: (sphereId!).uint8Value,
        adminKey: adminKey!,
        memberKey: memberKey!,
        basicKey: basicKey!,
        localizationKey: localizationKey!,
        serviceDataKey: serviceDataKey!,
        meshNetworkKey: meshNetworkKey!,
        meshApplicationKey: meshApplicationKey!,
        meshDeviceKey: meshDeviceKey!,
        ibeaconUUID: ibeaconUUID!,
        ibeaconMajor: (ibeaconMajor!).uint16Value,
        ibeaconMinor: (ibeaconMinor!).uint16Value)
        .done{_ in callback([["error" : false]])}
        .catch{err in
          if let bleErr = err as? BluenetError {
            callback([["error" : true, "data": getBluenetErrorString(bleErr)]])
          }
          else {
            callback([["error" : true, "data": "UNKNOWN ERROR IN setupCrownstone \(err) "]])
          }
        }
    }
    else {
      callback([["error" : true, "data": "Missing one of the datafields required for setup. 1\(crownstoneId != nil) 2\(sphereId != nil) 3\(adminKey != nil) 4\(memberKey != nil) 5\(basicKey != nil) 6\(localizationKey != nil) 7\(serviceDataKey != nil) 8\(meshApplicationKey != nil) 9\(meshNetworkKey != nil) 10\(meshDeviceKey != nil) 11\(ibeaconUUID != nil) 12\(ibeaconMajor != nil) 13\(ibeaconMinor != nil)"]])
    }
  }
  
  @objc func multiSwitch(_ handle: String, arrayOfStoneSwitchPackets: [NSDictionary], callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("multiSwitch", callback, GLOBAL_BLUENET.bluenet.mesh(handleUUID!).multiSwitch(stones: arrayOfStoneSwitchPackets as! [[String : NSNumber]]))
  }
  
  
  
  @objc func broadcastBehaviourSettings(_ referenceId: String, enabled: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("setBehaviourSettings", callback, GLOBAL_BLUENET.bluenet.broadcast.setBehaviourSettings(referenceId: referenceId, enabled: enabled.boolValue))
  }
  
  
  @objc func turnOnMesh(_ handle: String, arrayOfStoneSwitchPackets: [NSDictionary], callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("turnOnMesh", callback, GLOBAL_BLUENET.bluenet.mesh(handleUUID!).turnOn(stones: arrayOfStoneSwitchPackets as! [[String : NSNumber]]))
  }
  
  @objc func turnOnBroadcast(_ referenceId: String, stoneId: NSNumber, autoExecute: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    let autoExec : Bool = autoExecute.boolValue
    wrapForBluenet("turnOnBroadcast", callback, GLOBAL_BLUENET.bluenet.broadcast.turnOn(referenceId: referenceId, stoneId: stoneId.uint8Value, autoExecute: autoExec))
  }
  
  @objc func broadcastSwitch(_ referenceId: String, stoneId: NSNumber, switchState: NSNumber, autoExecute: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    let autoExec : Bool = autoExecute.boolValue
    wrapForBluenet("broadcastSwitch", callback, GLOBAL_BLUENET.bluenet.broadcast.multiSwitch(referenceId: referenceId, stoneId: stoneId.uint8Value, switchState: switchState.uint8Value, autoExecute: autoExec))
  }
  
  @objc func broadcastExecute() -> Void {
    GLOBAL_BLUENET.bluenet.broadcast.execute()
  }
  
  
  // DFU
  
  @objc func setupPutInDFU(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("setupPutInDFU", callback, GLOBAL_BLUENET.bluenet.control(handleUUID!).putInDFU())
  }
  
  @objc func putInDFU(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("putInDFU", callback, GLOBAL_BLUENET.bluenet.control(handleUUID!).putInDFU())
  }
  
  @objc func performDFU(_ handle: String, uri: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    let firmwareURL = URL(fileURLWithPath: uri)
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("performDFU", callback, GLOBAL_BLUENET.bluenet.dfu(handleUUID!).startDFU(firmwareURL: firmwareURL))
  }
  
  @objc func setupFactoryReset(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("setupFactoryReset", callback, GLOBAL_BLUENET.bluenet.setup(handleUUID!).factoryReset())
  }
  
  @objc func bootloaderToNormalMode(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("bootloaderToNormalMode", callback, GLOBAL_BLUENET.bluenet.dfu(handleUUID!).bootloaderToNormalMode(handle: handle))
  }

  @objc func setTime(_ handle: String, time: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("setTime", callback, GLOBAL_BLUENET.bluenet.control(handleUUID!).setTime(time))
  }
  
  @objc func batterySaving(_ state: NSNumber) -> Void {
    let batterySavingState : Bool = state.boolValue
    LOGGER.info("BluenetBridge: batterySaving set to \(batterySavingState)")

    if (batterySavingState) {
      GLOBAL_BLUENET.bluenet.enableBatterySaving()
    }
    else {
      GLOBAL_BLUENET.bluenet.disableBatterySaving()
    }
  }

  
  @objc func setBackgroundScanning(_ state: NSNumber) -> Void {
    let backgroundScanning : Bool = state.boolValue
    print("BluenetBridge: backgroundScanning set to \(backgroundScanning)")
    LOGGER.info("BluenetBridge: backgroundScanning set to \(backgroundScanning)")
    
    GLOBAL_BLUENET.bluenet.setBackgroundOperations(newBackgroundState: backgroundScanning)
    GLOBAL_BLUENET.bluenetLocalization.setBackgroundScanning(newBackgroundState: backgroundScanning)
  }

  
  @objc func allowDimming(_ handle: String, allow: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    let allowBool = allow.boolValue
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("allowDimming", callback, GLOBAL_BLUENET.bluenet.control(handleUUID!).allowDimming(allow: allowBool))
  }
  
  @objc func lockSwitch(_ handle: String, lock: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    let lockBool = lock.boolValue
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("lockSwitch", callback, GLOBAL_BLUENET.bluenet.control(handleUUID!).lockSwitch(lock: lockBool))
  }
  
  @objc func setSwitchCraft(_ handle: String, state: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    let stateBool = state.boolValue
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("setSwitchCraft", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).setSwitchcraft( enabled: stateBool))
  }
  
  @objc func setTapToToggle(_ handle: String, state: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    let stateBool = state.boolValue
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("setTapToToggle", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).setTapToToggle(enabled: stateBool))
  }
  
  
  @objc func getTapToToggleThresholdOffset(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("getTapToToggleThresholdOffset", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).getTapToToggleThresholdOffset())
  }
  
  
  @objc func setTapToToggleThresholdOffset(_ handle: String, state: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("setTapToToggleThresholdOffset", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).setTapToToggleThresholdOffset(threshold: state.int8Value))
  }
  
  @objc func meshSetTime(_ handle: String, time: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("meshSetTime", callback, GLOBAL_BLUENET.bluenet.mesh(handleUUID!).setTime(time: time.uint32Value))
  }
  
  
  @objc func sendNoOp(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("sendNoOp", callback, GLOBAL_BLUENET.bluenet.control(handleUUID!).sendNoOp())
  }
  
  @objc func sendMeshNoOp(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("meshSetTime", callback, GLOBAL_BLUENET.bluenet.mesh(handleUUID!).sendNoOp())
  }
  
  
  @objc func setMeshChannel(_ handle: String, channel: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("setMeshChannel", callback,
       GLOBAL_BLUENET.bluenet.config(handleUUID!).setMeshChannel(channel) // set channel
        .then{_ in return GLOBAL_BLUENET.bluenet.waitToWrite()} // wait to store
        .then{_ in return GLOBAL_BLUENET.bluenet.control(handleUUID!).reset()} // reset
      )
  }
  
  @objc func getTrackingState(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called getTrackingState")
    callback([["error" : false, "data": GLOBAL_BLUENET.bluenetLocalization.getTrackingState() ]])
  }
  
  
  @objc func isDevelopmentEnvironment(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called isDevelopmentEnvironment")
    callback([["error" : false, "data": GLOBAL_BLUENET.devEnvironment ]])
  }
  
  
  @objc func viewsInitialized() {
    LOGGER.info("BluenetBridge: Called viewsInitialized")
  }
  
  @objc func setLocationState(_ sphereUID: NSNumber, locationId: NSNumber, profileId: NSNumber, deviceToken: NSNumber, referenceId: String) {
    LOGGER.info("BluenetBridge: Called setLocationState \(sphereUID) \(locationId) \(profileId) referenceId:\(referenceId)" )
    GLOBAL_BLUENET.bluenet.setLocationState(sphereUID: sphereUID.uint8Value, locationId: locationId.uint8Value, profileIndex: profileId.uint8Value, deviceToken: deviceToken.uint8Value, referenceId: referenceId)
    GLOBAL_BLUENET.watchStateManager.loadState("locationState", ["sphereUID":sphereUID, "locationId":locationId, "profileIndex": profileId, "deviceToken": deviceToken, "referenceId": referenceId])
  }
  
  @objc func setDevicePreferences(_ rssiOffset: NSNumber, tapToToggle: NSNumber, ignoreForBehaviour: NSNumber, randomDeviceToken: NSNumber, useTimeBasedNonce: NSNumber) {
    LOGGER.info("BluenetBridge: Called setDevicePreferences \(rssiOffset) \(tapToToggle) \(ignoreForBehaviour) \(randomDeviceToken) \(useTimeBasedNonce)")
    GLOBAL_BLUENET.bluenet.setDevicePreferences(
      rssiOffset: rssiOffset.int8Value,
      tapToToggle: tapToToggle.boolValue,
      ignoreForBehaviour: ignoreForBehaviour.boolValue,
      useBackgroundBroadcasts: true,
      useBaseBroadcasts: true,
      useTimeBasedNonce: useTimeBasedNonce.boolValue,
      trackingNumber: randomDeviceToken.uint32Value
    );
  }
  
  @objc func canUseDynamicBackgroundBroadcasts(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("canUseDynamicBackgroundBroadcasts", callback, BluenetLib.BroadcastProtocol.useDynamicBackground())
  }
  
  @objc func setCrownstoneNames(_ names: NSDictionary) {
    print("BluenetBridge: Called SETTING setCrownstoneNames")
    GLOBAL_BLUENET.watchStateManager.loadState("crownstoneNames", names)
  }


  @objc func setupPulse(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("setupPulse", callback, GLOBAL_BLUENET.bluenet.control(handleUUID!).pulse())
  }

  @objc func subscribeToNearest() {
     if GLOBAL_BLUENET.subscribedToNearest() { return }
    
    GLOBAL_BLUENET.bluenetOnNearest("nearestSetupCrownstone", {data -> Void in
      if let castData = data as? NearestItem {
        self.sendEvent(withName: "nearestSetupCrownstone", body: castData.getDictionary())
      }
    })

    GLOBAL_BLUENET.bluenetOnNearest("nearestCrownstone", {data -> Void in
      if let castData = data as? NearestItem {
        self.sendEvent(withName: "nearestCrownstone", body: castData.getDictionary())
      }
    })
  }
  
  @objc func unsubscribeNearest() {
    GLOBAL_BLUENET.bluenetClearNearest()
  }
  
  @objc func subscribeToUnverified() {
    if GLOBAL_BLUENET.subscribedToUnverified() { return }
    
    GLOBAL_BLUENET.bluenetOnUnverified("unverifiedAdvertisementData", {data -> Void in
      if let castData = data as? Advertisement {
        self.sendEvent(withName: "unverifiedAdvertisementData", body: castData.getDictionary())
      }
    })

    GLOBAL_BLUENET.bluenetOnUnverified("advertisementData", {data -> Void in
      if let castData = data as? Advertisement {
        self.sendEvent(withName: "crownstoneAdvertisementReceived", body: {"handle":castData.handle, "rssi": castData.rssi})
      }
    })
  }
  
  @objc func unsubscribeUnverified() {
    GLOBAL_BLUENET.bluenetClearUnverified()
  }
  
  @objc func initBroadcasting() {
    GLOBAL_BLUENET.bluenet.startPeripheral()
  }
  
  @objc func checkBroadcastAuthorization(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    callback([["error" : false, "data": GLOBAL_BLUENET.bluenet.checkBroadcastAuthorization() ]])
  }
  
  @objc func addBehaviour(_ handle: String, data: NSDictionary, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    do {
      let behaviour = try BehaviourDictionaryParser(data, dayStartTimeSecondsSinceMidnight: 4*3600)
      wrapBehaviourMethodForBluenet("addBehaviour", callback, GLOBAL_BLUENET.bluenet.behaviour(handleUUID!).addBehaviour(behaviour: behaviour))
    }
    catch let error {
      if let bluenetErr = error as? BluenetError {
        callback([["error" : true, "data": getBluenetErrorString(bluenetErr) ]])
      }
      else {
        callback([["error" : true, "data": "UNKNOWN ERROR" ]])
      }
    }
  }
  
  @objc func updateBehaviour(_ handle: String, data: NSDictionary, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    do {
      let behaviour = try BehaviourDictionaryParser(data, dayStartTimeSecondsSinceMidnight: 4*3600)
      if let index = behaviour.indexOnCrownstone {
        wrapBehaviourMethodForBluenet("updateBehaviour", callback, GLOBAL_BLUENET.bluenet.behaviour(handleUUID!).replaceBehaviour(index: index, behaviour: behaviour))
      }
      else {
        callback([["error" : true, "data": "NO INDEX PROVIDED"]])
      }
    }
    catch let error {
      if let bluenetErr = error as? BluenetError {
        callback([["error" : true, "data": getBluenetErrorString(bluenetErr) ]])
      }
      else {
        callback([["error" : true, "data": "UNKNOWN ERROR" ]])
      }
    }
  }
  
  @objc func getBehaviour(_ handle: String, index: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    LOGGER.info("BluenetBridge: Called getBehaviour")
    GLOBAL_BLUENET.bluenet.behaviour(handleUUID!).getBehaviour(index: index.uint8Value)
      .done { behaviour -> Void in
        let dictionaryData : NSDictionary = behaviour.getDictionary(dayStartTimeSecondsSinceMidnight: 4*3600)
        callback([["error" : false, "data": dictionaryData]])
      }
      .catch{err in
         if let bleErr = err as? BluenetError {
           callback([["error" : true, "data": getBluenetErrorString(bleErr)]])
         }
         else {
           callback([["error" : true, "data": "UNKNOWN ERROR IN getBehaviour \(err)"]])
         }
      }
  }
  
  @objc func removeBehaviour(_ handle: String, index: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapBehaviourMethodForBluenet("removeBehaviour", callback, GLOBAL_BLUENET.bluenet.behaviour(handleUUID!).removeBehaviour(index: index.uint8Value))
  }
    
  @objc func syncBehaviours(_ handle: String, behaviours: [NSDictionary], callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    
    LOGGER.info("BluenetBridge: Called syncBehaviours")
    let syncer = BehaviourSyncer(handle: handleUUID!, bluenet: GLOBAL_BLUENET.bluenet, behaviourDictionaryArray: behaviours, dayStartTimeSecondsSinceMidnight: 4*3600)
    syncer.sync()
      .done { behaviourArray -> Void in
        var resultMap = [NSDictionary]()
        for behaviour in behaviourArray {
          resultMap.append(behaviour.getDictionary(dayStartTimeSecondsSinceMidnight: 4*3600))
        }
        callback([["error" : false, "data": resultMap]])
      }
      .catch{err in
         if let bleErr = err as? BluenetError {
           callback([["error" : true, "data": getBluenetErrorString(bleErr)]])
         }
         else {
           callback([["error" : true, "data": "UNKNOWN ERROR IN getBehaviour \(err)"]])
         }
      }
  }
  
  @objc func getBehaviourMasterHash(_ behaviours: [NSDictionary], callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called getBehaviourMasterHash \(behaviours)")
    let hasher = BehaviourHasher(behaviours, dayStartTimeSecondsSinceMidnight: 4*3600)
    callback([["error" : false, "data": hasher.getMasterHash()]])
  }
  
  @objc func setTimeViaBroadcast(_ time: NSNumber, sunriseSecondsSinceMidnight: NSNumber, sundownSecondsSinceMidnight: NSNumber, referenceId: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("setTimeViaBroadcast", callback,
                   GLOBAL_BLUENET.bluenet.broadcast.setTime(
                    referenceId:                 referenceId,
                    time:                        time.uint32Value,
                    sunriseSecondsSinceMidnight: sunriseSecondsSinceMidnight.uint32Value,
                    sunsetSecondsSinceMidnight:  sundownSecondsSinceMidnight.uint32Value
    ))
  }
  
  @objc func setSunTimes(_ sunriseSecondsSinceMidnight: NSNumber, sundownSecondsSinceMidnight: NSNumber, referenceId: String) {
    GLOBAL_BLUENET.bluenet.setSunTimes(sunriseSecondsSinceMidnight: sunriseSecondsSinceMidnight.uint32Value, sunsetSecondsSinceMidnight: sundownSecondsSinceMidnight.uint32Value)
  }
  
  @objc func setSunTimesViaConnection(_ handle: String, sunriseSecondsSinceMidnight: NSNumber, sundownSecondsSinceMidnight: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("setSunTimes", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).setSunTimes(sunriseSecondsSinceMidnight: sunriseSecondsSinceMidnight.uint32Value, sunsetSecondsSinceMidnight: sundownSecondsSinceMidnight.uint32Value))
  }
  
  
  @objc func registerTrackedDevice(_ handle: String, trackingNumber: NSNumber, locationUid: NSNumber, profileId: NSNumber, rssiOffset: NSNumber, ignoreForPresence: NSNumber, tapToToggleEnabled: NSNumber, deviceToken: NSNumber, ttlMinutes: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    
    let handleUUID = UUID(uuidString: handle)
    
    wrapForBluenet("registerTrackedDevice", callback,
      GLOBAL_BLUENET.bluenet.control(handleUUID!).registerTrackedDevice(
        trackingNumber: trackingNumber.uint16Value,
        locationUid:    locationUid.uint8Value,
        profileId:      profileId.uint8Value,
        rssiOffset:     rssiOffset.uint8Value,
        ignoreForPresence: ignoreForPresence.boolValue,
        tapToToggle:    tapToToggleEnabled.boolValue,
        deviceToken:    deviceToken.uint32Value,
        ttlMinutes:     ttlMinutes.uint16Value
    ))
  }
  
  
  @objc func trackedDeviceHeartbeat(_ handle: String, trackingNumber: NSNumber, locationUid: NSNumber, deviceToken: NSNumber, ttlMinutes: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    
    let handleUUID = UUID(uuidString: handle)
    
    wrapForBluenet("trackedDeviceHeartbeat", callback,
                   GLOBAL_BLUENET.bluenet.control(handleUUID!).trackedDeviceHeartbeat(
                    trackingNumber: trackingNumber.uint16Value,
                    locationId: locationUid.uint8Value,
                    deviceToken: deviceToken.uint32Value,
                    ttlMinutes: ttlMinutes.uint8Value
    ))
  }
    
    
  @objc func broadcastUpdateTrackedDevice(_ referenceId: String, trackingNumber: NSNumber, locationUid: NSNumber, profileId: NSNumber, rssiOffset: NSNumber, ignoreForPresence: NSNumber, tapToToggleEnabled: NSNumber, deviceToken: NSNumber, ttlMinutes: NSNumber, callback:  @escaping RCTResponseSenderBlock) {
    wrapForBluenet("broadcastUpdateTrackedDevice", callback,
      GLOBAL_BLUENET.bluenet.broadcast.updateTrackedDevice(
        referenceId:    referenceId,
        trackingNumber: trackingNumber.uint16Value,
        locationUid:    locationUid.uint8Value,
        profileId:      profileId.uint8Value,
        rssiOffset:     rssiOffset.uint8Value,
        ignoreForPresence: ignoreForPresence.boolValue,
        tapToToggle:    tapToToggleEnabled.boolValue,
        deviceToken:    deviceToken.uint32Value,
        ttlMinutes:     ttlMinutes.uint16Value
      ))
  }

  
  // DEV
  @objc func switchRelay(_ handle: String, state: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     LOGGER.info("BluenetBridge: Called switchRelay")
     GLOBAL_BLUENET.bluenet.control(handleUUID!).switchRelay(state.uint8Value)
       .done{_ in callback([["error" : false]])}
       .catch{err in
         if let bleErr = err as? BluenetError {
           callback([["error" : true, "data": getBluenetErrorString(bleErr)]])
         }
         else {
           callback([["error" : true, "data": "UNKNOWN ERROR IN switchRelay \(err)"]])
         }
     }
   }
   
  @objc func getCrownstoneUptime(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
      LOGGER.info("BluenetBridge: Called getCrownstoneUptime")
      GLOBAL_BLUENET.bluenet.debug(handleUUID!).getUptime()
        .done{result in callback([["error" : false, "data": NSNumber(value: result)]])}
        .catch{err in
          if let bleErr = err as? BluenetError {
            callback([["error" : true, "data": getBluenetErrorString(bleErr)]])
          }
          else {
            callback([["error" : true, "data": "UNKNOWN ERROR IN getCrownstoneUptime \(err)"]])
          }
      }
    }
  
  @objc func getAdcRestarts(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
    LOGGER.info("BluenetBridge: Called getAdcRestarts")
    GLOBAL_BLUENET.bluenet.debug(handleUUID!).getAdcRestarts()
      .done{result in callback([["error" : false, "data": result ]])}
      .catch{err in
        if let bleErr = err as? BluenetError {
          callback([["error" : true, "data": getBluenetErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN getAdcRestarts \(err)"]])
        }
    }
  }
  
   @objc func getSwitchHistory(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     LOGGER.info("BluenetBridge: Called getSwitchHistory")
     GLOBAL_BLUENET.bluenet.debug(handleUUID!).getSwitchHistory()
       .done{switchHistory in callback([["error" : false, "data": switchHistory ]])}
       .catch{err in
         if let bleErr = err as? BluenetError {
           callback([["error" : true, "data": getBluenetErrorString(bleErr)]])
         }
         else {
           callback([["error" : true, "data": "UNKNOWN ERROR IN getSwitchHistory \(err)"]])
         }
     }
   }
  
   @objc func getPowerSamples(_ handle: String, type: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
      LOGGER.info("BluenetBridge: Called getPowerSamples")
      var typeEnum = PowerSampleType.triggeredSwitchcraft
      if type == "triggeredSwitchcraft" {
        typeEnum = PowerSampleType.triggeredSwitchcraft
      }
      else if type == "missedSwitchcraft" {
        typeEnum = PowerSampleType.missedSwitchcraft
      }
      else if type == "filteredBuffer" {
        typeEnum = PowerSampleType.filteredBuffer
      }
      else if type == "unfilteredBuffer" {
        typeEnum = PowerSampleType.unfilteredBuffer
      }
      else if type == "softFuse" {
        typeEnum = PowerSampleType.softFuse
      }
      else {
        callback([["error" : true, "data": "Invalid type provided" ]])
        return
      }

      GLOBAL_BLUENET.bluenet.debug(handleUUID!).getPowerSamples(type: typeEnum)
       .done{powerSamples in callback([["error" : false, "data": powerSamples ]])}
       .catch{err in
         if let bleErr = err as? BluenetError {
           callback([["error" : true, "data": getBluenetErrorString(bleErr)]])
         }
         else {
           callback([["error" : true, "data": "UNKNOWN ERROR IN getPowerSamples \(err)"]])
         }
      }
   }
  
  @objc func setUartKey(_ handle: String, uartKey: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("setUartKey", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).setUartKey(uartKey))
  }
  
  
  @objc func transferHubTokenAndCloudId(_ handle: String, hubToken: String, cloudId: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
    wrapHubMethodForBluenet(
      "transferHubTokenAndCloudId",
      callback,
      GLOBAL_BLUENET.bluenet.hub(handleUUID!).sendHubData(EncryptionOption.noEncryption.rawValue, payload: HubPacketGenerator.tokenSphereIdPacket(hubToken: hubToken, cloudId: cloudId))
    )
  }
  
  @objc func requestCloudId(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
    wrapHubMethodForBluenet(
      "requestCloudId",
      callback,
      GLOBAL_BLUENET.bluenet.hub(handleUUID!).sendHubData(EncryptionOption.noEncryption.rawValue, payload: HubPacketGenerator.requestDataPacket(type: HubRequestDataType.cloudId))
    )
  }
  
  
  @objc func factoryResetHub(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
    wrapHubMethodForBluenet(
      "factoryResetHub",
      callback,
      GLOBAL_BLUENET.bluenet.hub(handleUUID!).sendHubData(EncryptionOption.noEncryption.rawValue, payload: HubPacketGenerator.factoryResetPacket())
    )
  }
  
  @objc func factoryResetHubOnly(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
    wrapHubMethodForBluenet(
      "factoryResetHubOnly",
      callback,
      GLOBAL_BLUENET.bluenet.hub(handleUUID!).sendHubData(EncryptionOption.noEncryption.rawValue, payload: HubPacketGenerator.factoryResetHubOnlyPacket())
    )
  }
  
  

  @objc func getMinSchedulerFreeSpace(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("getMinSchedulerFreeSpace", callback, GLOBAL_BLUENET.bluenet.debug(handleUUID!).getMinSchedulerFreeSpace())
  }
  
  @objc func getLastResetReason(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
      wrapForBluenet("getLastResetReason", callback, GLOBAL_BLUENET.bluenet.debug(handleUUID!).getLastResetReason())
  }
  
  
  @objc func getGPREGRET(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
      wrapForBluenet("getGPREGRET", callback, GLOBAL_BLUENET.bluenet.debug(handleUUID!).getGPREGRET())
  }
  
  
  @objc func getAdcChannelSwaps(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
      wrapForBluenet("getAdcChannelSwaps", callback, GLOBAL_BLUENET.bluenet.debug(handleUUID!).getAdcChannelSwaps())
  }
  
  
  @objc func setSoftOnSpeed(_ handle: String, speed: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("setSoftOnSpeed", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).setSoftOnSpeed(speed))
  }
  
  @objc func getSoftOnSpeed(_ handle: String, speed: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
    wrapForBluenet("getSoftOnSpeed", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).getSoftOnSpeed())
  }
  
  
   @objc func switchDimmer(_ handle: String, state: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("switchDimmer", callback, GLOBAL_BLUENET.bluenet.control(handleUUID!).switchPWM(state.uint8Value))
   }
     
   @objc func getResetCounter(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("getResetCounter", callback, GLOBAL_BLUENET.bluenet.state(handleUUID!).getResetCounter())
   }

   
   @objc func getSwitchcraftThreshold(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("getSwitchcraftThreshold", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).getSwitchcraftThreshold())
   }
   
   @objc func setSwitchcraftThreshold(_ handle: String, value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("setSwitchcraftThreshold", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).setSwitchcraftThreshold(value: value.floatValue))
   }
   
   @objc func getMaxChipTemp(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("getMaxChipTemp", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).getMaxChipTemp())
   }
   
   @objc func setMaxChipTemp(_ handle: String, value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("setMaxChipTemp", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).setMaxChipTemp(value: value.int8Value))
   }
   
   @objc func getDimmerCurrentThreshold(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("getDimmerCurrentThreshold", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).getDimmerCurrentThreshold())
   }
   
   @objc func setDimmerCurrentThreshold(_ handle: String, value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("setDimmerCurrentThreshold", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).setDimmerCurrentThreshold(value: value.uint16Value))
   }
   
   @objc func getDimmerTempUpThreshold(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("getDimmerTempUpThreshold", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).getDimmerTempUpThreshold())
   }
   
   @objc func setDimmerTempUpThreshold(_ handle: String, value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("setDimmerTempUpThreshold", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).setDimmerTempUpThreshold(value: value.floatValue))
   }
   
   @objc func getDimmerTempDownThreshold(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("getDimmerTempDownThreshold", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).getDimmerTempDownThreshold())
   }
   
   @objc func setDimmerTempDownThreshold(_ handle: String, value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("setDimmerTempDownThreshold", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).setDimmerTempDownThreshold(value: value.floatValue))
   }
   
   @objc func getVoltageZero(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("getVoltageZero", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).getVoltageZero())
   }
   
   @objc func setVoltageZero(_ handle: String, value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("setVoltageZero", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).setVoltageZero(value: value.int32Value))
   }
   
   @objc func getCurrentZero(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("getCurrentZero", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).getCurrentZero())
   }
   
   @objc func setCurrentZero(_ handle: String, value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("setCurrentZero", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).setCurrentZero(value: value.int32Value))
   }
   
   @objc func getPowerZero(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("getPowerZero", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).getPowerZero())
   }
   
   @objc func setPowerZero(_ handle: String, value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("setPowerZero", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).setPowerZero(value: value.int32Value))
   }
   
   @objc func getVoltageMultiplier(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("getVoltageMultiplier", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).getVoltageMultiplier())
   }
   
   @objc func setVoltageMultiplier(_ handle: String, value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("setVoltageMultiplier", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).setVoltageMultiplier(value: value.floatValue))
   }
   
   @objc func getCurrentMultiplier(_ handle: String, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
      wrapForBluenet("getCurrentMultiplier", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).getCurrentMultiplier())
   }
   
   @objc func setCurrentMultiplier(_ handle: String, value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("setCurrentMultiplier", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).setCurrentMultiplier(value: value.floatValue))
   }
   
   @objc func setUartState(_ handle: String, state: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    let handleUUID = UUID(uuidString: handle)
     wrapForBluenet("setUartState", callback, GLOBAL_BLUENET.bluenet.config(handleUUID!).setUartState(state))
   }
  
}


func wrapForBluenet<T>(_ label: String, _ callback: @escaping RCTResponseSenderBlock, _ promise: Promise<T>) {
  LOGGER.info("BluenetBridge: Called \(label)")
  promise
    .done{ value in callback([["error" : false, "data": value]]) }
    .catch{err in
      if let bleErr = err as? BluenetError {
        callback([["error" : true, "data": getBluenetErrorString(bleErr)]])
      }
      else {
        callback([["error" : true, "data": "UNKNOWN ERROR IN \(label) \(err)"]])
      }
  }
}

func wrapForBluenet<T>(_ label: String, _ callback: @escaping RCTResponseSenderBlock, _ value: T) {
  LOGGER.info("BluenetBridge: Called \(label)")
  callback([["error" : false, "data": value]])
}

func wrapForBluenet(_ label: String, _ callback: @escaping RCTResponseSenderBlock, _ promise: Promise<Void>) {
  LOGGER.info("BluenetBridge: Called \(label)")
  promise
    .done{ _ in callback([["error" : false]]) }
    .catch{err in
      if let bleErr = err as? BluenetError {
        callback([["error" : true, "data": getBluenetErrorString(bleErr)]])
      }
      else {
        callback([["error" : true, "data": "UNKNOWN ERROR IN \(label) \(err)"]])
      }
  }
}

func wrapBehaviourMethodForBluenet(_ label: String, _ callback: @escaping RCTResponseSenderBlock, _ promise: Promise<BehaviourResultPacket>) {
  LOGGER.info("BluenetBridge: Called \(label)")
  promise
    .done{ (value : BehaviourResultPacket) in callback([["error" : false, "data": ["index": value.index, "masterHash": value.masterHash]]]) }
    .catch{err in
        if let bleErr = err as? BluenetError {
          callback([["error" : true, "data": getBluenetErrorString(bleErr)]])
        }
        else {
          callback([["error" : true, "data": "UNKNOWN ERROR IN \(label) \(err)"]])
        }
    }
}


func wrapHubMethodForBluenet(_ label: String, _ callback: @escaping RCTResponseSenderBlock, _ promise: Promise<[UInt8]>) {
  LOGGER.info("BluenetBridge: Called \(label)")
  promise
    .done{ value in
      let hubResult = HubParser(value)
      if (hubResult.valid) {
        callback([["error" : false, "data": [
          "protocolVersion": hubResult.protocolVersion,
          "type":            hubResult.typeString,
          "dataType":        hubResult.dataType,
          "errorType":       hubResult.errorType,
          "message":         hubResult.message
        ]]])
      }
      else {
        callback([["error" : true, "data": "INVALID_REPLY"]])
      }
    }
    .catch{err in
      if let bleErr = err as? BluenetError {
        callback([["error" : true, "data": getBluenetErrorString(bleErr)]])
      }
      else {
        callback([["error" : true, "data": "UNKNOWN ERROR IN \(label) \(err)"]])
      }
  }
}
