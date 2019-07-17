//
//  TimeUtil.swift
//  BluenetLib
//
//  Created by Alex de Mulder on 05/12/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation


func _obtainTimestamp(fullTimeStamp : Double, lsb : UInt16) -> Double {
    let timestamp : UInt32 = NSNumber(value: fullTimeStamp).uint32Value // cast to uint32 from double
    let timestampArray = Conversion.uint32_to_uint8_array(timestamp)    // make into bytes
    let LSB_timestampArray = Conversion.uint16_to_uint8_array(lsb)      // make lsb into bytes
    
    // assemble
    let restoredTimestamp = Conversion.uint8_array_to_uint32([LSB_timestampArray[0],LSB_timestampArray[1],timestampArray[2],timestampArray[3]])
    
    // cast to double
    return NSNumber(value: restoredTimestamp).doubleValue
}

func reconstructTimestamp(currentTimestamp: Double, LsbTimestamp : UInt16) -> Double {
    // embed location data in timestamp
    let secondsFromGMT: Double = NSNumber(value: TimeZone.current.secondsFromGMT()).doubleValue
    let correctedTimestamp = currentTimestamp + secondsFromGMT
    
    // attempt restoration
    var restoredTimestamp = _obtainTimestamp(fullTimeStamp : correctedTimestamp, lsb: LsbTimestamp)
    
    let halfUInt16 : Double = 0x7FFF // roughly 9 hours in seconds
    
    // correct for overflows, check for drift from current time
    let delta : Double = correctedTimestamp - restoredTimestamp
    
    if (delta > -halfUInt16 && delta < halfUInt16) {
        return restoredTimestamp
    }
    else if (delta < -halfUInt16) {
        restoredTimestamp = _obtainTimestamp(fullTimeStamp: correctedTimestamp - 0xFFFF, lsb: LsbTimestamp)
    }
    else if (delta > halfUInt16) {
        restoredTimestamp = _obtainTimestamp(fullTimeStamp: correctedTimestamp + 0xFFFF, lsb: LsbTimestamp)
    }
    
    
    return restoredTimestamp
}


func getCurrentTimestampForCrownstone() -> Double {
    let secondsFromGMT: Double = NSNumber(value: TimeZone.current.secondsFromGMT()).doubleValue
    let correctedTimestamp = Date().timeIntervalSince1970 - secondsFromGMT
    
    return correctedTimestamp
}
