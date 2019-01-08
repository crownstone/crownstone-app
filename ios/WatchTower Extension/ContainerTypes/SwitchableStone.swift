//
//  SwitchableStone.swift
//  WatchTower Extension
//
//  Created by Alex de Mulder on 22/11/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import WatchKit
import BluenetWatch

class SwitchableStone {
    
    public var handle: String!
    public var name : String = "Unknown.."
    public var switchState : Float = 1.0
    public var rssi : Int8 = -67
    public var verified = false
    public var referenceId = "unknown"
  public var crownstoneId : UInt8 = 0
    
    public var mode = CrownstoneMode.unknown
    
    public var pendingAction = false
    
    public init(advertisement: Advertisement, verified: Bool) {
        self.fillValues(advertisement: advertisement, verified: verified)
    }
    
    public func update(advertisement: Advertisement, verified: Bool) {
        self.fillValues(advertisement: advertisement, verified: verified)
    }
    
    func fillValues(advertisement: Advertisement, verified: Bool) {
        self.name = advertisement.name
        self.handle = advertisement.handle
        self.rssi = advertisement.rssi.int8Value
        self.mode = advertisement.getOperationMode()
        self.verified = verified
      
        
        if self.verified {
            self.referenceId = advertisement.referenceId!
            if advertisement.scanResponse!.stateOfExternalCrownstone == false {
                let switchState = advertisement.scanResponse!.switchState
                self.name = "CES Demo"
                self.crownstoneId = advertisement.scanResponse!.crownstoneId
                if switchState == 128 {
                    self.switchState = 1
                }
                else {
                    self.switchState = NSNumber(value: switchState).floatValue / 100.0
                }
            }
        }
    }
    
    public func getState() -> Bool {
        return self.switchState > 0.0
    }
    
    public func getRssi() -> String {
        return String(self.rssi)
    }
}
