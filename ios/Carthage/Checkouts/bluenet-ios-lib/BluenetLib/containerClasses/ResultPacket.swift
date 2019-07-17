//
//  ResultPacket.swift
//  BluenetLib
//
//  Created by Alex de Mulder on 30/04/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation
import CoreBluetooth
import SwiftyJSON

/**
 * Wrapper for all relevant data of the object
 *
 */
public class ResultPacket {
    public var type : UInt8 = 0
    public var opCode : UInt8 = 0
    public var length : UInt16 = 0
    public var payload : [UInt8] = []
    
    public var valid = false
    
    init(_ data : [UInt8]) {
        if (data.count >= 4) {
            self.valid = true
            self.type = data[0]
            self.opCode = data[1]
            self.length = Conversion.uint8_array_to_uint16([data[2], data[3]])
            let totalSize : Int = 4 + NSNumber(value: self.length).intValue
            if (data.count >= totalSize) {
                for i in [Int](4...totalSize) {
                    self.payload.append(data[i])
                }
            }
            else {
                self.valid = false
            }
        }
        else {
            self.valid = false
        }
    }
    
    
    func getUInt16Payload() -> UInt16 {
        if (self.valid == false) { return 65535 }
        
        if (self.length >= 2) {
            return Conversion.uint8_array_to_uint16([self.payload[0], self.payload[1]])
        }
        else {
            return 65535
        }
    }
}


