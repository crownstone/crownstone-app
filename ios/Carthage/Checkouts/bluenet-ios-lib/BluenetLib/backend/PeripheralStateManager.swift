//
//  PeripheralStateManager.swift
//  BluenetLib
//
//  Created by Alex de Mulder on 04/12/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation
import PromiseKit
import CoreBluetooth

/**
 
 The PeripheralStateManager (PSM)
 
 This class is the one governing what is broadcasted and how it does this.
 
 We differentiate between 3 states:
 1 - foreground base broadcasts
 2 - foreground active command broadcasts
 3 - background broadcasts
 
 
 1 - Foreground base broadcasts
 
 When advertising is enabled, and we're in the foreground, the base broadcast cycle is started. This is done with the baseRefreshTick.
 The payload of the base broadcast is updated every 30 seconds. If a new tick is triggered while an active broadcast(2) is running,
 we postpone the tick and resume it when the active commands end.
 
 The base broadcast has an emptry buffer at the moment, but it does carry the sphereUID and locationUID for the new behaviour localization update.
 It has to refresh to keep the nonce valid. See protocol for more info.
 
 
 2 - Active Command Broadcasts:
 Commands are loaded into the PSM in elements. These are entered into the loadElement method.
 These elements are class instances of BroadcastElement. They are queued in the PSM, appended and tracked.
 Once an element is loaded, the commandCycle starts.
 
 Each element keeps track of how long it has been broadcasted.
 
 CommandCycle:
    It updates the payload every 0.25 seconds. This is called the Command Tick (commandTick)
    The payload is determined by the first element in the queue. The referenceId and type of this element is applied to the entire BroadcastBuffer
    We then loop through the other elements, to see if they can join in the payload. We can fit a number of multiswitch commands in a buffer.
    Once a commandCycle is over (0.25 seconds), the _updateElementState method will sort the element list depending on broadcast timestamp. This interleaves
    the elements elegantly.
 
 When all required elements have been broadcast and the queue is empty, the command cycle ends and the baseTick continues.
 
 
 3 - Background Broadcasts
 
 On iOS we are stuck with the different types between foreground and background broadcasts.
 The background uses the same baseRefreshTick with the 30 second interval. The updateBaseAdvertisement is the one determining foregroudn or background.
 
---------------------
 
 Switching between 1 and 3:
 
 There are lifecycle methods
     func applicationWillEnterForeground()
     func applicationDidEnterBackground()
 which are called by the application using the lib to ensure correct switching between foreground and background.
 On switching from foreground to background, all promises for all pending and busy elements are failed.
 
 --------------------
 
 The advertising boolean is a master enable/disable for the base ticks 1 and 3. It is triggered by the
 startAdvertising() and the stopAdvertising() functions.
 
 backgroundEnabled is an override to kill background advertising. The advertising will stop when the phone enters the background if this is false.
 
 the settings.devicePreferences contain the use useBackgroundBroadcasts and useBaseBroadcasts overrides.
 
 **/

class PeripheralStateManager {
    var settings: BluenetSettings
    var blePeripheralManager : BlePeripheralManager!
    var elements = [BroadcastElement]()
    
    var advertising = false
    var baseRefreshTickPostponed = false
    
    var runningBroadcastCycle = false
    var runningCommandCycle = false // this means there are active commands being broadcasted
    var backgroundEnabled: Bool
    let eventBus : EventBus!
    
    var timeOffsetMap = [String: Double]() // track time difference between crownstones and this phone per referenceId
    var timeStoneMap  = [String: Double]() // track time difference between crownstones and this phone per referenceId
    
    init(eventBus: EventBus, settings: BluenetSettings, backgroundEnabled: Bool = true) {
        self.blePeripheralManager = BlePeripheralManager()
        self.settings = settings
        self.eventBus = eventBus
        self.backgroundEnabled = backgroundEnabled
        
        // track time difference between crownstones and this phone per referenceId
        _ = self.eventBus.on("verifiedAdvertisementData", self._trackStoneTime)
        _ = self.eventBus.on("newKeysets",              { _ in self.updateAdvertisements() })
        _ = self.eventBus.on("newLocationState",       { _ in self.updateAdvertisements() })
        _ = self.eventBus.on("newDevicePreferences",   { _ in self.updateAdvertisements() })
    }
    
  

    /**   BACKGROUND STATE HANDLING METHODS **/
    func applicationWillEnterForeground() {
        print("Peripheral received application will enter foreground")
        self.stopBackgroundBroadcasts()
        self.startForegroundBroadcasts()
    }
    
    func applicationDidEnterBackground() {
        print("Peripheral received application did enter background")
        self.stopForegroundBroadcasts()
        self.startBackgroundBroadcasts()
    }
    
    func setBackgroundOperations(newBackgroundState: Bool) {
        self.backgroundEnabled = newBackgroundState
        
        // disable base background advertisements
        if newBackgroundState == false && self.settings.backgroundState && self.runningCommandCycle == false {
            self.stopBroadcasting()
        }
    }
    /** \ BACKGROUND STATE HANDLING METHODS **/
    
    
    func updateAdvertisements() {
        if (self.runningCommandCycle) {
            self._broadcastElements()
        }
        else if (self.runningBroadcastCycle) {
            self.updateBaseAdvertisement()
        }
    }
    
    #if os(iOS)
    /**   GLOBAL ADVERTISING STATE HANDLING METHODS, this is not used for watchOS as it has no background **/
    func startAdvertising() {
        self.advertising = true
        if self.settings.backgroundState {
            self.startBackgroundBroadcasts()
        }
        else {
            self.startForegroundBroadcasts()
        }
    }
    
    func stopAdvertising() {
        self.advertising = false
        if self.settings.backgroundState {
            self.stopBackgroundBroadcasts()
        }
        else {
            self.stopForegroundBroadcasts()
        }
    }
    #endif
    
    func stopBroadcasting() {
        self.blePeripheralManager.stopAdvertising()
    }
    /** \ GLOBAL ADVERTISING STATE HANDLING METHODS **/
    
    
    
// MARK: Foreground Methods
    /**   FOREGROUND METHODS **/
    func startForegroundBroadcasts() {
        if (self.advertising) {
            self._startForegroundBroadcasts()
        }
    }
    
    func _startForegroundBroadcasts() {
        if (self.runningBroadcastCycle == false) {
            self.baseRefreshTick()
        }
        else {
            self._refreshForegroundBroadcasts()
        }
    }
    
    func _refreshForegroundBroadcasts() {
        if (self.settings.devicePreferences.useBaseBroadcasts == false) {
            return self.stopBroadcasting()
        }
        
        if let referenceId = self.settings.locationState.referenceId {
            let bufferToBroadcast = BroadcastBuffer(referenceId: referenceId, type: .foregroundBase)
            self._broadcastBuffer(bufferToBroadcast)
        }
        else {
            self.stopBroadcasting()
            print("PROBLEM - updateBaseAdvertisement: No active referenceId")
        }
    }
    
    func stopForegroundBroadcasts() {
        // print("TEST: stopForegroundBroadcasts")
        // this will fail all promises and clear the buffers.
        // background broadcasting should be enabled after this.
        for element in self.elements {
            element.fail()
        }
        self.elements.removeAll()
        
        // officially end the command cycle if this was running
        if (self.runningCommandCycle) {
            self.endCommandCycle()
        }
        
        // finally, we stop the broadcasting of all active services
        self.stopBroadcasting()
    }
    
    public func stopActiveBroadcasts() {
        // print("TEST: stopForegroundBroadcasts")
        // this will fail all promises and clear the buffers.
        // background broadcasting should be enabled after this.
        for element in self.elements {
            element.fail()
        }
        self.elements.removeAll()
        
        // officially end the command cycle if this was running
        if (self.runningCommandCycle) {
            self.endCommandCycle()
        }
        
    }
    
   
/** \ FOREGROUND METHODS **/
    
    
    /**   COMMAND METHODS **/
    
    func loadElement(element: BroadcastElement) {
        // existing elements of the same type for the same stone will be overwritten (old switch 0, replaced by new switch 1)
        self._handleDuplicates(incomingElement: element)
        
        self.elements.append(element)
        self.broadcastCommand()
    }
    
    /** \ COMMAND METHODS **/
    
    
// MARK: Background Methods
    /**   BACKGROUND METHODS **/
    func startBackgroundBroadcasts() {
        if (self.backgroundEnabled == false || self.settings.devicePreferences.useBackgroundBroadcasts == false) {
            return self.stopBackgroundBroadcasts()
        }
        
        if (self.runningBroadcastCycle == false) {
            self.baseRefreshTick()
        }
        else {
            self._refreshBackgroundBroadcasts()
        }
    }
    
    func _refreshBackgroundBroadcasts() {
        if (self.backgroundEnabled == false || self.settings.devicePreferences.useBackgroundBroadcasts == false) {
            return self.stopBackgroundBroadcasts()
        }
        
        if let referenceId = self.settings.locationState.referenceId {
            if let key = self.settings.getLocalizationKey(referenceId: referenceId) {
                let uuids = BroadcastProtocol.getServicesForBackgroundBroadcast(locationState: self.settings.locationState, devicePreferences: self.settings.devicePreferences, key: key)
                self.blePeripheralManager.startAdvertisingArray(uuids: uuids)
            }
        }
    }
    
    func stopBackgroundBroadcasts() {
        self.stopBroadcasting()
    }
/** \ BACKGROUND METHODS **/
    
    
// MARK: functionality
    func broadcastCommand() {
        if (self.runningCommandCycle) {
            // update the buffer, a tick is scheduled anyway
            self._broadcastElements()
        }
        else {
            self.startCommandCycle()
        }
    }
    
    func startCommandCycle() {
        self.runningCommandCycle = true
        self.commandTick()
    }
    
    func endCommandCycle() {
        self.runningCommandCycle = false
        if (self.advertising == false) {
            self.stopBroadcasting()
        }
        else {
            if (self.baseRefreshTickPostponed == true) {
                self.baseRefreshTick()
            }
            else {
                // updateBaseAdvertisement assumes there is an active base tick.
                // If it was postponed, we can't use this and have to go through the baseRefreshTick
                self.updateBaseAdvertisement()
            }
        }
    }
    
    func commandTick() {
        // print("TEST: CommandTick")
        self.runningCommandCycle = true
        self._updateElementState()
        if (self.elements.count > 0) {
            self._broadcastElements()
            delay( 0.25, { self.commandTick() })
        }
        else {
            self.endCommandCycle()
        }
    }
    
    func baseRefreshTick() {
        // we check if we are allowed to do base refreshes or if we should stop. We can only do this if there is no active command cycle
        if (self.runningCommandCycle == false) {
            if self.settings.backgroundState {
                if (self.backgroundEnabled == false || self.settings.devicePreferences.useBackgroundBroadcasts == false) {
                    self.runningBroadcastCycle = false
                    return self.stopBroadcasting()
                }
            }
            else {
                if (self.settings.devicePreferences.useBackgroundBroadcasts == false) {
                    self.runningBroadcastCycle = false
                    return self.stopBroadcasting()
                }
            }
        }
            
        if (self.advertising) {
            self.runningBroadcastCycle = true
            if (self.runningCommandCycle == true) {
                self.baseRefreshTickPostponed = true
            }
            else {
                self.updateBaseAdvertisement()
                delay( 30, self.baseRefreshTick )
            }
        }
        else {
            if (runningBroadcastCycle) {
                self.runningBroadcastCycle = false
            }
        }
    }
    
    
    func updateBaseAdvertisement() {
        #if os(iOS)
//         print("TEST: updateBaseAdvertisement")
        if self.settings.backgroundState {
            self._refreshBackgroundBroadcasts()
        }
        else {
            self._refreshForegroundBroadcasts()
        }
        #endif
    }
    
    
    
   
    
    // MARK: Dev
    func advertiseArray(uuids: [UInt16]) {
        let broadcastUUIDs = BroadcastProtocol.convertUInt16ListToUUID(uuids)
        self.blePeripheralManager.startAdvertisingArray(uuids: broadcastUUIDs)
    }
    
    func advertiseArray(uuids: [CBUUID]) {
        self.blePeripheralManager.startAdvertisingArray(uuids: uuids)
    }
  
    
    // MARK: Util
    
    
    func _handleDuplicates(incomingElement: BroadcastElement) {
        switch (incomingElement.type) {
        case .multiSwitch:
            self._removeSimilarElements(incomingElement)
        default:
            return
        }
    }
    
    func _removeSimilarElements(_ incomingElement: BroadcastElement) {
        // check if blocks are finished
        for (i, element) in self.elements.enumerated().reversed() {
            if element.referenceId == incomingElement.referenceId && element.type == incomingElement.type && element.target == incomingElement.target {
                element.fail()
                self.elements.remove(at: i)
            }
        }
    }
    
    
    func _updateElementState() {
        for element in self.elements {
            element.stoppedBroadcasting()
        }
        
        // check if blocks are finished
        for (i, element) in self.elements.enumerated().reversed() {
            if element.completed {
                self.elements.remove(at: i)
            }
        }
        
        self.elements.sort(by: { element1, element2 in return element1.endTime < element2.endTime })
    }
    
    
    func _broadcastElements() {
        // check in which referenceId the first block to be advertised lives and what it's type is.
        let broadcastType = self.elements[0].type
        let broadcastReferenceId = self.elements[0].referenceId
        
        // create a buffer that will be broadcast
        let bufferToBroadcast = BroadcastBuffer(referenceId: broadcastReferenceId, type: broadcastType)

        // singular elements will immediately mark the buffer as full.
        for element in self.elements {
            if (bufferToBroadcast.accepts(element)) {
                bufferToBroadcast.loadElement(element)
                // if the buffer is now full, stop the loop.
                if (bufferToBroadcast.isFull()) {
                    break
                }
            }
        }
       
        // set everything in motion to advertise this buffer.
        self._broadcastBuffer(bufferToBroadcast)
    }
    
  
    func _broadcastBuffer(_ bufferToBroadcast: BroadcastBuffer) {
        let referenceIdOfBuffer = bufferToBroadcast.referenceId
        var time = getCurrentTimestampForCrownstone()
        if let offset = self.timeOffsetMap[referenceIdOfBuffer] {
            time -= offset
        }
        if (settings.setSessionId(referenceId: referenceIdOfBuffer) == false) {
            print("Error in _broadcastBuffer Invalid referenceId")
            return
        }
        
        if let localizationKey = self.settings.getLocalizationKey(referenceId: referenceIdOfBuffer) {
            let packet = bufferToBroadcast.getPacket(validationNonce: NSNumber(value:time).uint32Value)
            do {
                let otherUUIDs = try BroadcastProtocol.getUInt16ServiceNumbers(
                    locationState: self.settings.locationState,
                    devicePreferences: self.settings.devicePreferences,
                    protocolVersion: 0,
                    accessLevel: self.settings.userLevel,
                    key: localizationKey
                )
                
                var nonce = [UInt8]()
                for uuidNum in otherUUIDs {
                    nonce += Conversion.uint16_to_uint8_array(uuidNum)
                }
                
                do {
                    let encryptedUUID = try BroadcastProtocol.getEncryptedServiceUUID(referenceId: referenceIdOfBuffer, settings: self.settings, data: packet, nonce: nonce)
                    
                    var broadcastUUIDs = BroadcastProtocol.convertUInt16ListToUUID(otherUUIDs)
                    broadcastUUIDs.append(encryptedUUID)
                    self.blePeripheralManager.startAdvertisingArray(uuids: broadcastUUIDs)
                    bufferToBroadcast.blocksAreBroadcasting()
                }
                catch let err {
                    print("Could not get uint16 ids", err)
                }
            }
            catch let err {
                print("Could not get encrypted service uuid", err)
            }
        }
    }

    
    // track time difference between crownstones and this phone per referenceId
    func _trackStoneTime(data: Any) {
        if let castData = data as? Advertisement {
            if let scanResponse = castData.scanResponse {
                // only use times that are set
                if scanResponse.timeSet == false {
                    return
                }
                
                if let refId = castData.referenceId {
                    let currentTimestamp = getCurrentTimestampForCrownstone()
                    let diff = currentTimestamp - scanResponse.timestamp
                    
                    self.timeStoneMap[castData.handle] = scanResponse.timestamp
                    
                    if diff > 300 {
                        print("WARN: LARGE TIME DIFFERENCE!", diff)
                    }
                    
                    if (self.timeOffsetMap[refId] != nil) {
                        self.timeOffsetMap[refId] = 0.9 * self.timeOffsetMap[refId]! + 0.1*diff
                    }
                    else {
                        self.timeOffsetMap[refId] = diff
                    }
                }
            }
        }
    }
    
}
