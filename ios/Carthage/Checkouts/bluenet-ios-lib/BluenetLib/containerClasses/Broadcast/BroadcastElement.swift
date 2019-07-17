//
//  BroadcastBlock.swift
//  BluenetLib
//
//  Created by Alex de Mulder on 13/12/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation
import PromiseKit

let DEFAULT_BROADCAST_DURATION : Double = 1.5

class BroadcastElement {
    var type : BroadcastType
    var singular = false
    var seal : Resolver<Void>
    var packet : [UInt8]
    var requiredDuration : Double = DEFAULT_BROADCAST_DURATION
    var completed = false
    var referenceId : String
    
    var startTime : Double = 0
    var endTime : Double = 0
    
    var totalTimeBroadcasted : Double = 0
    var broadcasting = false
    var target : UInt8? = nil
    
    var customValidationNonce : UInt32?
    
    init(
        referenceId: String, type: BroadcastType, packet: [UInt8], seal: Resolver<Void>,             // required
        target: UInt8? = nil, singular: Bool = false, duration: Double = DEFAULT_BROADCAST_DURATION, customValidationNonce: UInt32? = nil // options
        ) {
        
        self.referenceId = referenceId
        self.type = type
        self.packet = packet
        self.seal = seal
        self.singular = singular
        self.target = target
        self.requiredDuration = duration
        self.customValidationNonce = customValidationNonce
    }
    
    func getSize() -> Int {
        return packet.count
    }
    
    func getPacket() -> [UInt8] {
        return packet
    }
    
    func broadcastHasStarted() {
        self.startTime = Date().timeIntervalSince1970
        self.broadcasting = true
    }
    
    func fail() {
        self.seal.reject(BluenetError.BROADCAST_ABORTED)
        self.completed = true
    }
    
    func stoppedBroadcasting() {
        if self.broadcasting {
            self.endTime = Date().timeIntervalSince1970
            self.broadcasting = false
            
            let broadcastTime = self.endTime - self.startTime
            self.totalTimeBroadcasted += broadcastTime
            if (self.totalTimeBroadcasted >= self.requiredDuration) {
                self.seal.fulfill(())
                self.completed = true
            }
        }
        
    }
}
