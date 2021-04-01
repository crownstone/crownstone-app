//
//  CSInterfaceController
//  WatchTower Extension
//
//  Created by Alex de Mulder on 22/11/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.


import Foundation
import WatchKit
import BluenetLib
import WatchConnectivity


class CSInterfaceController: WKInterfaceController {
    @IBOutlet weak var csTable: WKInterfaceTable!
    
    @IBAction func handlePan(_ sender: WKPanGestureRecognizer) {
        print(sender.translationInObject())
    }
    
    
    var switchableStoneList : [String: SwitchableStone]!
    var existingRowTypes : [String]!
        
 
    func updateList(data: Any) {
        let sortedList = bluenetManager.listOfCrownstones.getSortedList()

        var typeRows = [String]()
        var elementRows = [SwitchableStone]()
        var redrawRequired = false
        
        var counter = 0
        for item in sortedList {
            typeRows.append("RssiRow")
            let adv = (item["data"]! as! Advertisement)
            let verified = item["verified"]! as! Bool
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
    
    
    
    func applyTableToArray(_ state: [String], _ data: [SwitchableStone], _ redrawRequired : Bool) {
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
        self.subscriptions.append(eventBus.on(Event.newAdvertisement, self.updateList))
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
