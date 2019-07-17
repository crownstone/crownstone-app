//
//  opCode3_type0.swift
//  BluenetLib
//
//  Created by Alex de Mulder on 08/01/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation

func parseOpcode3_type0(serviceData : ScanResponsePacket, data : [UInt8], liteParse: Bool) {
    if (data.count == 16) {
        // opCode   = first byte of payload, not the decrypted
        // dataType = data[0]
        
        serviceData.partialTimestamp = Conversion.uint8_array_to_uint16([data[12],data[13]])
        serviceData.uniqueIdentifier = NSNumber(value: serviceData.partialTimestamp)
        
        if (liteParse) {
            return
        }
        
        serviceData.stateOfExternalCrownstone = false
        
        serviceData.crownstoneId = data[1]
        serviceData.switchState  = data[2]
        serviceData.flagsBitmask = data[3]
        // bitmask states
        let bitmaskArray = Conversion.uint8_to_bit_array(serviceData.flagsBitmask)
        
        serviceData.dimmingAvailable = bitmaskArray[0]
        serviceData.dimmingAllowed   = bitmaskArray[1]
        serviceData.hasError         = bitmaskArray[2]
        serviceData.switchLocked     = bitmaskArray[3]
        serviceData.timeSet          = bitmaskArray[4]
        serviceData.switchCraftEnabled = bitmaskArray[5]
        
        serviceData.temperature  = Conversion.uint8_to_int8(data[4])
        
        let powerFactor = Conversion.uint8_to_int8(data[5])
        let realPower = Conversion.uint16_to_int16(
            Conversion.uint8_array_to_uint16([
                data[6],
                data[7]
            ])
        )
        
        serviceData.powerFactor        = NSNumber(value: powerFactor).doubleValue / 127
        
        // we cannot have a 0 for a powerfactor. To avoid division by 0, we set it to be either 0.01 or -0.01
        if (serviceData.powerFactor >= 0 && serviceData.powerFactor < 0.01) {
            serviceData.powerFactor = 0.01
        }
        else if (serviceData.powerFactor < 0 && serviceData.powerFactor > -0.01) {
            serviceData.powerFactor = -0.01
        }
        
        serviceData.powerUsageReal     = NSNumber(value: realPower).doubleValue / 8
        serviceData.powerUsageApparent = serviceData.powerUsageReal / serviceData.powerFactor
        
        let accumulatedEnergy = Conversion.uint32_to_int32(
            Conversion.uint8_array_to_uint32([
                data[8],
                data[9],
                data[10],
                data[11]
            ])
        );
        serviceData.accumulatedEnergy = NSNumber(value: accumulatedEnergy).int64Value * 64
        
        if (serviceData.timeSet) {
            serviceData.timestamp = NSNumber(value: reconstructTimestamp(currentTimestamp: NSDate().timeIntervalSince1970, LsbTimestamp: serviceData.partialTimestamp)).doubleValue
        }
        else {
            serviceData.timestamp = NSNumber(value: serviceData.partialTimestamp).doubleValue // this is now a counter
        }
        
        // 14 is reserved
        
        serviceData.validation = data[15]
    }
}



