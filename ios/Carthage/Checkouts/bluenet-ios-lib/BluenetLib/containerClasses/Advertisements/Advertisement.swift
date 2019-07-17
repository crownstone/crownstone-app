//
//  Advertisement.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 17/06/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation
import CoreBluetooth
import SwiftyJSON

/**
 * Wrapper for all relevant data of the object
 *
 */
public class Advertisement {
    public var handle : String
    public var name : String
    public var rssi : NSNumber
    public var referenceId : String? // id of the entity that provides the keys
    
    public var isCrownstoneFamily  : Bool = false
    public var operationMode : CrownstoneMode = .unknown
    
//    public var serviceData = [String: [UInt8]]()
    public var serviceDataAvailable : Bool
    public var serviceUUID : CBUUID?
    public var scanResponse : ScanResponsePacket?
    
    init(handle: String, name: String?, rssi: NSNumber, serviceData: [CBUUID: Data]?, serviceUUID: [CBUUID]?) {
        if (name != nil) {
            self.name = name!
        }
        else {
            self.name = ""
        }
        self.handle = handle
        self.rssi = rssi
        self.serviceDataAvailable = false
        
        if serviceData != nil {
            for (serviceCUUID, data) in serviceData! {
                self.serviceUUID = serviceCUUID
                self.serviceDataAvailable = true
                if (self.serviceUUID == CrownstonePlugAdvertisementServiceUUID ||
                    self.serviceUUID == CrownstoneBuiltinAdvertisementServiceUUID ||
                    self.serviceUUID == GuidestoneAdvertisementServiceUUID) {
                    self.scanResponse        =  ScanResponsePacket(data.bytes, serviceUUID: self.serviceUUID)
                    self.isCrownstoneFamily  =  self.scanResponse!.hasCrownstoneDataFormat()
                    break
                }
            }
        }
        
        
        if self.serviceUUID == nil && serviceUUID != nil && serviceUUID!.count > 0 {
            self.serviceUUID = serviceUUID![0] // assuming only one service data uuid
            if (self.serviceUUID == DFUServiceUUID) {
                self.operationMode = .dfu
            }
        }
        
        
        
        self.operationMode = self.getOperationMode()
    }
    
    func getNumberArray(_ data: [UInt8]) -> [NSNumber] {
        var numberArray = [NSNumber]()
        for uint8 in data {
            numberArray.append(NSNumber(value: uint8))
        }
        return numberArray
    }
    

    public func getUniqueElement() -> String {
        if ((scanResponse) != nil) {
            return scanResponse!.getUniqueElement()
        }
        return "NO_UNIQUE_ELEMENT"
    }
    
    public func getJSON() -> JSON {
        return JSON(self.getDictionary())
    }
    
    public func getDictionary() -> NSDictionary {
        var returnDict : [String: Any] = [
            "handle" : self.handle,
            "name"   : self.name,
            "rssi"   : self.rssi,
            "isCrownstoneFamily"   : self.isCrownstoneFamily,
            "isInDFUMode"          : self.operationMode == .dfu,
        ]
        
        if (self.referenceId != nil) {
            returnDict["referenceId"] = self.referenceId!
        }
        
        if (self.serviceUUID != nil) {
            returnDict["serviceUUID"] = self.serviceUUID!
        }
        
        if (self.serviceDataAvailable) {
            if (self.isCrownstoneFamily) {
                returnDict["serviceData"] = self.scanResponse!.getDictionary()
            }
            else {
                returnDict["serviceData"] = nil
            }
        }
        
        return returnDict as NSDictionary
    }

    
    public func stringify() -> String {
        return JSONUtils.stringify(self.getJSON())
    }
    
    
    public func getOperationMode() -> CrownstoneMode {
        if (self.operationMode == .unknown) {
            if (self.scanResponse != nil) {
                return self.scanResponse!.getOperationMode()
            }
            else {
                return CrownstoneMode.unknown
            }
        }
        
        return self.operationMode
    }
    
    public func hasScanResponse() -> Bool {
        return (serviceDataAvailable && self.scanResponse != nil)
    }
    
    public func decrypt( _ key: [UInt8] ) {
        if (serviceDataAvailable && self.scanResponse != nil) {
            self.scanResponse!.decrypt(key)
        }
    }
    
    public func parse() {
        if (serviceDataAvailable && self.scanResponse != nil) {
            self.scanResponse!.parseWithoutDecrypting()
        }
    }
    
    
    
}




