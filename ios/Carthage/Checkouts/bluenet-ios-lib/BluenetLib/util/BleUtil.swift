//
//  BleUtil.swift
//  BluenetLib
//
//  Created by Alex de Mulder on 24/06/2019.
//  Copyright © 2019 Alex de Mulder. All rights reserved.
//

import Foundation
import CoreBluetooth
import PromiseKit

func _writeSetupControlPacket(bleManager: BleManager, _ packet: [UInt8]) -> Promise<Void> {
    return bleManager.getCharacteristicsFromDevice(CSServices.SetupService)
        .then{(characteristics) -> Promise<Void> in
            if getCharacteristicFromList(characteristics, SetupCharacteristics.SetupControlV2) != nil {
                return bleManager.writeToCharacteristic(
                    CSServices.SetupService,
                    characteristicId: SetupCharacteristics.SetupControlV2,
                    data: Data(bytes: UnsafePointer<UInt8>(packet), count: packet.count),
                    type: CBCharacteristicWriteType.withResponse
                )
            }
            else if getCharacteristicFromList(characteristics, SetupCharacteristics.SetupControl) != nil {
                return bleManager.writeToCharacteristic(
                    CSServices.SetupService,
                    characteristicId: SetupCharacteristics.SetupControl,
                    data: Data(bytes: UnsafePointer<UInt8>(packet), count: packet.count),
                    type: CBCharacteristicWriteType.withResponse
                )
            }
            else {
                return bleManager.writeToCharacteristic(
                    CSServices.SetupService,
                    characteristicId: SetupCharacteristics.Control,
                    data: Data(bytes: UnsafePointer<UInt8>(packet), count: packet.count),
                    type: CBCharacteristicWriteType.withResponse
                )
            }
    }
}
