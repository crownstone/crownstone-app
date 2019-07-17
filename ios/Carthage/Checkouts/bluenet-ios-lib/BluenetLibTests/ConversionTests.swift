//
//  BluenetLibIOSTests.swift
//  BluenetLibIOSTests
//
//  Created by Alex de Mulder on 11/04/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import XCTest
import SwiftyJSON
@testable import BluenetLib



class ConversionTests: XCTestCase {
    
    override func setUp() {
        super.setUp()
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }
    
    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        super.tearDown()
    }
    
    func testConversionUInt32_to_bitarray() {
        // This is an example of a functional test case.
        // Use XCTAssert and related functions to verify your tests produce the correct results.
        let bitmask32_1 : UInt32 = 0x80000000
        let bitmask32_64 : UInt32 = 64
        
        var maskAt1 = [Bool](repeating: false, count: 32)
        maskAt1[0] = true;
        let maskAt64 = [
            false,   // 31
            false,   // 30
            false,   // 29
            false,   // 28
            false,   // 27
            false,   // 26
            false,   // 25
            false,   // 24
            false,   // 23
            false,   // 22
            false,   // 21
            false,   // 20
            false,   // 19
            false,   // 18
            false,   // 17
            false,   // 16 == 65536
            false,   // 15 == 32768
            false,   // 14 == 16384
            false,   // 13 == 8192
            false,   // 12 == 4096
            false,   // 11 == 2048
            false,   // 10 == 1024
            false,   // 9  == 512
            false,   // 8  == 255
            false,   // 7  == 128
            true,    // 6  == 64
            false,   // 5  == 32
            false,   // 4  == 16
            false,   // 3  == 8
            false,   // 2  == 4
            false,   // 1  == 2
            false    // 0  == 1
        ]
        
        XCTAssertEqual(Conversion.uint32_to_bit_array(bitmask32_1),maskAt1)
        XCTAssertEqual(Conversion.uint32_to_bit_array(bitmask32_64),maskAt64)

        XCTAssertEqual(Conversion.bit_array_to_uint32(maskAt1), bitmask32_1)
        XCTAssertEqual(Conversion.bit_array_to_uint32(maskAt64),bitmask32_64)

        XCTAssertEqual(bitmask32_1,  Conversion.bit_array_to_uint32(Conversion.uint32_to_bit_array(bitmask32_1 )))
        XCTAssertEqual(bitmask32_64, Conversion.bit_array_to_uint32(Conversion.uint32_to_bit_array(bitmask32_64)))
    }
    
    func testConversionUInt8_to_bitarray() {
        let test : UInt8 = 241
        print(Conversion.uint8_to_bit_array(test))
        
        XCTAssertEqual(test,Conversion.bit_array_to_uint8(Conversion.uint8_to_bit_array(test)))
    }
    
    func testTemplateConverter() {
        print(Conversion.uint8_to_int8(133))
        print(Conversion.uint8_to_int8(0))
    }
    
    func testFloatConversion() {
        print(Conversion.float_to_uint8_array(3.3))
        XCTAssertEqual(Conversion.float_to_uint8_array(3.3),[51,51,83,64])
        XCTAssertEqual(Conversion.uint8_array_to_float([51,51,83,64]),3.3)
    }
    
    func testHexStringCnversion() {
        print(Conversion.uint16_to_hex_string(0xf000))
        print(Conversion.uint16_to_hex_string(0x0f00))
        print(Conversion.uint16_to_hex_string(0x00f0))
        print(Conversion.uint16_to_hex_string(0x000f))
    }
}
