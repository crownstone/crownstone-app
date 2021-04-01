//
//  CSInterfaceController
//  WatchTower Extension
//
//  Created by Alex de Mulder on 22/11/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation
import WatchKit
import BluenetLib
import WatchConnectivity


class SwitchInterfaceController: WKInterfaceController {
    @IBOutlet weak var csTable: WKInterfaceTable!
    
    @IBOutlet weak var loadingImage: WKInterfaceImage!
    
    var switchableStoneList : [String: SwitchableStone]!
    var existingRowTypes : [String]!
    
    var showingTable = false
    var ticking = false
    
    func updateList(data: Any) {
        let sortedList = bluenetManager.listOfCrownstones.getSortedList()
        
        var redrawRequired = false
        
        var typeRows = [String]()
        var elementRows = [SwitchableStone]()

        var counter = 0
        var validatedItemsFound = false
        
        for item in sortedList {
            let verified = item["verified"]! as! Bool
            let adv = (item["data"]! as! Advertisement)
            
            if verified == false                      { continue }
            if adv.getOperationMode() != .operation { continue }
            
            typeRows.append("SwitchRow")
            
            if self.switchableStoneList[adv.handle] == nil {
                self.switchableStoneList[adv.handle] = SwitchableStone(advertisement: adv, verified: verified)
            }
            else {
                self.switchableStoneList[adv.handle]!.update(advertisement: adv, verified: verified)
            }
            
            validatedItemsFound = true
            elementRows.append(self.switchableStoneList[adv.handle]!)
            counter += 1
            if (counter > 8) {
                break
            }
        }
        
        if validatedItemsFound {
            if self.showingTable == false {
                self.showingTable = true
                self.animate(withDuration: 0.3, animations: {
                    self.loadingImage.setAlpha(0.0)
                    return
                })
                delay(0.3, {
                    self.csTable.setHidden(false)
                    self.loadingImage.setHidden(true)
                    self.animate(withDuration: 0.3, animations: {
                        self.csTable.setAlpha(1.0)
                        return
                    })
                })
            }
        }
        else {
            self.showingTable = false
            self.csTable.setHidden(true)
            self.loadingImage.setHidden(false)
            self.loadingImage.setAlpha(1.0)
            self.csTable.setAlpha(0.0)
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
        
        if self.ticking == false {
            self.tick()
        }
    }
    
    func tick() {
        self.ticking = true
        self.updateList(data: false)
        delay(1, { self.tick() })
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
