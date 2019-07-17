//
//  BluenetLibIOSTests.swift
//  BluenetLibIOSTests
//
//  Created by Alex de Mulder on 11/04/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import XCTest
import SwiftyJSON
import PromiseKit
@testable import BluenetLib

func XCTAssertEqualDictionaries<S: Equatable, T: Equatable>(first: [S:T], _ second: [S:T]) {
    XCTAssert(first == second)
}

class BluenetLibTests: XCTestCase {
    
    override func setUp() {
        super.setUp()
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }
    
    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        super.tearDown()
    }
    

    
    
    func testConversion() {
        // This is an example of a functional test case.
        // Use XCTAssert and related functions to verify your tests produce the correct results.
        let uint8Array16 : [UInt8] = [10,32]
        let uint8Array32 : [UInt8] = [10,32,0,2]

        XCTAssertEqual(MeshCommandType.config.rawValue,2)
        XCTAssertEqual(Conversion.uint8_array_to_uint16(uint8Array16), UInt16(8202))
        XCTAssertEqual(Conversion.uint8_array_to_uint32(uint8Array32), UInt32(33562634))
        XCTAssertEqual(Conversion.uint32_to_int32(3147483647), Int32(-1147483649))
        XCTAssertEqual(Conversion.ibeaconUUIDString_to_uint8_array("b643423e-e175-4af0-a2e4-31e32f729a8a"), [182, 67, 66, 62, 225, 117, 74, 240, 162, 228, 49, 227, 47, 114, 154, 138])
        XCTAssertEqual("test".count, 4)
        XCTAssertEqual(Conversion.uint8_to_bit_array(53),[true, false, true, false, true, true, false, false])
    }
    
    func testSwift() {
        for (index,element) in [Int](0...5).enumerated() {
            print(index,element)
        }
        
        XCTAssertEqual(3405691582 as UInt32,0xcafebabe)
    }
    
    func testHexString() {
        XCTAssertEqual("FF",String(format:"%2X", 255))
    }
    
//    func testErrorPropagation() {
//        let exp = expectation(description: "Example")
//        let promise = Promise<Void> { seal in delay(0.3, { seal.reject(BluenetError.INVALID_SESSION_DATA) }) }
//        firstly{ when(fulfilled: promise) }
//            .done{ _ in print("HERE")}
//            .catch{(error: Error) -> Void in
//                print(1,error)
//                print(3,error)
//            }
//            .catch{(error: Error) -> Void in
//                print(2,error)
//                exp.fulfill()
//            }
//        
//        waitForExpectations(timeout: 0.5, handler: nil)
//    }
//    
//    func testPromiseIntermediateCatch() {
//        let exp = expectation(description: "Example")
//        let promise = Promise<Void> { seal in delay(0.3, { seal.reject(BluenetError.INVALID_SESSION_DATA) }) }
//        firstly{ when(fulfilled: promise) }
//            .catch{(error: Error) -> Void in
//                print(1,error)
//            }
//            .then{ _ in print("HERE")}
//            .catch{(error: Error) -> Void in
//                print(2,error)
//            }
//            .catch{(error: Error) -> Void in
//                print(3,error)
//                exp.fulfill()
//        }
//        let promise2 = Promise<Void> { seal in delay(0.3, { seal.fulfill(()) }) }
//        firstly{ when(fulfilled: promise2) }
//            .catch{(error: Error) -> Void in
//                print(5,error)
//            }
//            .then{ _ in print("HERE")}
//            .catch{(error: Error) -> Void in
//                print(6,error)
//            }
//            .catch{(error: Error) -> Void in
//                print(7,error)
//                exp.fulfill()
//        }
//        
//        waitForExpectations(timeout: 0.5, handler: nil)
//    }
//    
//    
    func testJSON() {
        let a = JSON("{\"a\":null}")
        print(a["a"].string)
    }
    
    func testIBeacon() {
        let a = Conversion.ibeaconUUIDString_to_reversed_uint8_array("782995c1-4f88-47dc-8cc1-426a520ec57f")
        print(a)
        let aInv = a.reversed() as [UInt8]
        print(Conversion.uint8_array_to_hex_string(aInv))
    }
    
    func testDataAPI() {
        var data = [123,232,321,12]
        
        print(data[1...])
    }
    
    func testEnums() {
        if let x = DeviceType(rawValue: 1) {
            print("X",x,String(describing: x))
        }
        print("XZ")
    }
    
    func testScheduleConfig() {
        let config = ScheduleConfigurator(
            scheduleEntryIndex: 0,
            startTime: 1499903011,
            switchState: 1.0
        )
        
        config.fadeDuration = 0
        config.intervalInMinutes = 0
        config.override.location = false
        config.repeatDay.Monday = true
        config.repeatDay.Tuesday = true
        config.repeatDay.Wednesday = true
        config.repeatDay.Thursday = true
        config.repeatDay.Friday = true
        config.repeatDay.Saturday = false
        config.repeatDay.Sunday = false
        
        
        print("packet: \(config.getPacket())")
        print("repeatType: \(config.repeatType)")
        print("actionType: \(config.actionType)")
        print("override.getMask(): \(config.override.getMask())")
        print("repeatDay(): \(config.repeatDay.getMask())")
       
        let x = 0x01
        print("self.repeatType = \(x & 0x0f)")
        print("actionType = \((x >> 4) & 0x0f)")
        
    }
    
    
    func testClearIteratingDict() {
        var dict = [String: Int]()
        dict["test1"] = 1
        dict["test2"] = 2
        dict["test3"] = 3
        dict["test4"] = 4
        dict["test5"] = 5
        dict["test6"] = 3
        dict["test7"] = 7
        dict["test8"] = 2
        dict["test9"] = 1
        dict["test10"] = 10
        
        for (keyStr, value) in dict {
            if value < 5 {
                dict.removeValue(forKey: keyStr)
            }
        }
        
        print(dict)
    }
    
    func testBroadcast() {
//        let key : [UInt8] = [1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6]
//
//        let locationState = LocationState(sphereUID: 10,locationId: 10,profileIndex: 3, referenceId: nil)
//
//        _ = BroadcastProtocol.getServicesForBackgroundBroadcast(locationState: locationState, key: key)
        
    }
    
    
    func testRC5() {
        let key : [UInt8] = [1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6]
        let key2 = Conversion.string_to_uint8_array("guestKeyForOther")
        
        let s = RC5ExpandKey(key: key)
        
        XCTAssertEqual(s, [16160, 23794, 48080, 6127, 11770, 21865, 29281, 34441, 8708, 55074, 26751, 7977, 8239, 32703, 9128, 5605, 47398, 63696, 16646, 40342, 61206, 18736, 18378, 32683, 22325, 45994])
        
        let input : UInt32 = 971374602
        let enc = RC5Encrypt(input: input, key: key2)
        print("ENC", enc)
        let dec = RC5Decrypt(input: enc, key: key2)
        print("dec", dec)
        
        XCTAssertEqual(input, dec)
        
        
    }
}
