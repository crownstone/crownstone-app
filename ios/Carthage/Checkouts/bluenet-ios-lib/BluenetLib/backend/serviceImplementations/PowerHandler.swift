//
//  PowerHandler
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 10/08/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation
import PromiseKit
import CoreBluetooth

public class PowerHandler {
    let bleManager : BleManager!
    var settings : BluenetSettings!
    let eventBus : EventBus!
    
    init (bleManager:BleManager, eventBus: EventBus, settings: BluenetSettings) {
        self.bleManager = bleManager
        self.settings   = settings
        self.eventBus   = eventBus
    }
    
    /**
     * Set the switch state. If 0 or 1, switch on or off. If 0 < x < 1 then dim.
     * TODO: currently only relay is supported.
     */
    public func switchRelay(_ state: UInt8) -> Promise<Void> {
        LOG.info("BLUENET_LIB: switching relay to \(state)")
        let packet : [UInt8] = [state]
        return self.bleManager.writeToCharacteristic(
            CSServices.PowerService,
            characteristicId: PowerCharacteristics.Relay,
            data: Data(bytes: UnsafePointer<UInt8>(packet), count: packet.count),
            type: CBCharacteristicWriteType.withResponse
        )
    }
    
    
    /**
     * Set the switch state. If 0 or 1, switch on or off. If 0 < x < 1 then dim.
     * TODO: currently only relay is supported.
     */
    public func switchPWM(_ state: UInt8) -> Promise<Void> {
        LOG.info("BLUENET_LIB: switching relay to \(state)")
        let packet : [UInt8] = [state]
        return self.bleManager.writeToCharacteristic(
            CSServices.PowerService,
            characteristicId: PowerCharacteristics.PWM,
            data: Data(bytes: UnsafePointer<UInt8>(packet), count: packet.count),
            type: CBCharacteristicWriteType.withResponse
        )
    }
    
    
    
    
    public func notifyPowersamples() -> Promise<voidPromiseCallback> {
        let successCallback = {(data: [UInt8]) -> Void in
            let samples = PowerSamples(data: data)
            if (samples.valid) {
                if (self.bleManager.settings.encryptionEnabled) {
                    
                }
                else {
                    
                }
                
                LOG.debug("collectedSamples \(samples.current.count) \(samples.voltage.count) \(samples.currentTimes.count) \(samples.voltageTimes.count)")
            }
        }
        let merger = NotificationMerger(callback: successCallback)
        
        let callback = {(data: Any) -> Void in
            if let castData = data as? Data {
                merger.merge(castData.bytes)
            }
        }
        return self.bleManager.enableNotifications(CSServices.PowerService, characteristicId: PowerCharacteristics.PowerSamples, callback: callback)
    }
    

    
    
    
    // MARK : Support functions
    
    
    
}
