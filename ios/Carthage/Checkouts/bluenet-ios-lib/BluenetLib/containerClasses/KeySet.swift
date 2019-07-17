//
//  KeySet.swift
//  BluenetLib
//
//  Created by Alex de Mulder on 30/08/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation


public class KeySet {
    public var adminKey       : [UInt8]? = nil
    public var memberKey      : [UInt8]? = nil
    public var basicKey       : [UInt8]? = nil
    public var localizationKey: [UInt8]? = nil
    public var serviceDataKey : [UInt8]? = nil
    public var initializedKeys = false
    public var referenceId : String = "unknown"
    public var userLevel : UserLevel = .unknown
    
    public init(adminKey: String?, memberKey: String?, basicKey: String?, localizationKey: String?, serviceDataKey: String?, referenceId: String) {
        self.referenceId = referenceId
        
        if (adminKey != nil) {
            self.adminKey = Conversion.ascii_or_hex_string_to_16_byte_array(adminKey!)
        }
        else {
            self.adminKey = nil;
        }
        if (memberKey != nil) {
            self.memberKey = Conversion.ascii_or_hex_string_to_16_byte_array(memberKey!)
        }
        else {
            self.memberKey = nil;
        }
        if (basicKey != nil) {
            self.basicKey = Conversion.ascii_or_hex_string_to_16_byte_array(basicKey!)
        }
        else {
            self.basicKey = nil;
        }
        if (localizationKey != nil) {
            self.localizationKey = Conversion.ascii_or_hex_string_to_16_byte_array(localizationKey!)
        }
        else {
            self.localizationKey = nil;
        }
        if (serviceDataKey != nil) {
            self.serviceDataKey = Conversion.ascii_or_hex_string_to_16_byte_array(serviceDataKey!)
        }
        else {
            self.serviceDataKey = nil;
        }
        
        self.initializedKeys = true
        
        detemineUserLevel()
    }
    
    func detemineUserLevel() {
        if (self.adminKey != nil && self.adminKey!.count == 16) {
            userLevel = .admin
        }
        else if (self.memberKey != nil && self.memberKey!.count == 16) {
            userLevel = .member
        }
        else if (self.basicKey != nil && self.basicKey!.count == 16) {
            userLevel = .basic
        }
        else {
            userLevel = .unknown
            self.initializedKeys = false
        }
    }
    
    
}
