//
//  BluenetManager.swift
//  WatchTower Extension
//
//  Created by Alex de Mulder on 28/11/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import WatchKit
import BluenetWatch
import PromiseKit


struct BleTask {
    var started: Bool
    var completed: Bool
    var execute: voidPromiseCallback
    var shouldBeConnectedToHandle: String?
    var handleSession: String?
    var label: String
}

class BluenetManager {
    public let bluenet : Bluenet!
    var unsubscribeArray : [voidCallback]!
    var keySets : [String: [String:String]]?
    
    public var listOfCrownstones : SortedCrownstoneCollection!

    init() {
        self.bluenet = Bluenet()
        self.listOfCrownstones = SortedCrownstoneCollection()
        self.unsubscribeArray = [voidCallback]()

        bluenet.setDevicePreferences(rssiOffset: 0, tapToToggle: false, ignoreForBehaviour: true, useBackgroundBroadcasts: false, useBaseBroadcasts: false, useTimeBasedNonce: false)
    }
    
    public func subscribeEvents() {
        self.unsubscribeArray.append(eventBus.on(Event.newApplicationContext, self._handleContext ))
        
        self.unsubscribeArray.append(bluenet.on("verifiedAdvertisementData",   { data in self._handleScan(data, verified: true ) }))
        self.unsubscribeArray.append(bluenet.on("unverifiedAdvertisementData", { data in self._handleScan(data, verified: false) }))
        //self.unsubscribeArray.append(bluenet.on("rawAdvertisementData", { data in self._debug(data) }))
    }
  
  func _debug(_ data: Any) {
    if let castData = data as? Advertisement {
      //print("RAW", castData.handle, castData.rssi, castData.referenceId, castData.serviceData, castData.scanResponse)
    }
  }
    
    func _handleContext(_ applicationContext: Any) {
        //print("I have received applicationContext", applicationContext)
        if let context = applicationContext as? [String: Any] {
            if let keysets = context["keysets"] {
                if let castSets = keysets as? [String: [String:String]] {
                    keySets = castSets
                    self._applyKeySets()
                }
            }
            if let locationState = context["locationState"] as? [String: Any] {
                var sphereId    : UInt8 = 0
                var deviceToken : UInt8 = 0
                var referenceId = "NO_REFERENCE_ID"
                if let oSphereUID   = locationState["sphereUID"]   as? NSNumber { sphereId    = oSphereUID.uint8Value }
                if let oDeviceToken = locationState["deviceToken"] as? NSNumber { deviceToken = self._processDeviceToken(oDeviceToken.uint8Value) }
                if let oReferenceId = locationState["referenceId"] as? String   { referenceId = oReferenceId }
                
                bluenet.setLocationState(
                    sphereUID: sphereId,
                    locationId: 0,
                    profileIndex: 0,
                    deviceToken: deviceToken,
                    referenceId: referenceId
                )
            }
        }
    }
    
    
    /**
        The format of the device token is as follows (bits)
 
                | 0 | 0 0 | 0 0 0 0 0 |
 
            first is wearable true: false
            second is the device index
            third is the user index
 
        This method will force this format.
            
     */
    func _processDeviceToken(_ deviceToken: UInt8) -> UInt8 {
        return deviceToken | UInt8(1) << 7
    }
    
    func _applyKeySets() {
        if keySets == nil { return }
        
        var sets = [KeySet]()
        for (referenceId, set) in keySets! {
            sets.append(KeySet(adminKey: set["adminKey"], memberKey: set["memberKey"], basicKey: set["basicKey"], localizationKey: set["localizationKey"], serviceDataKey: set["serviceDataKey"], referenceId: referenceId))
        }
        bluenet.loadKeysets(encryptionEnabled: true, keySets: sets)
    }
    
    deinit {
        self.stop()
        
        // clear event listeners
        for unsubCallback in self.unsubscribeArray { unsubCallback() }
        self.unsubscribeArray.removeAll()
    }
    
    public func start() {
        self.listOfCrownstones.lock = false
        self.listOfCrownstones.removeExpired()
        print("START")
        _ = bluenet.isReady().done {  _ in
            self.bluenet.startScanning()
            delay(1.0, {
                print("Locking the list", self.listOfCrownstones.items)
                self.listOfCrownstones.lock = true
            })
        }
       
    }
 
    
    func _handleScan(_ data: Any, verified: Bool) {
        if let castData = data as? Advertisement {
            listOfCrownstones.load(advertisement: castData, verified: verified)
            //print("Scan received", castData.handle, castData.rssi, castData.referenceId, castData.scanResponse, verified)
            if verified {
              if let referenceId = castData.referenceId {
                let handleDict = dataStore.store.dictionary(forKey: "handles")
                if var theDict = handleDict {
                  theDict[castData.handle] = true

                  dataStore.store.set(theDict as Any?, forKey: "handles")
                }
                else {
                  dataStore.store.set([castData.handle : true] as Any?, forKey: "handles")
                }
                
//                print("Storing \(referenceId) in \(castData.handle)")
                dataStore.store.set(referenceId, forKey: castData.handle)
                eventBus.emit(Event.newVerifiedAdvertisement, true)
              }
            }
            else {
               eventBus.emit(Event.newAdvertisement, true)
            }
        }
    }
    
    
    public func stop() {
        self.bluenet.stopScanning()
    }
    
    public func pause() {
        self.bluenet.stopScanning()
        self.bluenet.cancelAllActiveBroadcasts()
    }

  
    public func switchStoneBroadcast(_ referenceId: String, stoneId: UInt8, _ newState: UInt8) {
     _ = self.bluenet.broadcast.multiSwitch(referenceId: referenceId, stoneId: stoneId, switchState: newState)
    }

    public func turnOnCrownstone(_ referenceId: String, stoneId: UInt8) {
        _ = self.bluenet.broadcast.turnOn(referenceId: referenceId, stoneId: stoneId)
    }
}
