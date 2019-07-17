//
//  BluenetTimekeeper.swift
//  BluenetLib
//
//  Created by Alex de Mulder on 18/12/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation

public struct UpdateTimePayload {
    var crownstoneId    : UInt8
    var validationNonce : UInt32
    var referenceId     : String
}


public class BluenetTimekeeper {
    let eventBus : EventBus!
    
    init() {
        self.eventBus = EventBus()
    }
    
    public func insertValidatedAdvertisement(adv : Advertisement) {
        if (adv.getOperationMode() == .operation && adv.referenceId != nil) {
            if let data = adv.scanResponse {
                if data.timeSet == false {
                    let payload = UpdateTimePayload(
                        crownstoneId:    data.crownstoneId,
                        validationNonce: NSNumber(value: data.partialTimestamp).uint32Value,
                        referenceId:     adv.referenceId!
                    )
                    
                    self.eventBus.emit("updateTime", payload)
                }
            }
        }
    }
}
