//
//  SwitchRowController.swift
//  WatchTower Extension
//
//  Created by Alex de Mulder on 22/11/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import WatchKit
import WatchConnectivity
import PromiseKit

class SwitchRowController: NSObject {
    @IBOutlet var background: WKInterfaceGroup!
    
    @IBOutlet var stoneName: WKInterfaceLabel!
    
    @IBOutlet var separator: WKInterfaceSeparator!
    @IBOutlet var loadingText: WKInterfaceLabel!
    @IBOutlet var stoneSwitch: WKInterfaceSwitch!
    
    var pendingToggle = false
    var stateOfSwitch : Bool? = nil
    var toggleTime : Double = 0
    
    @IBAction func switchToggled(_ value: Bool) {
        
        //print("switchToggled")
        
        if let stone = self.switchableStone {
            self.toggleTime = Date().timeIntervalSince1970
            if value {
                bluenetManager.turnOnCrownstone(stone.referenceId, stoneId: stone.crownstoneId)
            }
            else {
                bluenetManager.switchStoneBroadcast(stone.referenceId, stoneId: stone.crownstoneId, 0)
            }
        }
    }
    
    func showSwitchingLabel() {
        loadingText.setTextColor(UIColor(red:1, green:1, blue:1, alpha:1.0))
        stoneSwitch.setHidden(true)
        stoneName.setHidden(true)
        loadingText.setHidden(false)
    }
    
    func hideSwitchingLabel() {
        stoneSwitch.setHidden(false)
        stoneName.setHidden(false)
        loadingText.setHidden(true)
    }
    
    var switchableStone: SwitchableStone? {
        didSet {
            guard let stone = switchableStone else { return }
            stoneName.setText(stone.name)
            
            self.hideSwitchingLabel()
            
            let now = Date().timeIntervalSince1970
            
            if stone.getState() != self.stateOfSwitch && now - self.toggleTime > 1.5 {
                stoneSwitch.setOn(stone.getState())
            }
            self.stateOfSwitch = stone.getState()
            
        }
    }
}
