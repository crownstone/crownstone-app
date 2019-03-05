//
//  SortedCrownstoneCollection.swift
//  DevStone
//
//  Created by Alex de Mulder on 27/11/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import WatchKit
import BluenetWatch

class SortedCrownstoneCollection {
    var items = [String: [String: Any]]()
    
    var lock = false
    var itemOrder = [String]()
    var itemMap = [String: Any]()
    
    
    // config
    let timeout : Double = 4 //seconds
    
    init() {}
    
    public func load(advertisement: Advertisement, verified: Bool) {
        let currentTime = Date().timeIntervalSince1970
        // sometimes rssi can be 0 or 127, this is an invalid data point.
        if advertisement.rssi.int8Value < 0 {
            self.items[advertisement.handle] = ["updatedAt": currentTime, "data": advertisement, "verified": verified]
        }
        
        self.removeExpired()
    }
    
    public func removeItem(handle: String) {
        if self.items[handle] != nil {
            self.items.removeValue(forKey: handle)
            self.itemMap.removeValue(forKey: handle)
        }
    }
    
    public func getSortedList() -> [[String: Any]] {
        self.removeExpired()
        
        var list = [[String: Any]]()
        
        if (self.lock && self.itemOrder.count > 1) {
            for (_, advData) in self.items {
                let adv = (advData["data"]! as! Advertisement)
                if (self.itemMap[adv.handle] == nil) {
                    self.itemOrder.append(adv.handle)
                }
                self.itemMap[adv.handle] = advData
            }
            
            for handle in self.itemOrder {
                if (self.items[handle] != nil) {
                   list.append(self.items[handle]!)
                }
            }
            
            return list
        }
        
        for (_, advData) in self.items {
            list.append(advData)
        }
        list.sort { (a, b) -> Bool in
            let aAdv = (a["data"]! as! Advertisement)
            let bAdv = (b["data"]! as! Advertisement)
            
            if (aAdv.operationMode == .setup && bAdv.operationMode == .setup) {
                return (a["data"]! as! Advertisement).rssi.int8Value >  bAdv.rssi.int8Value
            }
            else if (aAdv.operationMode == .setup) {
                return true
            }
            else if (bAdv.operationMode == .setup) {
                return false
            }
            return aAdv.rssi.int8Value >  bAdv.rssi.int8Value
        }
        
        self.itemOrder.removeAll()
        for element in list {
            let handle = (element["data"]! as! Advertisement).handle
            self.itemOrder.append(handle)
            self.itemMap[handle] = self.items[handle]
        }
        
        return list
    }
    
    public func removeExpired() {
        let currentTime = Date().timeIntervalSince1970
        for (handle, advertisement) in self.items {
            var threshold = self.timeout
            if advertisement["verified"] as? Bool == true {
              threshold = 2*self.timeout
            }
            if currentTime - (advertisement["updatedAt"] as! Double) > threshold {
                self.items.removeValue(forKey: handle)
            }
        }
    }
    
    
}
