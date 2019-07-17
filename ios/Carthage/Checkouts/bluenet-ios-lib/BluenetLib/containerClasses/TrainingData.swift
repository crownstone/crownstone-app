//
//  TrainingData.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 17/06/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation
import SwiftyJSON

public class TrainingData {
    public var data = [[String: Any]]()
    
    public init() {}
    public init(stringifiedData: String) {
        let jsonData = JSON(parseJSON: stringifiedData)
        if let arr = jsonData.arrayObject {
            for possibleDict in arr {
                if let dict = possibleDict as? [String: Any] {
                    data.append(dict)
                }
            }
        }
    }
    
    func collect(_ ibeaconData: [iBeaconPacket]) {
        var dataDict = [String: Any]()
        
        var devicesDict = [String: NSNumber]()
        for point in ibeaconData {
            devicesDict[point.idString] = point.rssi
        }
        dataDict["devices"] = devicesDict
        dataDict["timestamp"] = NSNumber(value: NSDate().timeIntervalSince1970)
        
        data.append(dataDict);
    }
    
    public func getJSON() -> JSON {
        return JSON(self.data)
    }
    
    public func stringify() -> String {
        return JSONUtils.stringify(JSON(self.data))
    }
}
