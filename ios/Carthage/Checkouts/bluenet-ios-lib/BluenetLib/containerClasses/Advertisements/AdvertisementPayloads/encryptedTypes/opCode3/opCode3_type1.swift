//
//  opCode3_type1.swift
//  BluenetLib
//
//  Created by Alex de Mulder on 08/01/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation

func parseOpcode3_type1(serviceData : ScanResponsePacket, data : [UInt8], liteParse: Bool) {
    if (data.count == 16) {
        // opCode   = data[0]
        // dataType = data[1]
        serviceData.errorMode = true
        
        serviceData.partialTimestamp = Conversion.uint8_array_to_uint16([data[12],data[13]])
        serviceData.uniqueIdentifier = NSNumber(value: serviceData.partialTimestamp)
        
        if (liteParse) {
            return
        }
        
        serviceData.crownstoneId  = data[1]
        serviceData.errorsBitmask = Conversion.uint8_array_to_uint32([
            data[2],
            data[3],
            data[4],
            data[5]
        ])
        
        serviceData.errorTimestamp = Conversion.uint8_array_to_uint32([
            data[6],
            data[7],
            data[8],
            data[9]
        ])
        
        serviceData.flagsBitmask = data[10]
        // bitmask states
        let bitmaskArray = Conversion.uint8_to_bit_array(serviceData.flagsBitmask)
        
        serviceData.dimmingAvailable = bitmaskArray[0]
        serviceData.dimmingAllowed   = bitmaskArray[1]
        serviceData.hasError         = bitmaskArray[2]
        serviceData.switchLocked     = bitmaskArray[3]
        serviceData.timeSet          = bitmaskArray[4]
        serviceData.switchCraftEnabled = bitmaskArray[5]
        
        serviceData.temperature  = Conversion.uint8_to_int8(data[11])

        if (serviceData.timeSet) {
            serviceData.timestamp = NSNumber(value: reconstructTimestamp(currentTimestamp: NSDate().timeIntervalSince1970, LsbTimestamp: serviceData.partialTimestamp)).doubleValue
        }
        else {
            serviceData.timestamp = NSNumber(value: serviceData.partialTimestamp).doubleValue // this is now a counter
        }
        
              
        
        let realPower = Conversion.uint16_to_int16(
            Conversion.uint8_array_to_uint16([
                data[14],
                data[15]
            ])
        )
        serviceData.powerUsageReal     = NSNumber(value: realPower).doubleValue / 8
        
        // this packets has no validation
        serviceData.validation = 0
    }
}
