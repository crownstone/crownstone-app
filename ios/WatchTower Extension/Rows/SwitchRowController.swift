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
    
    @IBAction func switchToggled(_ value: Bool) {
        
        print("switchToggled")
        
        if let stone = self.switchableStone {
            var newSwitchState : Float = 0.0
            if value {
                newSwitchState = 1.0
            }
            
            print("Starting Toggle")
            
            stone.pendingAction = true
            bluenetManager.switchStoneBroadcast(stone.referenceId, stoneId: stone.crownstoneId, newSwitchState)
        }
    }
    
    func showSwitchingLabel() {
        if bluenetManager.performingStone == switchableStone!.handle {
            loadingText.setTextColor(UIColor(red:0.16, green:0.99, blue:0.35, alpha:1.0))
        }
        else {
            loadingText.setTextColor(UIColor(red:1, green:1, blue:1, alpha:1.0))
        }
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
            
            if bluenetManager.pendingStones[stone.handle] != nil {
                self.showSwitchingLabel()
            }
        
            if (bluenetManager.pendingStones[stone.handle] == nil) {
                self.hideSwitchingLabel()
                
                if stone.getState() != self.stateOfSwitch {
                    stoneSwitch.setOn(stone.getState())
                }
                self.stateOfSwitch = stone.getState()
            }
           
//            if (stone.mode == .operation) {
//                if (stone.verified == true) {
//                    background.setBackgroundColor(UIColor(red:0.00, green:0.44, blue:0.52, alpha:1.0))
//                }
//                else {
//                    background.setBackgroundColor(UIColor(red:0.00, green:0.07, blue:0.13, alpha:1.0))
//                }
//            }
//            else if (stone.mode == .setup) {
//                background.setBackgroundColor(UIColor(red:0.18, green:0.68, blue:1.00, alpha:1.0))
//            }
//            else if (stone.mode == .dfu) {
//                background.setBackgroundColor(UIColor(red:0.54, green:0.00, blue:1.00, alpha:1.0))
//            }
//            else {
//                background.setBackgroundColor(UIColor(red:0.00, green:0.07, blue:0.13, alpha:1.0))
//            }
        }
    }
}
