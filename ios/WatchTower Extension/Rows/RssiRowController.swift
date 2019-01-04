//
//  RssiRowController.swift
//  WatchTower Extension
//
//  Created by Alex de Mulder on 26/11/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation
import WatchKit
import WatchConnectivity

class RssiRowController: NSObject {
    @IBOutlet var background: WKInterfaceGroup!
    
    @IBOutlet var separator: WKInterfaceSeparator!
    @IBOutlet var stoneName: WKInterfaceLabel!
    @IBOutlet var rssi: WKInterfaceLabel!
        
    var switchableStone: SwitchableStone? {
        didSet {
            guard let stone = switchableStone else { return }
            stoneName.setText(stone.handle)
            rssi.setText(stone.getRssi())
            
            if (stone.mode == .operation) {
                if (stone.verified == true) {
                    background.setBackgroundColor(UIColor(red:0.00, green:0.44, blue:0.52, alpha:1.0))
                }
                else {
                    background.setBackgroundColor(UIColor(red:0.00, green:0.07, blue:0.13, alpha:1.0))
                }
            }
            else if (stone.mode == .setup) {
                background.setBackgroundColor(UIColor(red:0.18, green:0.68, blue:1.00, alpha:1.0))
            }
            else if (stone.mode == .dfu) {
                background.setBackgroundColor(UIColor(red:0.54, green:0.00, blue:1.00, alpha:1.0))
            }
            else {
                background.setBackgroundColor(UIColor(red:0.00, green:0.07, blue:0.13, alpha:1.0))
            }
        }
    }
}
