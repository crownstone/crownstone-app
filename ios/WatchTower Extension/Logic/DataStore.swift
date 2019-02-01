//
//  DataStore.swift
//  WatchTower Extension
//
//  Created by Alex de Mulder on 04/01/2019.
//  Copyright © 2019 Crownstone. All rights reserved.
//

import Foundation



public class DataStore {
    public let store : UserDefaults!
    init() {
        store = UserDefaults.init(suiteName: "validationStore")
    }
    
    func storeNameForHandle(_ handle : String, name: String) {
        var nameDict = self.store.dictionary(forKey: "names")
        if var theDict = nameDict {
            if let storedName = theDict[handle] as? String {
                // do nothing
            }
            else {
                theDict[handle] = name
                dataStore.store.set(theDict as Any?, forKey: "names")
            }
        }
        else {
            dataStore.store.set([handle : name] as Any?, forKey: "names")
        }
    }
    
    func getNameFromHandle(_ handle: String) -> String? {
        var nameDict = self.store.dictionary(forKey: "names")
        if var theDict = nameDict {
            if let storedName = theDict[handle] as? String {
                return storedName
            }
        }
        return nil
    }
    
}
