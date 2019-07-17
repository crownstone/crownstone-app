//
//  ControlHandler.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 10/08/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation
import PromiseKit
import CoreBluetooth

public class ControlPacketsGenerator {
    
    public static func getFactoryResetPacket() -> [UInt8] {
        return Conversion.reverse(Conversion.hex_string_to_uint8_array("deadbeef"));
    }
    
    public static func getSetSchedulePacket(data: [UInt8]) -> [UInt8] {
        return ControlPacket(type: .schedule_ENTRY, payloadArray: data).getPacket()
    }
    
    public static func getScheduleRemovePacket(timerIndex: UInt8) -> [UInt8] {
        return ControlPacket(type: .schedule_REMOVE, payload8: timerIndex).getPacket()
    }
    
    public static func getCommandFactoryResetPacket() -> [UInt8] {
        return FactoryResetPacket().getPacket()
    }
    
    public static func getSwitchStatePacket(_ state: Float) -> [UInt8] {
        let switchState = min(1,max(0,state))*100
        
        let packet = ControlPacket(type: .switch, payload8: NSNumber(value: switchState as Float).uint8Value)
        return packet.getPacket()
    }
    
    public static func getResetPacket() -> [UInt8] {
        return ControlPacket(type: .reset).getPacket()
    }
    
    public static func getPutInDFUPacket() -> [UInt8] {
        return ControlPacket(type: .goto_DFU).getPacket()
    }
    
    public static func getDisconnectPacket() -> [UInt8] {
        return ControlPacket(type: .disconnect).getPacket()
    }
    
    public static func getRelaySwitchPacket(_ state: UInt8) -> [UInt8] {
        return ControlPacket(type: .relay, payload8: state).getPacket()
    }
    
    public static func getPwmSwitchPacket(_ state: Float) -> [UInt8] {
        let switchState = min(1,max(0,state))*100
        return ControlPacket(type: .pwm, payload8: NSNumber(value: switchState as Float).uint8Value).getPacket()
    }
    
    public static func getKeepAliveStatePacket(changeState: Bool, state: Float, timeout: UInt16) -> [UInt8] {
        let switchState = min(1,max(0,state))*100
        
        // make sure we do not
        var actionState : UInt8 = 0
        if (changeState == true) {
            actionState = 1
        }
        
        return keepAliveStatePacket(action: actionState, state: NSNumber(value: switchState as Float).uint8Value, timeout: timeout).getPacket()
    }
    
    public static func getKeepAliveRepeatPacket() -> [UInt8] {
        return ControlPacket(type: .keepAliveRepeat).getPacket()
    }
    
    public static func getResetErrorPacket(errorMask: UInt32) -> [UInt8] {
        return ControlPacket(type: .reset_ERRORS, payload32: errorMask).getPacket()
    }
    
    public static func getSetTimePacket(_ time: UInt32) -> [UInt8] {
        return ControlPacket(type: .set_TIME, payload32: time).getPacket()
    }
    
    public static func getNoOpPacket() -> [UInt8] {
        return ControlPacket(type: .no_OPERATION).getPacket()
    }
    
    public static func getAllowDimmingPacket(_ allow: Bool) -> [UInt8] {
        var allowValue : UInt8 = 0
        if (allow) {
            allowValue = 1
        }
        
        return ControlPacket(type: .allow_dimming, payload8: allowValue).getPacket()
    }
    
    public static func getLockSwitchPacket(_ lock: Bool) -> [UInt8] {
        var lockValue : UInt8 = 0
        if (lock) {
            lockValue = 1
        }
        
        return ControlPacket(type: .lock_switch, payload8: lockValue).getPacket()
    }
    
    public static func getSwitchCraftPacket(_ enabled: Bool) -> [UInt8] {
        var enabledValue : UInt8 = 0
        if (enabled) {
            enabledValue = 1
        }
        
        return ControlPacket(type: .enable_switchcraft, payload8: enabledValue).getPacket()
    }
    
    public static func getSetupPacket(type: UInt8, crownstoneId: UInt8, adminKey: String, memberKey: String, guestKey: String, meshAccessAddress: String, ibeaconUUID: String, ibeaconMajor: UInt16, ibeaconMinor: UInt16) -> [UInt8] {
        var data : [UInt8] = []
        data.append(type)
        data.append(crownstoneId)
        
        data += Conversion.ascii_or_hex_string_to_16_byte_array(adminKey)
        data += Conversion.ascii_or_hex_string_to_16_byte_array(memberKey)
        data += Conversion.ascii_or_hex_string_to_16_byte_array(guestKey)
        
        data += Conversion.hex_string_to_uint8_array(meshAccessAddress)
        
        data += Conversion.ibeaconUUIDString_to_reversed_uint8_array(ibeaconUUID)
        data += Conversion.uint16_to_uint8_array(ibeaconMajor)
        data += Conversion.uint16_to_uint8_array(ibeaconMinor)
        
        return ControlPacket(type: .setup, payloadArray: data).getPacket()
    }
    
    public static func getSetupPacketV2(
        crownstoneId: UInt8, sphereId: UInt8,
        adminKey: String, memberKey: String, basicKey: String, localizationKey: String, serviceDataKey: String, meshNetworkKey: String, meshApplicationKey: String, meshDeviceKey: String,
        ibeaconUUID: String, ibeaconMajor: UInt16, ibeaconMinor: UInt16
        ) -> [UInt8] {
        var data : [UInt8] = []
        data.append(crownstoneId)
        data.append(sphereId)
        
        data += Conversion.ascii_or_hex_string_to_16_byte_array(adminKey)
        data += Conversion.ascii_or_hex_string_to_16_byte_array(memberKey)
        data += Conversion.ascii_or_hex_string_to_16_byte_array(basicKey)
        data += Conversion.ascii_or_hex_string_to_16_byte_array(serviceDataKey)
        data += Conversion.ascii_or_hex_string_to_16_byte_array(localizationKey)
        
        data += Conversion.ascii_or_hex_string_to_16_byte_array(meshDeviceKey)
        data += Conversion.ascii_or_hex_string_to_16_byte_array(meshApplicationKey)
        data += Conversion.ascii_or_hex_string_to_16_byte_array(meshNetworkKey)
        
        data += Conversion.ibeaconUUIDString_to_reversed_uint8_array(ibeaconUUID)
        data += Conversion.uint16_to_uint8_array(ibeaconMajor)
        data += Conversion.uint16_to_uint8_array(ibeaconMinor)
        
        return ControlPacket(type: .setup, payloadArray: data).getPacket()
    }

}
