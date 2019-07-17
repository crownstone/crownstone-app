//
//  CrownstoneErrors.swift
//  BluenetLib
//
//  Created by Alex de Mulder on 23/05/2017.
//  Copyright © 2017 Alex de Mulder. All rights reserved.
//

import Foundation


/**
 * Wrapper for all relevant data of the object
 *
 4 | Dimmer on failure  | If this is 1, the dimmer is broken, in an always (partial) on  state.
 5 | Dimmer off failure | If this is 1, the dimmer is broken, in an always (partial) off state.
 */
public class CrownstoneErrors {
    public var overCurrent        = false
    public var overCurrentDimmer  = false
    public var temperatureChip    = false
    public var temperatureDimmer  = false
    public var dimmerOnFailure    = false
    public var dimmerOffFailure   = false
    
    public var bitMask : UInt32   = 0
    
    init(bitMask: UInt32) {
        self.bitMask = bitMask

        let bitArray = Conversion.uint32_to_bit_array(bitMask)

        self.overCurrent       = bitArray[31-0]
        self.overCurrentDimmer = bitArray[31-1]
        self.temperatureChip   = bitArray[31-2]
        self.temperatureDimmer = bitArray[31-3]
        self.dimmerOnFailure   = bitArray[31-4]
        self.dimmerOffFailure  = bitArray[31-5]
    }
    
    init(dictionary: NSDictionary) {
        self.overCurrent       = (dictionary["overCurrent"]       as? Bool) != nil ? (dictionary["overCurrent"]       as! Bool) : false
        self.overCurrentDimmer = (dictionary["overCurrentDimmer"] as? Bool) != nil ? (dictionary["overCurrentDimmer"] as! Bool) : false
        self.temperatureChip   = (dictionary["temperatureChip"]   as? Bool) != nil ? (dictionary["temperatureChip"]   as! Bool) : false
        self.temperatureDimmer = (dictionary["temperatureDimmer"] as? Bool) != nil ? (dictionary["temperatureDimmer"] as! Bool) : false
        self.dimmerOnFailure   = (dictionary["dimmerOnFailure"]   as? Bool) != nil ? (dictionary["dimmerOnFailure"]   as! Bool) : false
        self.dimmerOffFailure  = (dictionary["dimmerOffFailure"]  as? Bool) != nil ? (dictionary["dimmerOffFailure"]  as! Bool) : false
        
        var bitArray = [Bool](repeating: false, count: 32)
        bitArray[31-0] = self.overCurrent
        bitArray[31-1] = self.overCurrentDimmer
        bitArray[31-2] = self.temperatureChip
        bitArray[31-3] = self.temperatureDimmer
        bitArray[31-4] = self.dimmerOnFailure
        bitArray[31-5] = self.dimmerOffFailure
        
        self.bitMask = Conversion.bit_array_to_uint32(bitArray)
    }
    
    public func getResetMask() -> UInt32 {
        return self.bitMask
    }
    
    public func hasErrors() -> Bool {
        return self.bitMask == 0
    }
    
    public func getDictionary() -> NSDictionary {
        let returnDict : [String: Any] = [
            "overCurrent"       : NSNumber(value: self.overCurrent),
            "overCurrentDimmer" : NSNumber(value: self.overCurrentDimmer),
            "temperatureChip"   : NSNumber(value: self.temperatureChip),
            "temperatureDimmer" : NSNumber(value: self.temperatureDimmer),
            "dimmerOnFailure"   : NSNumber(value: self.dimmerOnFailure),
            "dimmerOffFailure"  : NSNumber(value: self.dimmerOffFailure),
            "bitMask"           : NSNumber(value: self.bitMask),
        ]
        
        return returnDict as NSDictionary
    }
}
