//
//  MeshPackets.swift
//  BluenetLib
//
//  Created by Alex de Mulder on 03/02/2017.
//  Copyright © 2017 Alex de Mulder. All rights reserved.
//

import Foundation

class StoneKeepAlivePacket {
    var crownstoneId  : UInt8 = 0
    var actionAndState : UInt8 = 0
    
    convenience init(crownstoneId: UInt8, action: Bool, state: Float) {
        let switchState = NSNumber(value: min(1,max(0,state))*100).uint8Value
        self.init(crownstoneId: crownstoneId, action: action, state: switchState)
    }
    
    convenience init(crownstoneId: UInt8, action: Bool, state: UInt8) {
        var combinedState = state
        if (action == false) {
            combinedState = 255
        }
        self.init(crownstoneId: crownstoneId, actionAndState: combinedState)
    }
    
    init(crownstoneId: UInt8, actionAndState: UInt8) {
        self.crownstoneId = crownstoneId
        self.actionAndState = actionAndState
    }
    
    
    func getPacket() -> [UInt8] {
        var arr = [UInt8]()
        arr.append(self.crownstoneId)
        arr.append(self.actionAndState)
        return arr
    }
}


class MeshKeepAlivePacket {
    var type : UInt8
    var timeout : UInt16 = 0
    var numberOfItems : UInt8  = 0
    var packets : [StoneKeepAlivePacket]!
    
    init(type: MeshKeepAliveTypes, timeout: UInt16, packets: [StoneKeepAlivePacket]) {
        self.type = type.rawValue;
        self.timeout = timeout
        self.numberOfItems = NSNumber(value: packets.count).uint8Value
        self.packets = packets
    }
    
    func getPacket() -> [UInt8] {
        var arr = [UInt8]()
        arr.append(self.type)
        arr += Conversion.uint16_to_uint8_array(self.timeout)
        arr.append(self.numberOfItems)
        for packet in self.packets {
            arr += packet.getPacket()
        }
        return arr
    }
}

class MeshCommandPacket {
    var type          : UInt8 = 0
    var bitmask       : UInt8 = 0
    var idCounter     : UInt8 = 0
    var crownstoneIds : [UInt8]!
    var payload       : [UInt8]!
    
    init(type: MeshCommandType, crownstoneIds: [UInt8], payload: [UInt8]) {
        self.type = type.rawValue
        self.crownstoneIds = crownstoneIds
        self.payload = payload
        self.idCounter = NSNumber(value: crownstoneIds.count).uint8Value
    }
    
    func getPacket() -> [UInt8] {
        var arr = [UInt8]()
        arr.append(self.type)
        arr.append(self.bitmask)
        arr.append(self.idCounter)
        arr += (self.crownstoneIds)
        arr += self.payload
        
        return arr
    }
}

class StoneMultiSwitchPacket {
    var timeout : UInt16 = 0
    var crownstoneId : UInt8
    var state   : UInt8
    var intent  : UInt8
    
    convenience init(crownstoneId: UInt8, state: UInt8, intent: IntentType) {
        self.init(crownstoneId: crownstoneId, state: state, timeout:0, intent: intent.rawValue)
    }
    
    convenience init(crownstoneId: UInt8, state: Float, intent: IntentType) {
        self.init(crownstoneId: crownstoneId, state: state, timeout:0, intent: intent.rawValue)
    }
    
    convenience init(crownstoneId: UInt8, state: Float, timeout: UInt16, intent: IntentType) {
        let switchState = NSNumber(value: min(1,max(0,state))*100).uint8Value
        self.init(crownstoneId: crownstoneId, state: switchState, timeout: timeout, intent: intent.rawValue)
    }
    
    convenience init(crownstoneId: UInt8, state: Float, timeout: UInt16, intent: UInt8) {
        let switchState = NSNumber(value: min(1,max(0,state))*100).uint8Value
        self.init(crownstoneId: crownstoneId, state: switchState, timeout: timeout, intent: intent)
    }
    
    init(crownstoneId: UInt8, state: UInt8, timeout: UInt16, intent: UInt8) {
        self.timeout = timeout
        self.crownstoneId = crownstoneId
        self.state = state
        self.intent = intent
    }
    
    func getPacket() -> [UInt8] {
        var arr = [UInt8]()
        arr.append(self.crownstoneId)
        arr.append(self.state)
        arr += Conversion.uint16_to_uint8_array(self.timeout)
        arr.append(self.intent)

        return arr
    }
}


class MeshMultiSwitchPacket {
    var type : UInt8
    var numberOfItems : UInt8
    var packets : [StoneMultiSwitchPacket]!
    
    init(type: MeshMultiSwitchType, packets: [StoneMultiSwitchPacket]) {
        self.type = type.rawValue
        self.numberOfItems = NSNumber(value: packets.count).uint8Value
        self.packets = packets
    }
    
    func getPacket() -> [UInt8] {
        var arr = [UInt8]()
        arr.append(self.type)
        arr.append(self.numberOfItems)
        for packet in self.packets {
            arr += packet.getPacket()
        }
        return arr
    }
}



