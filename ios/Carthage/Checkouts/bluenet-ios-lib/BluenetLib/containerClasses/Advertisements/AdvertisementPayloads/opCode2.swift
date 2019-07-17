//
//  opCode2.swift
//  BluenetLib
//
//  Created by Alex de Mulder on 08/01/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation

func parseOpcode2(serviceData : ScanResponsePacket, data : [UInt8]) {
    if (data.count == 16) {
        serviceData.crownstoneId = NSNumber(value: Conversion.uint8_array_to_uint16([data[0], data[1]])).uint8Value
        serviceData.switchState  = data[2]
        serviceData.flagsBitmask = data[3]
        serviceData.temperature  = Conversion.uint8_to_int8(data[4])
        
        let powerFactor = Conversion.uint16_to_int16(
            Conversion.uint8_array_to_uint16([
                data[5],
                data[6]
            ])
        )
        let appearentPower = Conversion.uint16_to_int16(
            Conversion.uint8_array_to_uint16([
                data[7],
                data[8]
            ])
        )
        
        serviceData.powerFactor        = NSNumber(value: powerFactor as Int16).doubleValue / 1024
        serviceData.powerUsageApparent = NSNumber(value: appearentPower as Int16).doubleValue / 16
        serviceData.powerUsageReal     = serviceData.powerFactor * serviceData.powerUsageApparent
        
        let accumulatedEnergy = Conversion.uint32_to_int32(
            Conversion.uint8_array_to_uint32([
                data[9],
                data[10],
                data[11],
                data[12]
            ])
        )
        serviceData.accumulatedEnergy = NSNumber(value: accumulatedEnergy).int64Value * 64
        
        // bitmask states
        let bitmaskArray = Conversion.uint8_to_bit_array(serviceData.flagsBitmask)
        
        serviceData.stateOfExternalCrownstone = bitmaskArray[1]
        serviceData.hasError                  = bitmaskArray[2]
        serviceData.setupMode                 = bitmaskArray[7]
        
        serviceData.timestamp = NSNumber(value: Conversion.uint8_array_to_uint32([0x00,data[13],data[14],data[15]])).doubleValue
        serviceData.uniqueIdentifier = NSNumber(value: serviceData.timestamp)
    }
}
