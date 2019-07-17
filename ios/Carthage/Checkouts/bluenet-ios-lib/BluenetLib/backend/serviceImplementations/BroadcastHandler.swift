//
//  broadcast.swift
//  BluenetLib
//
//  Created by Alex de Mulder on 04/12/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation
import PromiseKit
import CoreBluetooth

public class BroadcastHandler {
    let peripheralStateManager : PeripheralStateManager!
    var settings : BluenetSettings!
    let eventBus : EventBus!
    
    
    init (peripheralStateManager: PeripheralStateManager, eventBus: EventBus, settings: BluenetSettings) {
        self.peripheralStateManager = peripheralStateManager
        self.settings   = settings
        self.eventBus   = eventBus
    }
    

    
    public func multiSwitch(referenceId: String, stoneId: UInt8, switchState: Float) -> Promise<Void> {
        return Promise<Void> { seal in
            
            let switchState = NSNumber(value: min(1,max(0,switchState))*100).uint8Value
            let packet  = BroadcastStone_SwitchPacket(crownstoneId: stoneId, state: switchState).getPacket()
            let element = BroadcastElement(referenceId: referenceId, type: .multiSwitch, packet: packet, seal: seal, target: stoneId)
            
            self.peripheralStateManager.loadElement(element: element)
        }
    }
    
    
    /**
     * Method for setting the time on a crownstone that has lost the time.
     * This is a targeted message with a validation nonce that is most likely only valid for one specific crownstone.
     * It therefore cannot be mixed with other messages of the same type.
     */
    public func setTime(referenceId: String, stoneId: UInt8, time: UInt32? = nil, customValidationNonce: UInt32? = nil) -> Promise<Void> {
        return Promise<Void> { seal in
            
            // allow for a custom time to be set.
            var timeToUse = NSNumber(value:getCurrentTimestampForCrownstone()).uint32Value
            if let customTime = time {
                timeToUse = customTime
            }
            
            let packet  = BroadcastStone_SetTimePacket(crownstoneId: stoneId, time: timeToUse).getPacket()
            let element = BroadcastElement(
                referenceId: referenceId,
                type: .setTime,
                packet: packet,
                seal: seal,
                target: stoneId,
                singular: true,
                customValidationNonce: customValidationNonce
            )
            
            self.peripheralStateManager.loadElement(element: element)
        }
    }
    
    
    
    /**
     * Method for updating the time for all crownstones that roughly have this time already. This can be used for syncing the time.
     **/
    public func updateTime(referenceId: String, time: UInt32? = nil) -> Promise<Void> {
        return Promise<Void> { seal in
            
            // allow for a custom time to be set.
            var timeToUse = NSNumber(value:getCurrentTimestampForCrownstone()).uint32Value
            if let customTime = time {
                timeToUse = customTime
            }
            
            let element = BroadcastElement(
                referenceId: referenceId,
                type: .updateTime,
                packet: Conversion.uint32_to_uint8_array(timeToUse),
                seal: seal,
                singular: true
            )
            
            self.peripheralStateManager.loadElement(element: element)
        }
    }
    
    
    
    
}
