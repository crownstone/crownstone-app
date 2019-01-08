//
//  SliderRowController.swift
//  WatchTower Extension
//
//  Created by Alex de Mulder on 26/11/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation
import WatchKit
import WatchConnectivity

class SliderRowController: NSObject {
    @IBOutlet var background: WKInterfaceGroup!
    
    @IBOutlet var separator: WKInterfaceSeparator!
    @IBOutlet var stoneName: WKInterfaceLabel!
    @IBOutlet var stoneSlider: WKInterfaceSlider!
    
    
    var switchableStone: SwitchableStone? {
        didSet {
            guard let stone = switchableStone else { return }
            stoneName.setText(stone.name)
        }
    }
}
