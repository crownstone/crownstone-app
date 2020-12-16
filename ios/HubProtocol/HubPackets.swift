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

public enum HubDataType : UInt16 {
    case setup = 0
    case command = 1
    case factoryReset = 2
    case factoryResetHubOnly = 3
    case requestData = 10
}

public enum HubRequestDataType : UInt16 {
    case cloudId = 0
}

public enum HubDataReplyType : UInt16 {
    case success   = 0
    case dataReply = 10
    case error     = 4000
}


public class HubPacketGenerator {
    
    static func tokenSphereIdPacket(hubToken: String, cloudId: String) -> [UInt8] {
        var payload : [UInt8] = []
        let hubTokenBytes = Conversion.string_to_uint8_array(hubToken)
        let cloudIdBytes = Conversion.string_to_uint8_array(cloudId)
        
        payload.append(PROTOCOL_VERSION)
        payload += Conversion.uint16_to_uint8_array(NSNumber(value: HubDataType.setup.rawValue).uint16Value)
        payload += Conversion.uint16_to_uint8_array(NSNumber(value: hubTokenBytes.count).uint16Value)
        payload += hubTokenBytes
        payload += Conversion.uint16_to_uint8_array(NSNumber(value: cloudIdBytes.count).uint16Value)
        payload += cloudIdBytes
        
        return payload
    }
    
    
    static func requestDataPacket(type: HubRequestDataType) -> [UInt8] {
        var payload : [UInt8] = []

        payload.append(PROTOCOL_VERSION)
        payload += Conversion.uint16_to_uint8_array(NSNumber(value: HubDataType.requestData.rawValue).uint16Value)
        payload += Conversion.uint16_to_uint8_array(NSNumber(value: type.rawValue).uint16Value)
    
        return payload
    }
    
    
    
    static func factoryResetPacket() -> [UInt8] {
        var payload : [UInt8] = []

        payload.append(PROTOCOL_VERSION)
        payload += Conversion.uint16_to_uint8_array(NSNumber(value: HubDataType.factoryReset.rawValue).uint16Value)
        payload += Conversion.uint32_to_uint8_array(0xDEADBEEF)
    
        return payload
    }
    
    static func factoryResetHubOnlyPacket() -> [UInt8] {
        var payload : [UInt8] = []

        payload.append(PROTOCOL_VERSION)
        payload += Conversion.uint16_to_uint8_array(NSNumber(value: HubDataType.factoryResetHubOnly.rawValue).uint16Value)
        payload += Conversion.uint32_to_uint8_array(0xDEADBEA7)
    
        return payload
    }
    
}


public class HubParser {
    
    var protocolVersion: UInt8!
    var type: UInt16!
    var typeString : String = "unknown"
    
    var errorType: UInt16?
    var dataType: UInt16?
    
    var messageLength: UInt16!
    var message: String = ""
    
    var valid: Bool = true
    
    init(_ data : [UInt8]) {
        self.load(data)
    }
        
    func load(_ data: [UInt8]) {
        let stepper = DataStepper(data)
        do {
            protocolVersion = try stepper.getUInt8()
            type = try stepper.getUInt16()
            let enumValue = HubDataReplyType.init(rawValue: type)
            if (enumValue == nil) {
                valid = false
                return
            }
            
            self.typeString = String(describing: enumValue!)
            
            switch type {
            case HubDataReplyType.error.rawValue:
                errorType = try stepper.getUInt16()
            case HubDataReplyType.dataReply.rawValue:
                dataType = try stepper.getUInt16()
            default:
                // do nothing
                break
            }
            
            message = Conversion.uint8_array_to_string(try stepper.getRemainingBytes())
            
            if (type == HubDataReplyType.dataReply.rawValue) {
                // you can do additional formatting here.
                // currently the cloudId is also a string.
            }
        }
        catch {
            valid = false
        }
    }
    
}
