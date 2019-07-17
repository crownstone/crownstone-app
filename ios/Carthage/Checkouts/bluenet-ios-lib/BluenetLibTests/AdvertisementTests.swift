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



class AdvertisementTests: XCTestCase {
    
    override func setUp() {
        super.setUp()
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }
    
    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        super.tearDown()
    }
    
    func testTimestampReconstruction() {
        let currentTimestamp : UInt32 = 1515426625
        let LSB_timestamp : UInt16 = NSNumber(value: currentTimestamp % (0xFFFF+1)).uint16Value
        let currentDouble = NSNumber(value: currentTimestamp).doubleValue
        let restoredTimestamp = BluenetLib.reconstructTimestamp(currentTimestamp : currentDouble, LsbTimestamp: LSB_timestamp)
        XCTAssertEqual(currentDouble, restoredTimestamp)
    }
    
    func testTimestamp2Overflow1() {
        let currentTimestamp : Double = 0x5A53FFFF + 1500
        let LSB_timestamp : UInt16 = 0xFFFF
        let restored = BluenetLib.reconstructTimestamp(currentTimestamp: currentTimestamp, LsbTimestamp: LSB_timestamp)
        XCTAssertEqual(currentTimestamp, restored+1500)
    }
    
    func testTimestamp2Overflow2() {
        let currentTimestamp : Double = 0x5A53FFFF
        let LSB_timestamp : UInt16 = 0x000
        let restored = BluenetLib.reconstructTimestamp(currentTimestamp: currentTimestamp, LsbTimestamp: LSB_timestamp)
        XCTAssertEqual(currentTimestamp, restored-1)
    }
    
    func testTimestamp3Overflow3() {
        let currentTimestamp : Double = 0x5A530000 - 1
        let LSB_timestamp : UInt16 = 0x0000
        let restored = BluenetLib.reconstructTimestamp(currentTimestamp: currentTimestamp, LsbTimestamp: LSB_timestamp)
        XCTAssertEqual(currentTimestamp, restored-1)
    }
    
    func testTimestamp3Overflow4() {
        let currentTimestamp : Double = 0x5A537FFF
        let LSB_timestamp : UInt16 = 0x7FFF + 1
        let restored = BluenetLib.reconstructTimestamp(currentTimestamp: currentTimestamp, LsbTimestamp: LSB_timestamp)
        XCTAssertEqual(currentTimestamp, restored - 1)
    }
    
    func testTimestamp3Overflow5() {
        let secondsFromGMT: Double = NSNumber(value: TimeZone.current.secondsFromGMT()).doubleValue
        let currentTimestamp : Double = 0x5A537FFF - 6 - secondsFromGMT
        let LSB_timestamp : UInt16 = 0x7FFF
        let restored = BluenetLib.reconstructTimestamp(currentTimestamp: currentTimestamp, LsbTimestamp: LSB_timestamp)
        XCTAssertEqual(currentTimestamp, restored - 6 - secondsFromGMT)
    }
    
    func testTimestampConvert() {
        let currentTimestamp : Double = 1516206007.7995
        let LSB_timestamp : UInt16 = 34186
        let restored = BluenetLib.reconstructTimestamp(currentTimestamp: currentTimestamp, LsbTimestamp: LSB_timestamp)
        XCTAssertEqual(restored, 1516209546.0)
    }
    
    func testScanReponseTest() {
        // if this doesnt crash its fine.
        let response = ScanResponsePacket([
            4,
            0,0,0,0,
            0,0,0,0,
            0,0,0,0,
            0,0,0,0
        ])
        //print("RESPONSE: \(response.getJSON())")
        //print("RESPONSE: \(response.stringify())")
    }
    
    func testScanResponseParsing() {
        let response = ScanResponsePacket([3,
                                           0, 9, 128, 17,
                                           23, 127, 0, 0,
                                           0, 0, 0, 0,
                                           122, 129, 206, 250])
        //print("RESPONSE: \(response.getJSON())")
    }
}
