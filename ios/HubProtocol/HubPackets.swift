//
//  HubPackets.swift
//  Crownstone
//
//  Created by Alex de Mulder on 24/11/2020.
//  Copyright © 2020 Crownstone. All rights reserved.
//

import Foundation
import BluenetLib

let PROTOCOL_VERSION : UInt8 = 0

public enum HubDataTypes : UInt16 {
    case setup = 0
}
public enum HubDataReplyTypes : UInt16 {
    case success = 0
    case error   = 4000
}


public class HubPacketGenerator {
    
    static func tokenSphereIdPacket(hubToken: String, cloudId: String) -> [UInt8] {
        var payload : [UInt8] = []
        let hubTokenBytes = Conversion.string_to_uint8_array(hubToken)
        let cloudIdBytes = Conversion.string_to_uint8_array(cloudId)
        
        payload.append(PROTOCOL_VERSION)
        payload += Conversion.uint16_to_uint8_array(NSNumber(value: HubDataTypes.setup.rawValue).uint16Value)
        payload += Conversion.uint16_to_uint8_array(NSNumber(value: hubTokenBytes.count).uint16Value)
        payload += hubTokenBytes
        payload += Conversion.uint16_to_uint8_array(NSNumber(value: cloudIdBytes.count).uint16Value)
        payload += cloudIdBytes
        
        print("SENDING, tokenSphereIdPacket",payload)
        return payload
    }
}


public class HubParser {
    
    var protocolVersion: UInt8!
    var type: UInt16!
    var typeString : String = "unknown"
    
    var errorType: UInt16?
    var messageLength: UInt16!
    var message: String = ""
    
    var valid: Bool = true
    
    init(_ data : [UInt8]) {
        self.load(data)
    }
        
    func load(_ data: [UInt8]) {
        print("Load Data into HubParser", data)
        
        let stepper = DataStepper(data)
        do {
            protocolVersion = try stepper.getUInt8()
            type = try stepper.getUInt16()
            let enumValue = HubDataReplyTypes.init(rawValue: type)
            if (enumValue == nil) {
                valid = false
                return
            }
            
            self.typeString = String(describing: enumValue!)
            
            if (type == HubDataReplyTypes.error.rawValue) {
                errorType = try stepper.getUInt16()
            }
            
            messageLength = try stepper.getUInt16()
            if (messageLength > 0) {
                message = Conversion.uint8_array_to_string(try stepper.getBytes(messageLength))
            }
        }
        catch {
            valid = false
        }
    }
    
}
