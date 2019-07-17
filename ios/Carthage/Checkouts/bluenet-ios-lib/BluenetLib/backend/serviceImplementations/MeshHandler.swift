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

public class MeshHandler {
    let bleManager : BleManager!
    var settings : BluenetSettings!
    let eventBus : EventBus!
    var disconnectCommandTimeList : [String: Double]!
    
    init (bleManager:BleManager, eventBus: EventBus, settings: BluenetSettings) {
        self.bleManager = bleManager
        self.settings   = settings
        self.eventBus   = eventBus
    }
    
    /**
     * This allows you to send a keepAliveState message to multiple Crownstones via the Mesh network.
     * It will make the Crownstone repeat it's last known mesh message.
     */
    public func keepAliveRepeat() -> Promise<Void> {
        let packet = ControlPacket(type: .mesh_keepAliveRepeat).getPacket()
        return self._writeControlPacket(packet)
    }
    
    /**
     * This allows you to send a keepAliveState message to multiple Crownstones via the Mesh network.
     * The timeout is usually per region, stones are in the format:
     * [ [crownstoneId: Number(UInt16), action: Number(Bool), state: Number(Float: [0 .. 1])] ]
     */
    public func keepAliveState(timeout: UInt16, stones: [[String: NSNumber]]) -> Promise<Void> {
        var packets = [StoneKeepAlivePacket]()
        for stone in stones {
            let crownstoneId = stone["crownstoneId"]
            let action       = stone["action"]
            let state        = stone["state"]
            
            if (crownstoneId != nil && action != nil && state != nil) {
                packets.append( StoneKeepAlivePacket(crownstoneId: crownstoneId!.uint8Value, action: action!.boolValue, state: state!.floatValue ))
            }
        }
        
        if (packets.count > 0) {
            let meshPayload = MeshKeepAlivePacket(type: .sharedTimeout, timeout: timeout, packets: packets).getPacket()
            let commandPayload = ControlPacket(type: .mesh_keepAliveState, payloadArray: meshPayload).getPacket()
            return self._writeControlPacket(commandPayload)
        }
        else {
            return Promise<Void> { seal in seal.reject(BluenetError.NO_KEEPALIVE_STATE_ITEMS)}
        }
    }
    
    
    /**
     * This channel is used to send different switch commands with individual timeouts, switch states and intents to different crownstones in one message
     */
    public func multiSwitch(stones:[[String: NSNumber]]) -> Promise<Void> {
        var packets = [StoneMultiSwitchPacket]()
        for stone in stones {
            let crownstoneId = stone["crownstoneId"]
            let timeout      = stone["timeout"]
            let state        = stone["state"]
            let intent       = stone["intent"]
            
            if (crownstoneId != nil && timeout != nil && state != nil && intent != nil) {
                packets.append(StoneMultiSwitchPacket(crownstoneId: crownstoneId!.uint8Value, state: state!.floatValue, timeout: timeout!.uint16Value, intent: intent!.uint8Value))
            }
        }
        
        if (packets.count > 0) {
            let meshPayload = MeshMultiSwitchPacket(type: .simpleList, packets: packets).getPacket()
            let commandPayload = ControlPacket(type: .mesh_multiSwitch, payloadArray: meshPayload).getPacket()
            return self._writeControlPacket(commandPayload)
        }
        else {
            return Promise<Void> { seal in seal.reject(BluenetError.NO_SWITCH_STATE_ITEMS)}
        }
    }
    
    public func batchCommand(crownstoneIds: [UInt8], commandPacket: [UInt8]) -> Promise<Void> {
        let meshPayload = MeshCommandPacket(type: .control, crownstoneIds: crownstoneIds, payload: commandPacket).getPacket()
        let commandPayload = ControlPacket(type: .mesh_command, payloadArray: meshPayload).getPacket()
        return self._writeControlPacket(commandPayload)
    }
    
    public func batchBeaconConfig(crownstoneIds: [UInt8], beaconPacket: [UInt8]) -> Promise<Void> {
        let meshPayload = MeshCommandPacket(type: .beacon, crownstoneIds: crownstoneIds, payload: beaconPacket).getPacket()
        let commandPayload = ControlPacket(type: .mesh_command, payloadArray: meshPayload).getPacket()
        return self._writeControlPacket(commandPayload)
    }
    
    public func batchConfig(crownstoneIds: [UInt8], configPacket: [UInt8]) -> Promise<Void> {
        let meshPayload = MeshCommandPacket(type: .config, crownstoneIds: crownstoneIds, payload: configPacket).getPacket()
        let commandPayload = ControlPacket(type: .mesh_command, payloadArray: meshPayload).getPacket()
        return self._writeControlPacket(commandPayload)
    }
    
    public func batchState(crownstoneIds: [UInt8], statePacket: [UInt8]) -> Promise<Void> {
        let meshPayload = MeshCommandPacket(type: .state, crownstoneIds: crownstoneIds, payload: statePacket).getPacket()
        let commandPayload = ControlPacket(type: .mesh_command, payloadArray: meshPayload).getPacket()
        return self._writeControlPacket(commandPayload)
    }
    
    
    
    // MARK: UTILS
    
    func _writeControlPacket(_ packet: [UInt8]) -> Promise<Void> {
        return self.bleManager.writeToCharacteristic(
            CSServices.CrownstoneService,
            characteristicId: CrownstoneCharacteristics.Control,
            data: Data(bytes: UnsafePointer<UInt8>(packet), count: packet.count),
            type: CBCharacteristicWriteType.withResponse
        )
    }
    
    
    func _readControlPacket() -> Promise<[UInt8]> {
        return self.bleManager.readCharacteristic(
            CSServices.CrownstoneService,
            characteristicId: CrownstoneCharacteristics.Control
        )
    }
    
}

