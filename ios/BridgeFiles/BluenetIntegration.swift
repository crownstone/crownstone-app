
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
  
  @objc func setKeySets(_ keySets: [NSDictionary], callback: RCTResponseSenderBlock) {
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
  
  @objc func isReady(_ callback: @escaping RCTResponseSenderBlock) {
    wrapForBluenet("isReady", callback, GLOBAL_BLUENET.bluenet.isReady())
  }
  
  @objc func isPeripheralReady(_ callback: @escaping RCTResponseSenderBlock) {
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
    wrapForBluenet("connect", callback, GLOBAL_BLUENET.bluenet.connect(handle, referenceId: referenceId))
  }
  
  @objc func phoneDisconnect(_ callback: @escaping RCTResponseSenderBlock) {
    wrapForBluenet("phoneDisconnect", callback, GLOBAL_BLUENET.bluenet.disconnect())
  }
  
  @objc func disconnectCommand(_ callback: @escaping RCTResponseSenderBlock) {
    wrapForBluenet("disconnectCommand", callback, GLOBAL_BLUENET.bluenet.control.disconnect())
  }
  
  @objc func toggleSwitchState(_ stateForOn: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    wrapForBluenet("toggleSwitchState", callback, GLOBAL_BLUENET.bluenet.control.toggleSwitchState(stateForOn: stateForOn.uint8Value))
  }
  
  @objc func setSwitchState(_ state: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    wrapForBluenet("setSwitchState", callback, GLOBAL_BLUENET.bluenet.control.setSwitchState(state.uint8Value))
  }
  
  @objc func getSwitchState(_ callback: @escaping RCTResponseSenderBlock) {
    wrapForBluenet("getSwitchState", callback, GLOBAL_BLUENET.bluenet.state.getSwitchState())
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
  
  @objc func requestLocation(_ callback: @escaping RCTResponseSenderBlock) -> Void {
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
  
  
  @objc func finalizeFingerprint(_ sphereId: String, locationId: String, callback: RCTResponseSenderBlock) -> Void {
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
  @objc func clearTrackedBeacons(_ callback: RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called clearTrackedBeacons")
    GLOBAL_BLUENET.bluenetLocalization.clearTrackedBeacons()
    callback([["error" : false]])
  }
  
  
  @objc func clearFingerprints() {
    LOGGER.info("BluenetBridge: Called clearFingerprints")
    GLOBAL_BLUENET.classifier.resetAllTrainingData()
  }
  
  @objc func clearFingerprintsPromise(_ callback: RCTResponseSenderBlock) {
    LOGGER.info("BluenetBridge: Called clearFingerprintsPromise")
    GLOBAL_BLUENET.classifier.resetAllTrainingData()
    callback([["error" : false]])
  }
  
  @objc func loadFingerprint(_ sphereId: String, locationId: String, fingerprint: String) -> Void {
    LOGGER.info("BluenetBridge: Called loadFingerprint \(sphereId) \(locationId)")
    GLOBAL_BLUENET.classifier.loadTrainingData(locationId, referenceId: sphereId, trainingData: fingerprint)
  }
  
  @objc func commandFactoryReset(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("commandFactoryReset", callback, GLOBAL_BLUENET.bluenet.control.commandFactoryReset())
  }
  
  @objc func getHardwareVersion(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("getHardwareVersion", callback, GLOBAL_BLUENET.bluenet.device.getHardwareRevision())
  }
  
  @objc func getFirmwareVersion(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("getFirmwareVersion", callback, GLOBAL_BLUENET.bluenet.device.getFirmwareRevision())
  }
  
  @objc func getBootloaderVersion(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("getBootloaderVersion", callback, GLOBAL_BLUENET.bluenet.device.getBootloaderRevision())
  }

  
  @objc func getMACAddress(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("getMACAddress", callback, GLOBAL_BLUENET.bluenet.setup.getMACAddress())
  }
  
  @objc func clearErrors(_ errors: NSDictionary, callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("clearErrors", callback, GLOBAL_BLUENET.bluenet.control.clearError(errorDict: errors))
  }
  
  @objc func restartCrownstone(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("restartCrownstone", callback, GLOBAL_BLUENET.bluenet.control.reset())
  }
  
  @objc func recover(_ crownstoneHandle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("recover", callback, GLOBAL_BLUENET.bluenet.control.recoverByFactoryReset(crownstoneHandle))
  }
  
  @objc func getBehaviourDebugInformation(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("getBehaviourDebugInformation", callback, GLOBAL_BLUENET.bluenet.debug.getBehaviourDebugInformation())
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
  
  @objc func setupCrownstone(_ data: NSDictionary, callback: @escaping RCTResponseSenderBlock) -> Void {
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
    let meshAccessAddress  = data["meshAccessAddress"] as? String // legacy
    let ibeaconUUID        = data["ibeaconUUID"] as? String
    let ibeaconMajor       = data["ibeaconMajor"] as? NSNumber
    let ibeaconMinor       = data["ibeaconMinor"] as? NSNumber
    
   
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
      meshAccessAddress != nil &&
      ibeaconUUID != nil &&
      ibeaconMajor != nil &&
      ibeaconMinor != nil) {
      GLOBAL_BLUENET.bluenet.setup.setup(
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
        meshAccessAddress: meshAccessAddress!,
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
      callback([["error" : true, "data": "Missing one of the datafields required for setup. 1\(crownstoneId != nil) 2\(sphereId != nil) 3\(adminKey != nil) 4\(memberKey != nil) 5\(basicKey != nil) 6\(localizationKey != nil) 7\(serviceDataKey != nil) 8\(meshApplicationKey != nil) 9\(meshNetworkKey != nil) 10\(meshDeviceKey != nil) 11\(meshAccessAddress != nil) 12\(ibeaconUUID != nil) 13\(ibeaconMajor != nil) 14\(ibeaconMinor != nil)"]])
    }
  }
  
  @objc func multiSwitch(_ arrayOfStoneSwitchPackets: [NSDictionary], callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("multiSwitch", callback, GLOBAL_BLUENET.bluenet.mesh.multiSwitch(stones: arrayOfStoneSwitchPackets as! [[String : NSNumber]]))
  }
  
  
  
  @objc func broadcastBehaviourSettings(_ referenceId: String, enabled: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("setBehaviourSettings", callback, GLOBAL_BLUENET.bluenet.broadcast.setBehaviourSettings(referenceId: referenceId, enabled: enabled.boolValue))
  }
  
  
  @objc func turnOnMesh(_ arrayOfStoneSwitchPackets: [NSDictionary], callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("turnOnMesh", callback, GLOBAL_BLUENET.bluenet.mesh.turnOn(stones: arrayOfStoneSwitchPackets as! [[String : NSNumber]]))
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
  
  @objc func setupPutInDFU(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("setupPutInDFU", callback, GLOBAL_BLUENET.bluenet.control.putInDFU())
  }
  
  @objc func putInDFU(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("putInDFU", callback, GLOBAL_BLUENET.bluenet.control.putInDFU())
  }
  
  @objc func performDFU(_ handle: String, uri: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    let firmwareURL = URL(fileURLWithPath: uri)
    wrapForBluenet("performDFU", callback, GLOBAL_BLUENET.bluenet.dfu.startDFU(handle: handle, firmwareURL: firmwareURL))
  }
  
  @objc func setupFactoryReset(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("setupFactoryReset", callback, GLOBAL_BLUENET.bluenet.setup.factoryReset())
  }
  
  @objc func bootloaderToNormalMode(_ handle: String, callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("bootloaderToNormalMode", callback, GLOBAL_BLUENET.bluenet.dfu.bootloaderToNormalMode(handle: handle))
  }

  @objc func setTime(_ time: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("setTime", callback, GLOBAL_BLUENET.bluenet.control.setTime(time))
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

  
  @objc func allowDimming(_ allow: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    let allowBool = allow.boolValue
    wrapForBluenet("allowDimming", callback, GLOBAL_BLUENET.bluenet.control.allowDimming(allow: allowBool))
  }
  
  @objc func lockSwitch(_ lock: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    let lockBool = lock.boolValue
    wrapForBluenet("lockSwitch", callback, GLOBAL_BLUENET.bluenet.control.lockSwitch(lock: lockBool))
  }
  
  @objc func setSwitchCraft(_ state: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    let stateBool = state.boolValue
    wrapForBluenet("setSwitchCraft", callback, GLOBAL_BLUENET.bluenet.config.setSwitchcraft( enabled: stateBool))
  }
  
  @objc func setTapToToggle(_ state: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    let stateBool = state.boolValue
    wrapForBluenet("setTapToToggle", callback, GLOBAL_BLUENET.bluenet.config.setTapToToggle(enabled: stateBool))
  }
  
  
  @objc func getTapToToggleThresholdOffset(callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("getTapToToggleThresholdOffset", callback, GLOBAL_BLUENET.bluenet.config.getTapToToggleThresholdOffset())
  }
  
  
  @objc func setTapToToggleThresholdOffset(_ state: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("setTapToToggleThresholdOffset", callback, GLOBAL_BLUENET.bluenet.config.setTapToToggleThresholdOffset(threshold: state.int8Value))
  }
  
  @objc func meshSetTime(_ time: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("meshSetTime", callback, GLOBAL_BLUENET.bluenet.mesh.setTime(time: time.uint32Value))
  }
  
  
  @objc func sendNoOp(_  callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("sendNoOp", callback, GLOBAL_BLUENET.bluenet.control.sendNoOp())
  }
  
  @objc func sendMeshNoOp(_ callback: @escaping RCTResponseSenderBlock) -> Void {
     wrapForBluenet("meshSetTime", callback, GLOBAL_BLUENET.bluenet.mesh.sendNoOp())
  }
  
  
  @objc func setMeshChannel(_ channel: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("setMeshChannel", callback,
       GLOBAL_BLUENET.bluenet.config.setMeshChannel(channel) // set channel
        .then{_ in return GLOBAL_BLUENET.bluenet.waitToWrite()} // wait to store
        .then{_ in return GLOBAL_BLUENET.bluenet.control.reset()} // reset
      )
  }
  
  @objc func getTrackingState(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called getTrackingState")
    callback([["error" : false, "data": GLOBAL_BLUENET.bluenetLocalization.getTrackingState() ]])
  }
  
  
  @objc func isDevelopmentEnvironment(_ callback: @escaping RCTResponseSenderBlock) -> Void {
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
  
  @objc func canUseDynamicBackgroundBroadcasts(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("canUseDynamicBackgroundBroadcasts", callback, BluenetLib.BroadcastProtocol.useDynamicBackground())
  }
  
  @objc func setCrownstoneNames(_ names: NSDictionary) {
    print("BluenetBridge: Called SETTING setCrownstoneNames")
    GLOBAL_BLUENET.watchStateManager.loadState("crownstoneNames", names)
  }


  @objc func setupPulse(_ callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("setupPulse", callback, GLOBAL_BLUENET.bluenet.control.pulse())
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
        self.sendEvent(withName: "crownstoneAdvertisementReceived", body: castData.handle)
      }
    })
  }
  
  @objc func unsubscribeUnverified() {
    GLOBAL_BLUENET.bluenetClearUnverified()
  }
  
  @objc func initBroadcasting() {
    GLOBAL_BLUENET.bluenet.startPeripheral()
  }
  
  @objc func checkBroadcastAuthorization(_ callback: @escaping RCTResponseSenderBlock) {
    callback([["error" : false, "data": GLOBAL_BLUENET.bluenet.checkBroadcastAuthorization() ]])
  }
  
  @objc func addBehaviour(_ data: NSDictionary, callback: @escaping RCTResponseSenderBlock) -> Void {
    do {
      let behaviour = try BehaviourDictionaryParser(data, dayStartTimeSecondsSinceMidnight: 4*3600)
      wrapBehaviourMethodForBluenet("addBehaviour", callback, GLOBAL_BLUENET.bluenet.behaviour.addBehaviour(behaviour: behaviour))
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
  
  @objc func updateBehaviour(_ data: NSDictionary, callback: @escaping RCTResponseSenderBlock) -> Void {
    do {
      let behaviour = try BehaviourDictionaryParser(data, dayStartTimeSecondsSinceMidnight: 4*3600)
      if let index = behaviour.indexOnCrownstone {
        wrapBehaviourMethodForBluenet("updateBehaviour", callback, GLOBAL_BLUENET.bluenet.behaviour.replaceBehaviour(index: index, behaviour: behaviour))
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
  
  @objc func getBehaviour(_  index: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called getBehaviour")
    GLOBAL_BLUENET.bluenet.behaviour.getBehaviour(index: index.uint8Value)
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
  
  @objc func removeBehaviour(_ index: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapBehaviourMethodForBluenet("removeBehaviour", callback, GLOBAL_BLUENET.bluenet.behaviour.removeBehaviour(index: index.uint8Value))
  }
    
  @objc func syncBehaviours(_ behaviours: [NSDictionary], callback: @escaping RCTResponseSenderBlock) -> Void {
    LOGGER.info("BluenetBridge: Called syncBehaviours")
    let syncer = BehaviourSyncer(bluenet: GLOBAL_BLUENET.bluenet, behaviourDictionaryArray: behaviours, dayStartTimeSecondsSinceMidnight: 4*3600)
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
  
  @objc func setSunTimesViaConnection(_ sunriseSecondsSinceMidnight: NSNumber, sundownSecondsSinceMidnight: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
    wrapForBluenet("setSunTimes", callback, GLOBAL_BLUENET.bluenet.config.setSunTimes(sunriseSecondsSinceMidnight: sunriseSecondsSinceMidnight.uint32Value, sunsetSecondsSinceMidnight: sundownSecondsSinceMidnight.uint32Value))
  }
  
  
  @objc func registerTrackedDevice(
    _ trackingNumber: NSNumber,
    locationUid: NSNumber,
    profileId: NSNumber,
    rssiOffset: NSNumber,
    ignoreForPresence: NSNumber,
    tapToToggleEnabled: NSNumber,
    deviceToken: NSNumber,
    ttlMinutes: NSNumber,
    callback: @escaping RCTResponseSenderBlock) {
    wrapForBluenet("registerTrackedDevice", callback,
      GLOBAL_BLUENET.bluenet.control.registerTrackedDevice(
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
  
  
  @objc func trackedDeviceHeartbeat(
    _ trackingNumber: NSNumber,
    locationUid: NSNumber,
    deviceToken: NSNumber,
    ttlMinutes: NSNumber,
    callback: @escaping RCTResponseSenderBlock) {
    wrapForBluenet("trackedDeviceHeartbeat", callback,
                   GLOBAL_BLUENET.bluenet.control.trackedDeviceHeartbeat(
                    trackingNumber: trackingNumber.uint16Value,
                    locationId: locationUid.uint8Value,
                    deviceToken: deviceToken.uint32Value,
                    ttlMinutes: ttlMinutes.uint8Value
    ))
  }
    
    
  @objc func broadcastUpdateTrackedDevice(
    _ referenceId: String,
    trackingNumber: NSNumber,
    locationUid: NSNumber,
    profileId: NSNumber,
    rssiOffset: NSNumber,
    ignoreForPresence: NSNumber,
    tapToToggleEnabled: NSNumber,
    deviceToken: NSNumber,
    ttlMinutes: NSNumber,
    callback:  @escaping RCTResponseSenderBlock) {
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
  @objc func switchRelay(_ state: NSNumber, callback: @escaping RCTResponseSenderBlock) {
     LOGGER.info("BluenetBridge: Called setSwitchState")
     GLOBAL_BLUENET.bluenet.control.switchRelay(state.uint8Value)
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
   
  @objc func getCrownstoneUptime(_ callback: @escaping RCTResponseSenderBlock) {
      LOGGER.info("BluenetBridge: Called getCrownstoneUptime")
      GLOBAL_BLUENET.bluenet.debug.getUptime()
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
  
  @objc func getAdcRestarts(_ callback: @escaping RCTResponseSenderBlock) {
    LOGGER.info("BluenetBridge: Called getAdcRestarts")
    GLOBAL_BLUENET.bluenet.debug.getAdcRestarts()
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
  
   @objc func getSwitchHistory(_ callback: @escaping RCTResponseSenderBlock) {
     LOGGER.info("BluenetBridge: Called getSwitchHistory")
     GLOBAL_BLUENET.bluenet.debug.getSwitchHistory()
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
  
   @objc func getPowerSamples(_ type: String, callback: @escaping RCTResponseSenderBlock) {
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

      GLOBAL_BLUENET.bluenet.debug.getPowerSamples(type: typeEnum)
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
  
  @objc func setUartKey(_ uartKey: String, callback: @escaping RCTResponseSenderBlock) {
    wrapForBluenet("setUartKey", callback, GLOBAL_BLUENET.bluenet.config.setUartKey(uartKey))
  }
  
  
  @objc func transferHubTokenAndCloudId(_ hubToken: String, cloudId: String, callback: @escaping RCTResponseSenderBlock) {
    let payload = HubPacketGenerator.tokenSphereIdPacket(hubToken: hubToken, cloudId: cloudId)
    LOGGER.info("BluenetBridge: Called transferHubTokenAndCloudId")
    GLOBAL_BLUENET.bluenet.hub.sendHubData(EncryptionOption.noEncryption.rawValue, payload: payload)
      .done{ value in
        let hubResult = HubParser(value)
        if (hubResult.valid) {
          callback([["error" : false, "data": [
            "protocolVersion": hubResult.protocolVersion,
            "type":            hubResult.typeString,
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
          callback([["error" : true, "data": "UNKNOWN ERROR IN transferHubTokenAndCloudId \(err)"]])
        }
    }
  }
  

  @objc func getMinSchedulerFreeSpace(_ callback: @escaping RCTResponseSenderBlock) {
      wrapForBluenet("getMinSchedulerFreeSpace", callback, GLOBAL_BLUENET.bluenet.debug.getMinSchedulerFreeSpace())
  }
  
  @objc func getLastResetReason(_ callback: @escaping RCTResponseSenderBlock) {
      wrapForBluenet("getLastResetReason", callback, GLOBAL_BLUENET.bluenet.debug.getLastResetReason())
  }
  
  
  @objc func getGPREGRET(_ callback: @escaping RCTResponseSenderBlock) {
      wrapForBluenet("getGPREGRET", callback, GLOBAL_BLUENET.bluenet.debug.getGPREGRET())
  }
  
  
  @objc func getAdcChannelSwaps(_ callback: @escaping RCTResponseSenderBlock) {
      wrapForBluenet("getAdcChannelSwaps", callback, GLOBAL_BLUENET.bluenet.debug.getAdcChannelSwaps())
  }
  
  
  @objc func setSoftOnSpeed(_ speed: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    wrapForBluenet("setSoftOnSpeed", callback, GLOBAL_BLUENET.bluenet.config.setSoftOnSpeed(speed))
  }
  
  @objc func getSoftOnSpeed(_ speed: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    wrapForBluenet("getSoftOnSpeed", callback, GLOBAL_BLUENET.bluenet.config.getSoftOnSpeed())
  }
  
  
   @objc func switchDimmer(_ state: NSNumber, callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("switchDimmer", callback, GLOBAL_BLUENET.bluenet.control.switchPWM(state.uint8Value))
   }
     
   @objc func getResetCounter(_ callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("getResetCounter", callback, GLOBAL_BLUENET.bluenet.state.getResetCounter())
   }

   
   @objc func getSwitchcraftThreshold(_ callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("getSwitchcraftThreshold", callback, GLOBAL_BLUENET.bluenet.config.getSwitchcraftThreshold())
   }
   
   @objc func setSwitchcraftThreshold(_ value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("setSwitchcraftThreshold", callback, GLOBAL_BLUENET.bluenet.config.setSwitchcraftThreshold(value: value.floatValue))
   }
   
   @objc func getMaxChipTemp(_ callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("getMaxChipTemp", callback, GLOBAL_BLUENET.bluenet.config.getMaxChipTemp())
   }
   
   @objc func setMaxChipTemp(_ value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("setMaxChipTemp", callback, GLOBAL_BLUENET.bluenet.config.setMaxChipTemp(value: value.int8Value))
   }
   
   @objc func getDimmerCurrentThreshold(_ callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("getDimmerCurrentThreshold", callback, GLOBAL_BLUENET.bluenet.config.getDimmerCurrentThreshold())
   }
   
   @objc func setDimmerCurrentThreshold(_ value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("setDimmerCurrentThreshold", callback, GLOBAL_BLUENET.bluenet.config.setDimmerCurrentThreshold(value: value.uint16Value))
   }
   
   @objc func getDimmerTempUpThreshold(_ callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("getDimmerTempUpThreshold", callback, GLOBAL_BLUENET.bluenet.config.getDimmerTempUpThreshold())
   }
   
   @objc func setDimmerTempUpThreshold(_ value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("setDimmerTempUpThreshold", callback, GLOBAL_BLUENET.bluenet.config.setDimmerTempUpThreshold(value: value.floatValue))
   }
   
   @objc func getDimmerTempDownThreshold(_ callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("getDimmerTempDownThreshold", callback, GLOBAL_BLUENET.bluenet.config.getDimmerTempDownThreshold())
   }
   
   @objc func setDimmerTempDownThreshold(_ value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("setDimmerTempDownThreshold", callback, GLOBAL_BLUENET.bluenet.config.setDimmerTempDownThreshold(value: value.floatValue))
   }
   
   @objc func getVoltageZero(_ callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("getVoltageZero", callback, GLOBAL_BLUENET.bluenet.config.getVoltageZero())
   }
   
   @objc func setVoltageZero(_ value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("setVoltageZero", callback, GLOBAL_BLUENET.bluenet.config.setVoltageZero(value: value.int32Value))
   }
   
   @objc func getCurrentZero(_ callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("getCurrentZero", callback, GLOBAL_BLUENET.bluenet.config.getCurrentZero())
   }
   
   @objc func setCurrentZero(_ value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("setCurrentZero", callback, GLOBAL_BLUENET.bluenet.config.setCurrentZero(value: value.int32Value))
   }
   
   @objc func getPowerZero(_ callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("getPowerZero", callback, GLOBAL_BLUENET.bluenet.config.getPowerZero())
   }
   
   @objc func setPowerZero(_ value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("setPowerZero", callback, GLOBAL_BLUENET.bluenet.config.setPowerZero(value: value.int32Value))
   }
   
   @objc func getVoltageMultiplier(_ callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("getVoltageMultiplier", callback, GLOBAL_BLUENET.bluenet.config.getVoltageMultiplier())
   }
   
   @objc func setVoltageMultiplier(_ value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("setVoltageMultiplier", callback, GLOBAL_BLUENET.bluenet.config.setVoltageMultiplier(value: value.floatValue))
   }
   
   @objc func getCurrentMultiplier(_ callback: @escaping RCTResponseSenderBlock) {
      wrapForBluenet("getCurrentMultiplier", callback, GLOBAL_BLUENET.bluenet.config.getCurrentMultiplier())
   }
   
   @objc func setCurrentMultiplier(_ value: NSNumber, callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("setCurrentMultiplier", callback, GLOBAL_BLUENET.bluenet.config.setCurrentMultiplier(value: value.floatValue))
   }
   
   @objc func setUartState(_ state: NSNumber, callback: @escaping RCTResponseSenderBlock) {
     wrapForBluenet("setUartState", callback, GLOBAL_BLUENET.bluenet.config.setUartState(state))
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
