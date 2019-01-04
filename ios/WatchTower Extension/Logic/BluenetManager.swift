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
    
    var pendingTasks = [BleTask]()
    var performingStone : String? = nil
    var pendingStones = [String:Any]()
    
    init() {
        self.bluenet = Bluenet()
        self.listOfCrownstones = SortedCrownstoneCollection()
        self.unsubscribeArray = [voidCallback]()
    }
    
    public func subscribeEvents() {
        self.unsubscribeArray.append(eventBus.on(Event.newApplicationContext, self._storeKeySets ))
        
        self.unsubscribeArray.append(bluenet.on("verifiedAdvertisementData",   { data in self._handleScan(data, verified: true ) }))
        self.unsubscribeArray.append(bluenet.on("unverifiedAdvertisementData", { data in self._handleScan(data, verified: false) }))
    }
    
    func _storeKeySets(_ applicationContext: Any) {
        if let context = applicationContext as? [String: Any] {
            if let keysets = context["keysets"] {
                if let castSets = keysets as? [String: [String:String]] {
                    keySets = castSets
                    self._applyKeySets()
                }
            }
        }
    }
    
    func _applyKeySets() {
        if keySets == nil { return }
        
        var sets = [KeySet]()
        for (referenceId, set) in keySets! {
            sets.append(KeySet(adminKey: set["adminKey"], memberKey: set["memberKey"], guestKey: set["guestKey"], referenceId: referenceId))
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
            delay(2.5, {
                print("Locking the list", self.listOfCrownstones.items)
                self.listOfCrownstones.lock = true }
            )
            self.continueTasks()
        }
       
    }
    
    func continueTasks() {
        if (self.pendingTasks.count > 0) {
            if (self.pendingTasks[0].started == false) {
                if (self.pendingTasks[0].handleSession == nil && self.performingStone != nil) {
                    self.pendingStones.removeValue(forKey: self.performingStone!)
                }
                
                self.performingStone = self.pendingTasks[0].handleSession
                print("EXECUTING", self.pendingTasks[0].label, self.pendingTasks[0].handleSession)
                self.pendingTasks[0].started = true
                _ = self.pendingTasks[0].execute()
                    .done {
                        print("Finished", self.pendingTasks)
                        self.pendingTasks.removeFirst()
                        self.continueTasks()
                    }
                    .catch{ err in
                        print("Err", err, self.pendingTasks)
                        _ = self.bluenet.disconnect()
                        self.pendingTasks.removeFirst()
                        if (self.performingStone != nil) {
                            self.pendingStones.removeValue(forKey: self.performingStone!)
                        }
                        self.performingStone = nil
                        self.bluenet.wait(0.5).done{
                            self.continueTasks()
                        }
                    }
            }
        }
        eventBus.emit(Event.bleAction, true)
    }
    
 
    
    func _handleScan(_ data: Any, verified: Bool) {
        if let castData = data as? Advertisement {
            listOfCrownstones.load(advertisement: castData, verified: verified)
            if verified {
              if let referenceId = castData.referenceId {
                var handleDict = dataStore.store.dictionary(forKey: "handles")
                if var theDict = handleDict {
                  theDict[castData.handle] = true
                  print("Storing \(theDict) in handes")
                  dataStore.store.set(theDict as Any?, forKey: "handles")
                }
                else {
                  print("Storing \([castData.handle : true]) in handes")
                  dataStore.store.set([castData.handle : true] as Any?, forKey: "handles")
                }
                
                print("Storing \(referenceId) in \(castData.handle)")
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
        _ = self.bluenet.disconnect()
        self.pendingTasks.removeAll()
    }
    
    public func pause() {
        self.bluenet.stopScanning()
        self.bluenet.cancelAllActiveBroadcasts()
    }
    
    public func switchStone(_ handle: String, _ newState: Float) {
        self.pendingStones[handle] = newState
        
        self.pendingTasks.append(BleTask(started: false, completed: false, execute: { return self.bluenet.connect(handle)                  }, shouldBeConnectedToHandle: nil,    handleSession: handle, label: "connect"))
        self.pendingTasks.append(BleTask(started: false, completed: false, execute: { return self.bluenet.control.setSwitchState(newState) }, shouldBeConnectedToHandle: handle, handleSession: handle, label: "setSwitchState"))
        self.pendingTasks.append(BleTask(started: false, completed: false, execute: { return self.bluenet.control.disconnect()             }, shouldBeConnectedToHandle: nil,    handleSession: nil,    label: "disconnect"))
        
        self.continueTasks()
    }
  
  public func switchStoneBroadcast(_ referenceId: String, stoneId: UInt8, _ newState: Float) {
     _ = self.bluenet.broadcast.multiSwitch(referenceId: referenceId, stoneId: stoneId, switchState: newState)
  }
}
