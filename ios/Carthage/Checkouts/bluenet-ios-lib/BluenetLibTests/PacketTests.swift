//
//  PacketTests.swift
//  BluenetLibTests
//
//  Created by Alex de Mulder on 22/01/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//


import XCTest
import SwiftyJSON
@testable import BluenetLib



class PacketTests: XCTestCase {
    
    override func setUp() {
        super.setUp()
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }
    
    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        super.tearDown()
    }
    
    func testControlPackets() {
        print("getAllowDimmingPacket \(ControlPacketsGenerator.getAllowDimmingPacket(true))")
        print("getCommandFactoryResetPacket \(ControlPacketsGenerator.getCommandFactoryResetPacket())")
        print("getDisconnectPacket \(ControlPacketsGenerator.getDisconnectPacket())")
        print("getKeepAliveStatePacket \(ControlPacketsGenerator.getKeepAliveStatePacket(changeState: false, state: 1, timeout: 135))")
        
        print("getKeepAliveStatePacket \(ControlPacketsGenerator.getKeepAliveStatePacket(changeState: true, state: 1, timeout: 0))")
        
        print("getKeepAliveStatePacket \(ControlPacketsGenerator.getKeepAliveStatePacket(changeState: true, state: 0, timeout: 500))")
        print("getLockSwitchPacket \(ControlPacketsGenerator.getLockSwitchPacket(true))")
        print("getPutInDFUPacket \(ControlPacketsGenerator.getPutInDFUPacket())")
        print("getResetPacket \(ControlPacketsGenerator.getResetPacket())")
        print("getPwmSwitchPacket \(ControlPacketsGenerator.getPwmSwitchPacket(0))")
        print("getResetErrorPacket \(ControlPacketsGenerator.getResetErrorPacket(errorMask: 0xabcdef02))")
        print("getScheduleRemovePacket \(ControlPacketsGenerator.getScheduleRemovePacket(timerIndex: 2))")
        print("getSetTimePacket \(ControlPacketsGenerator.getSetTimePacket(1516616561))")
        print("getSwitchStatePacket \(ControlPacketsGenerator.getSwitchStatePacket(0.4))")
    }
    
    func testMeshPackets() {
        let skpPackets = [
            StoneKeepAlivePacket(crownstoneId: 1, action: true, state: 0.2),
            StoneKeepAlivePacket(crownstoneId: 2, action: true, state: 0.2),
            StoneKeepAlivePacket(crownstoneId: 3, action: true, state: 0.2)
        ]
        
        let smsPackets = [
            StoneMultiSwitchPacket(crownstoneId: 1, state: 0.5, timeout: 15, intent: IntentType.regionExit),
            StoneMultiSwitchPacket(crownstoneId: 2, state: 0.5, timeout: 15, intent: IntentType.regionExit),
            StoneMultiSwitchPacket(crownstoneId: 3, state: 0.5, timeout: 15, intent: IntentType.regionExit)
        ]
        
        print("StoneKeepAlivePacket \(StoneKeepAlivePacket(crownstoneId: 1, action: true, state: 0.2).getPacket())")
        print("MeshKeepAlivePacket \(MeshKeepAlivePacket(type: .sharedTimeout, timeout: 60, packets: skpPackets).getPacket())")
        print("MeshCommandType \(MeshCommandPacket(type: .control, crownstoneIds: [1,2,3,4], payload: [0xff,0xff]).getPacket())")
        print("StoneMultiSwitchPacket \(StoneMultiSwitchPacket(crownstoneId: 1, state: 0.5, timeout: 15, intent: IntentType.regionExit).getPacket())")
        print("MeshMultiSwitchPacket \(MeshMultiSwitchPacket(type: .simpleList, packets: smsPackets).getPacket())")
    }
    
}
