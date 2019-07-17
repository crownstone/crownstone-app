//
//  Firmware.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 10/08/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation


public class Firmware {
    public var softdeviceSize: NSNumber
    public var bootloaderSize: NSNumber
    public var applicationSize: NSNumber
    public var data: [UInt8]
    
    init(softdeviceSize: NSNumber, bootloaderSize: NSNumber, applicationSize: NSNumber, data: [UInt8]) {
        self.softdeviceSize = softdeviceSize
        self.bootloaderSize = bootloaderSize
        self.applicationSize = applicationSize
        self.data = data
    }
    
    public func getSizePacket() -> [UInt8] {
        var result = [UInt8]()
        
        result += Conversion.uint32_to_uint8_array(softdeviceSize.uint32Value)
        result += Conversion.uint32_to_uint8_array(bootloaderSize.uint32Value)
        result += Conversion.uint32_to_uint8_array(applicationSize.uint32Value)
        
        return result
    }
    
}

