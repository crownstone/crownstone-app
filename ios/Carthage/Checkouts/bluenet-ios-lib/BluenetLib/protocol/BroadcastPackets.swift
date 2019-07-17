//
//  BroadcastPackets.swift
//  BluenetLib
//
//  Created by Alex de Mulder on 13/12/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation
import SwiftyJSON
import CryptoSwift

class BroadcastStone_SwitchPacket {
    var crownstoneId : UInt8
    var state   : UInt8
    
    init(crownstoneId: UInt8, state: UInt8) {
        self.crownstoneId = crownstoneId
        self.state = state
    }
    
    func getPacket() -> [UInt8] {
        var arr = [UInt8]()
        arr.append(self.crownstoneId)
        arr.append(self.state)
        
        return arr
    }
}


class BroadcastStone_SetTimePacket {
    var crownstoneId : UInt8
    var time         : UInt32
    
    init(crownstoneId: UInt8, time: UInt32) {
        self.crownstoneId = crownstoneId
        self.time = time
    }
    
    func getPacket() -> [UInt8] {
        var arr = [UInt8]()
        arr.append(self.crownstoneId)
        arr += Conversion.uint32_to_uint8_array(self.time)
        
        return arr
    }
}


class Broadcast_ForegroundBasePacket {
    var crownstoneId : UInt8
    var time         : UInt32
    
    init(crownstoneId: UInt8, time: UInt32) {
        self.crownstoneId = crownstoneId
        self.time = time
    }
    
    func getPacket() -> [UInt8] {
        var arr = [UInt8]()
        arr.append(self.crownstoneId)
        arr += Conversion.uint32_to_uint8_array(self.time)
        
        return arr
    }
}





