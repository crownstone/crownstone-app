//
//  CSInterfaceController
//  WatchTower Extension
//
//  Created by Alex de Mulder on 22/11/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation
import WatchKit
import BluenetWatch
import WatchConnectivity


class SwitchInterfaceController: WKInterfaceController {
    @IBOutlet weak var csTable: WKInterfaceTable!
    
    var switchableStoneList : [String: SwitchableStone]!
    var existingRowTypes : [String]!
    
    
    func updateList(data: Any) {
        let sortedList = bluenetManager.listOfCrownstones.getSortedList()

        var redrawRequired = false
        
        var typeRows = [String]()
        var elementRows = [SwitchableStone]()

        var counter = 0
        for item in sortedList {
            let verified = item["verified"]! as! Bool
            let adv = (item["data"]! as! Advertisement)
            
            if verified == false                    { continue }
            if adv.getOperationMode() != .operation { continue }
            
            typeRows.append("SwitchRow")
            
            if self.switchableStoneList[adv.handle] == nil {
                self.switchableStoneList[adv.handle] = SwitchableStone(advertisement: adv, verified: verified)
            }
            else {
                self.switchableStoneList[adv.handle]!.update(advertisement: adv, verified: verified)
            }
            elementRows.append(self.switchableStoneList[adv.handle]!)
            counter += 1
            if (counter > 8) {
                break
            }
        }
        typeRows.append("EmptyRow")
        
        if self.existingRowTypes.elementsEqual(typeRows) == false {
            redrawRequired = true
            self.existingRowTypes = typeRows
        }
        
        applyTableToArray(typeRows, elementRows, redrawRequired)
    
    }
    
    
    
    func applyTableToArray(_ state: [String], _ data: [SwitchableStone], _ redrawRequired: Bool) {
        if redrawRequired {
            csTable.setRowTypes(state)
        }
        
        for index in 0..<csTable.numberOfRows {
            if let controller = csTable.rowController(at: index) as? SwitchRowController {
                controller.switchableStone = data[index]
            }
            if let controller = csTable.rowController(at: index) as? SliderRowController {
                controller.switchableStone = data[index]
            }
            if let controller = csTable.rowController(at: index) as? RssiRowController {
                controller.switchableStone = data[index]
            }
            
        }
    }
    
    
    var subscriptions : [voidCallback]!
    override func willActivate() {
        // This method is called when watch view controller is about to be visible to user
        super.willActivate()
        
        self.switchableStoneList = [String: SwitchableStone]()
        self.existingRowTypes = [String]()
        self.subscriptions = [voidCallback]()
        self.subscriptions.append(eventBus.on(Event.newVerifiedAdvertisement, self.updateList))
        self.subscriptions.append(eventBus.on(Event.bleAction, self.updateList))
        self.updateList(data: true)
    }
    
    override func didDeactivate() {
        // This method is called when watch view controller is no longer visible
        super.didDeactivate()
        
        self.switchableStoneList.removeAll()
        self.existingRowTypes.removeAll()
        
        for unsubscribe in self.subscriptions {
            unsubscribe()
        }

        self.subscriptions.removeAll()
    }
}
