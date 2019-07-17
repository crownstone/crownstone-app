//
//  packets.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 09/06/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation
import SwiftyJSON
import CryptoSwift
/*
 *
 *
 *  These are valid for SDK 0.13.0
 *
 *
 */

class BLEPacket {
    var type : UInt8 = 0
    var length : [UInt8] = [0,0]
    var payload = [UInt8]()
    
    init(type: UInt8) {
        self.type = type
        self.payload = []
        self.length = [0,0]
    }
    
    init(type: UInt8, payload: String) {
        self.type = type
        self.payload = Conversion.string_to_uint8_array(payload)
        self.length = Conversion.uint16_to_uint8_array(__uint16_t(self.payload.count))
    }
    
    init(type: UInt8, payload: Int8) {
        self.type = type
        self.payload = [Conversion.int8_to_uint8(payload)]
        self.length = Conversion.uint16_to_uint8_array(__uint16_t(self.payload.count))
    }
    
    init(type: UInt8, payload: UInt8) {
        self.type = type
        self.payload = [payload]
        self.length = Conversion.uint16_to_uint8_array(__uint16_t(self.payload.count))
    }
    
    init(type: UInt8, payload: UInt16) {
        self.type = type
        self.payload = Conversion.uint16_to_uint8_array(payload)
        self.length = Conversion.uint16_to_uint8_array(__uint16_t(self.payload.count))
    }
    
    init(type: UInt8, payload: UInt32) {
        self.type = type
        self.payload = Conversion.uint32_to_uint8_array(payload)
        self.length = Conversion.uint16_to_uint8_array(__uint16_t(self.payload.count))
    }
    
    init(type: UInt8, payload: [UInt8]) {
        self.type = type
        self.payload = payload
        self.length = Conversion.uint16_to_uint8_array(__uint16_t(self.payload.count))
    }
    
    init(type: UInt8, payloadFloat: Float) {
        self.type = type
        self.payload = Conversion.float_to_uint8_array(payloadFloat)
        self.length = Conversion.uint16_to_uint8_array(__uint16_t(self.payload.count))
    }
    
    
    func getPacket() -> [UInt8] {
        var arr = [UInt8]()
        arr.append(self.type)
        arr.append(0) // reserved
        arr += self.length
        arr += self.payload
        return arr
    }
    
    func getNSData() -> Data {
        let bytes = self.getPacket()
        return Data(bytes: UnsafePointer<UInt8>(bytes), count: bytes.count)
    }
}

class ControlPacket : BLEPacket {
   
    init(type: ControlType)                    { super.init(type: type.rawValue)  }
    init(type: ControlType, payload:   String) { super.init(type: type.rawValue, payload: payload)   }
    init(type: ControlType, payload8:  UInt8)  { super.init(type: type.rawValue, payload: payload8)  }
    init(type: ControlType, payload16: UInt16) { super.init(type: type.rawValue, payload: payload16) }
    init(type: ControlType, payload32: UInt32) { super.init(type: type.rawValue, payload: payload32) }
    init(type: ControlType, payloadArray: [UInt8]) { super.init(type: type.rawValue, payload: payloadArray) }
    
    override func getPacket() -> [UInt8] {
        var arr = [UInt8]()
        arr.append(self.type)
        arr.append(0) // reserved
        arr += self.length
        arr += self.payload
        return arr
    }
}

class keepAliveStatePacket : ControlPacket {

    init(action: UInt8, state: UInt8, timeout: UInt16) {
        var data = [UInt8]()
        
        data.append(action)
        data.append(state)
        
        let timeoutArray = Conversion.uint16_to_uint8_array(timeout)
        data.append(timeoutArray[0])
        data.append(timeoutArray[1])
        
        super.init(type: ControlType.keep_ALIVE_STATE, payloadArray: data)
    }
}

class FactoryResetPacket : ControlPacket {
    init() {super.init(type: ControlType.factory_RESET, payload32: 0xdeadbeef)}
}


class EnableScannerPacket : ControlPacket {
    init(payload8: UInt8) {super.init(type: ControlType.enable_SCANNER, payload8: payload8)}
}

class EnableScannerDelayPacket : ControlPacket {
    init(delayInMs: Int) {super.init(type: ControlType.enable_SCANNER, payload16: UInt16(delayInMs))}
}

class ReadConfigPacket : BLEPacket {

    init(type: ConfigurationType)                    { super.init(type: type.rawValue) }
    init(type: ConfigurationType, payload:   String) { super.init(type: type.rawValue, payload: payload)   }
    init(type: ConfigurationType, payload8:  Int8)   { super.init(type: type.rawValue, payload: payload8)  }
    init(type: ConfigurationType, payload8:  UInt8)  { super.init(type: type.rawValue, payload: payload8)  }
    init(type: ConfigurationType, payload16: UInt16) { super.init(type: type.rawValue, payload: payload16) }
    init(type: ConfigurationType, payload32: UInt32) { super.init(type: type.rawValue, payload: payload32) }
    init(type: ConfigurationType, payloadArray: [UInt8]) { super.init(type: type.rawValue, payload: payloadArray) }
    init(type: ConfigurationType, payloadFloat: Float  ) { super.init(type: type.rawValue, payloadFloat: payloadFloat)  }
    
    func getOpCode() -> OpCode { return .read }
    
    override func getPacket() -> [UInt8] {
        var arr = [UInt8]()
        arr.append(self.type)
        arr.append(self.getOpCode().rawValue)
        arr += self.length
        arr += self.payload
        return arr
    }
}
class WriteConfigPacket : ReadConfigPacket {
    override func getOpCode() -> OpCode { return .write }
}



class ReadStatePacket : BLEPacket {

    init(type: StateType)                         { super.init(type: type.rawValue) }
    init(type: StateType, payload:       String)  { super.init(type: type.rawValue, payload: payload)   }
    init(type: StateType, payload8:      UInt8 )  { super.init(type: type.rawValue, payload: payload8)  }
    init(type: StateType, payload16:     UInt16)  { super.init(type: type.rawValue, payload: payload16) }
    init(type: StateType, payload32:     UInt32)  { super.init(type: type.rawValue, payload: payload32) }
    init(type: StateType, payloadArray:  [UInt8]) { super.init(type: type.rawValue, payload: payloadArray) }
    init(type: StateType, payloadFloat:  Float  ) { super.init(type: type.rawValue, payloadFloat: payloadFloat)  }
    
    func getOpCode() -> OpCode {
        return .read
    }
    
    override func getPacket() -> [UInt8] {
        var arr = [UInt8]()
        arr.append(self.type)
        arr.append(self.getOpCode().rawValue)
        arr += self.length
        arr += self.payload
        return arr
    }
}

class WriteStatePacket : ReadStatePacket {
    override func getOpCode() -> OpCode { return .write }
}

