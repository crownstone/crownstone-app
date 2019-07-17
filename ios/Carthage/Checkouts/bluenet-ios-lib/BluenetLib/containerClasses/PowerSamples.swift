//
//  PowerSamples.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 22/08/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation

//
//  Advertisement.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 17/06/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation
import CoreBluetooth
import SwiftyJSON

/**
 * Wrapper for all relevant data of the object
 *
 */
public class PowerSamples {
    public var current = [UInt16]()
    public var voltage = [UInt16]()
    public var currentTimes = [UInt32]()
    public var voltageTimes = [UInt32]()
    public var valid = false
    
    init(data: [UInt8]) {
        if (self.parse(data)) {
            self.valid = true
        }
        else {
            LOG.warn("invalid power sample package")
        }
    }
    
    func parse(_ data: [UInt8]) -> Bool {
        let length = data.count
        
        // 24 is the length of all the fixed length elementes.
        if (length < 24) { return false }
        let numCurrentSamples = NSNumber(value: Conversion.uint8_array_to_uint16([data[0], data[1]]) as UInt16).intValue
        var offset : Int = 2
        
        // check if the length of the data is sufficient and get the current samples
        if (length < offset + numCurrentSamples*2) { return false }
        for i in [Int](0...numCurrentSamples-1) {
            current.append(Conversion.uint8_array_to_uint16([data[(i*2) + offset], data[(i*2) + 1 + offset]]))
        }
        offset += numCurrentSamples*2
        
        // check if the length of the data is sufficient and get amount of voltage samples
        if (length < offset + 2) { return false }
        let numVoltageSamples = NSNumber(value: Conversion.uint8_array_to_uint16([data[offset], data[offset+1]]) as UInt16).intValue
        offset += 2
        
        // check if the length of the data is sufficient and get the voltage samples
        if (length < offset + numVoltageSamples*2) { return false }
        for i in [Int](0...numVoltageSamples-1) {
            voltage.append(Conversion.uint8_array_to_uint16([data[(i*2) + offset], data[(i*2) + 1 + offset]]))
        }
        offset += numVoltageSamples*2
        
        if (length < offset + 10) { return false }
        let numCurrentTimestamps = NSNumber(value: Conversion.uint8_array_to_uint16([data[offset], data[offset+1]]) as UInt16).intValue
        offset += 2
        let firstCurrentTimestamp = Conversion.uint8_array_to_uint32([data[offset], data[offset+1], data[offset+2], data[offset+3]])
        offset += 4
        let lastCurrentTimestamp = Conversion.uint8_array_to_uint32([data[offset], data[offset+1], data[offset+2], data[offset+3]])
        offset += 4
        
        // these are diffs, we have length - 1, combined with starting from 0, we get -2
        if (length < offset + numCurrentTimestamps-1) { return false }
        var lastTime = firstCurrentTimestamp
        for i in [Int](0...numCurrentTimestamps-2) {
            lastTime += NSNumber(value: data[i + offset] as UInt8).uint32Value
            currentTimes.append(lastTime)
        }
        offset += numCurrentTimestamps-1
        
        if (currentTimes[currentTimes.count - 1] != lastCurrentTimestamp) {
            return false
        }
        
        if (length < offset + 10) { return false }
        let numVoltageTimestamps = NSNumber(value: Conversion.uint8_array_to_uint16([data[offset], data[offset+1]]) as UInt16).intValue
        offset += 2
        let firstVoltageTimestamp = Conversion.uint8_array_to_uint32([data[offset], data[offset+1], data[offset+2], data[offset+3]])
        offset += 4
        let lastVoltageTimestamp = Conversion.uint8_array_to_uint32([data[offset], data[offset+1], data[offset+2], data[offset+3]])
        offset += 4
    
        
        if (length < offset + numVoltageTimestamps-2) { return false }
        lastTime = firstVoltageTimestamp
        for i in [Int](0...numVoltageTimestamps-2) {
            lastTime += NSNumber(value: data[i + offset] as UInt8).uint32Value
            voltageTimes.append(lastTime)
        }
        
        if (voltageTimes[voltageTimes.count - 1] != lastVoltageTimestamp) {
            return false
        }
        
        return true
    }

    
//    public func getJSON() -> JSON {
//    
//    }

//    public func stringify() -> String {
//        return JSONUtils.stringify(self.getJSON())
//    }   
    
}
