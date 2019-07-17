//
//  NearestItem.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 02/09/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation
import SwiftyJSON

public class NearestItem {
    var name      : String = ""
    var handle    : String = ""
    var rssi      : Int    = 0
    var setupMode : Bool   = false
    var dfuMode   : Bool   = false
    var verified  : Bool   = false
    
    init(name: String, handle: String, rssi: Int, setupMode: Bool, dfuMode: Bool, verified: Bool) {
        self.name      = name
        self.handle    = handle
        self.rssi      = rssi
        self.setupMode = setupMode
        self.dfuMode   = dfuMode
        self.verified  = verified
    }

    convenience init(nearStone: CrownstoneSummary, setupMode: Bool, dfuMode: Bool) {
        self.init(
            name:      nearStone.name,
            handle:    nearStone.handle,
            rssi:      nearStone.rssi,
            setupMode: setupMode,
            dfuMode:   dfuMode,
            verified:  nearStone.validated
        )
    }
    
    public func getJSON() -> JSON {
        var dataDict = [String : Any]()
        dataDict["name"]      = self.name
        dataDict["handle"]    = self.handle
        dataDict["rssi"]      = self.rssi
        dataDict["setupMode"] = self.setupMode
        dataDict["dfuMode"]   = self.dfuMode
        dataDict["verified"]  = self.verified
        
        let dataJSON = JSON(dataDict)
        return dataJSON
    }
    
    public func stringify() -> String {
        return JSONUtils.stringify(self.getJSON())
    }
    
    public func getDictionary() -> NSDictionary {
        let returnDict : [String: Any] = [
            "name"      : self.name,
            "handle"    : self.handle,
            "rssi"      : self.rssi,
            "setupMode" : self.setupMode,
            "dfuMode"   : self.dfuMode,
            "verified"  : self.verified
        ]
        
        return returnDict as NSDictionary
    }
}
