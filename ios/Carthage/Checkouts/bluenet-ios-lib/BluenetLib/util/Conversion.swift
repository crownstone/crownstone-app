//
//  Conversion.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 15/06/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation

public class Conversion {
    
    // Convert a number into an array of 2 bytes.
    public static func uint16_to_uint8_array(_ value: UInt16) -> [UInt8] {
        return [
            UInt8((value >> 0 & 0xFF)),
            UInt8((value >> 8 & 0xFF))
        ]
    }
    
    public static func uint16_array_to_uint8_array(_ valueArray: [UInt16]) -> [UInt8] {
        var returnArray = [UInt8]();
        for uint16 in valueArray {
            returnArray += Conversion.uint16_to_uint8_array(uint16)
        }
        return returnArray
    }
    
    
    // Convert a number into an array of 4 bytes.
    public static func uint32_to_uint8_array(_ value: UInt32) -> [UInt8] {
        return [
            UInt8((value >> 0 & 0xFF)),
            UInt8((value >> 8 & 0xFF)),
            UInt8((value >> 16 & 0xFF)),
            UInt8((value >> 24 & 0xFF))
        ]
    }
    
    public static func string_to_uint8_array(_ string: String) -> [UInt8] {
        var arr = [UInt8]();
        for c in string {
            let scalars = String(c).unicodeScalars
            arr.append(UInt8(scalars[scalars.startIndex].value))
        }
        return arr
    }

    
    public static func uint8_array_to_string(_ data: [UInt8]) -> String {
        var dataCopy = [UInt8]()
        for byte in data {
            dataCopy.append(byte)
        }
        dataCopy.append(0)
        return String(cString: dataCopy)
    }
    
    public static func uint8_array_to_hex_string(_ data: [UInt8]) -> String {
        var stringResult = ""
        for byte in data {
            stringResult += Conversion.uint8_to_hex_string(byte)
        }
        return stringResult
    }
    
    
    public static func uint16_to_hex_string(_ uint16: UInt16) -> String {
        if (uint16 <= 0x000f) {
            return "000" + String(format:"%1X", uint16)
        }
        else if (uint16 <= 0x00ff) {
            return "00" + String(format:"%2X", uint16)
        }
        else if (uint16 <= 0x0fff) {
            return "0" + String(format:"%3X", uint16)
        }
        return String(format:"%4X", uint16)
    }
    
    public static func uint8_to_hex_string(_ byte: UInt8) -> String {
        if (byte <= 0x0f) {
            return "0" + String(format:"%1X", byte)
        }
        else {
            return String(format:"%2X", byte)
        }
    }

    
    public static func hex_string_to_uint8_array(_ input: String) -> [UInt8] {
        var hexNumber = ""
        var result = [UInt8]()
        for letter in input {
            hexNumber += String(letter)
            if (hexNumber.count == 2) {
                result.append(UInt8(hexNumber,radix:16)!)
                hexNumber = ""
            }
        }
        return result
    }
    
    public static func ascii_or_hex_string_to_16_byte_array(_ input: String) -> [UInt8] {
        if (input.count == 16) {
            return Conversion.string_to_uint8_array(input);
        }
        else {
            return Conversion.hex_string_to_uint8_array(input)
        }
    }
    
    public static func uint8_array_to_macAddress(_ input:[UInt8]) -> String {
        var string = ""
        for i in [Int](0...input.count-1) {
            // due to little endian, we read it out in the reverse order.
            string += Conversion.uint8_to_hex_string(input[input.count-1-i])
            
            // add colons to the string
            if (i < input.count-1) {
                string += ":"
            }
        }
        return string
    }
    
    public static func reverse(_ input: [UInt8]) -> [UInt8] {
        return input.reversed() as [UInt8]
    }
    
    public static func ibeaconUUIDString_to_uint8_array(_ input:String) -> [UInt8] {
        let check = UUID(uuidString: input)
        if (check != nil) {
            var stripped = input.replacingOccurrences(of: "-", with: "")
            stripped  = stripped.replacingOccurrences(of: ":", with: "")
            return Conversion.hex_string_to_uint8_array(stripped)
        }
        return []
    }
    
    public static func ibeaconUUIDString_to_reversed_uint8_array(_ input:String) -> [UInt8] {
        let byteArray = Conversion.ibeaconUUIDString_to_uint8_array(input)
        return Conversion.reverse(byteArray)
    }
    
    public static func uint8_array_to_uint16(_ arr8: [UInt8]) -> UInt16 {
        return (UInt16(arr8[1]) << 8) + UInt16(arr8[0])
    }
    
    public static func uint8_array_to_uint32(_ arr8: [UInt8]) -> UInt32 {
        let p1 = UInt32(arr8[3]) << 24
        let p2 = UInt32(arr8[2]) << 16
        let p3 = UInt32(arr8[1]) << 8
        let p4 = UInt32(arr8[0])
        return p1 + p2 + p3 + p4
    }
    
    public static func uint32_to_int32(_ val: UInt32) -> Int32 {
        let ns = NSNumber(value: val as UInt32)
        return ns.int32Value
    }
    
    public static func uint32_to_uint16_array(_ val: UInt32) -> [UInt16] {
        return [
            UInt16((val >> 0 & 0x0000FFFF)),
            UInt16((val >> 16))
        ]
    }
    
    public static func uint32_to_uint16_reversed_array(_ val: UInt32) -> [UInt16] {
        return [
            UInt16((val >> 16)),
            UInt16((val >> 0 & 0x0000FFFF))
        ]
    }
    
    public static func uint16_reversed_array_to_uint32(_ uint16Array: [UInt16]) -> UInt32 {
        return UInt32(uint16Array[1]) + UInt32(uint16Array[0]) << 16
    }
    
    public static func uint16_array_to_uint32(_ uint16Array: [UInt16]) -> UInt32 {
        return UInt32(uint16Array[0]) + UInt32(uint16Array[1]) << 16
    }
    
    
    public static func uint8_to_bit_array(_ val: UInt8) -> [Bool] {
        var result = [Bool](repeating: false, count: 8)
        let one : UInt8 = 1
        result[0] = (val & one) != 0
        result[1] = (val & (one << 1)) != 0
        result[2] = (val & (one << 2)) != 0
        result[3] = (val & (one << 3)) != 0
        result[4] = (val & (one << 4)) != 0
        result[5] = (val & (one << 5)) != 0
        result[6] = (val & (one << 6)) != 0
        result[7] = (val & (one << 7)) != 0
        return result
    }
    
    public static func bit_array_to_uint8(_ bitArray: [Bool]) -> UInt8 {
        var result : UInt8 = 0
        let one : UInt8 = 1
        
        if (bitArray[0]) { result = result | (one << 0) }
        if (bitArray[1]) { result = result | (one << 1) }
        if (bitArray[2]) { result = result | (one << 2) }
        if (bitArray[3]) { result = result | (one << 3) }
        if (bitArray[4]) { result = result | (one << 4) }
        if (bitArray[5]) { result = result | (one << 5) }
        if (bitArray[6]) { result = result | (one << 6) }
        if (bitArray[7]) { result = result | (one << 7) }
        
        return result
    }
    
    public static func uint32_to_bit_array(_ val: UInt32) -> [Bool] {
        var result = [Bool](repeating: false, count: 32)
        let one : UInt32 = 1
        
        for i in 0...31 {
            result[i] = (val & (one << NSNumber(value: 31-i).uint32Value)) != 0
        }
        
        return result
    }
    
    public static func bit_array_to_uint32(_ bitArray: [Bool]) -> UInt32 {
        var result : UInt32 = 0
        let one : UInt32 = 1
        
        for i in 0...31 {
            if (bitArray[i]) { result = result | (one << NSNumber(value: 31 - i).uint32Value) }
        }
        
        return result
    }
    
    
    
    public static func flip_bit_array(_ bitArray: [Bool]) -> [Bool] {
        var result = [Bool](repeating: false, count: bitArray.count)
        
        for i in 0...(bitArray.count - 1) {
            result[i] = !bitArray[i]
        }
        
        return result
    }
    
    public static func uint8_to_int8(_ val: UInt8) -> Int8 {
        
        let ns = NSNumber(value: val as UInt8)
        return ns.int8Value
    }
    
    public static func int8_to_uint8(_ val: Int8) -> UInt8 {
        let ns = NSNumber(value: val as Int8)
        return ns.uint8Value
    }
    
    public static func uint16_to_int16(_ val: UInt16) -> Int16 {
        let ns = NSNumber(value: val as UInt16)
        return ns.int16Value
    }
    
    public static func uint8_array_to_float(_ arr: [UInt8]) -> Float {
        let data = Data(arr)
        let floatVal = data.withUnsafeBytes { $0.pointee } as Float
        return floatVal
    }
    
    
    public static func float_to_uint8_array(_ val: Float) -> [UInt8] {
        var float1 : Float = val
        let data = Data(buffer: UnsafeBufferPointer(start: &float1, count: 1))
        return data.bytes
    }
}


public func Convert<T>(_ input: [UInt8]) throws -> T {
    let type = "\(T.self)"
    
    switch(type) {
        case "Int8","UInt8":
            if (input.count == 0) {
                throw BluenetError.INCORRECT_RESPONSE_LENGTH
            }
        break
        case "Int16","UInt16":
        if (input.count < 2) {
            throw BluenetError.INCORRECT_RESPONSE_LENGTH
        }
        break
        case "Int32","UInt32","Float":
            if (input.count < 4) {
                throw BluenetError.INCORRECT_RESPONSE_LENGTH
            }
            break
    default:
        break
    }
    
    switch(type) {
        case "Int8":
            return Conversion.uint8_to_int8(input[0]) as! T
        case "UInt8":
            return input[0] as! T
        case "UInt16":
            return Conversion.uint8_array_to_uint16(input) as! T
        case "UInt32":
            return Conversion.uint8_array_to_uint32(input) as! T
        case "String":
            return Conversion.uint8_array_to_string(input) as! T
        case "Array<UInt8>":
            return input as! T
        case "Float":
            var floatValue : Float = 0.0
            memcpy(&floatValue, input, 4)
            return floatValue as! T
        case "Int32":
            return Conversion.uint32_to_int32(Conversion.uint8_array_to_uint32(input)) as! T
        default:
            return input as! T
    }
}
