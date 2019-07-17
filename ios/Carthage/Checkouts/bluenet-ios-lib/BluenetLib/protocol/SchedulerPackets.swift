//
//  MeshPackets.swift
//  BluenetLib
//
//  Created by Alex de Mulder on 03/02/2017.
//  Copyright © 2017 Alex de Mulder. All rights reserved.
//

import Foundation


/**
 * scheduleEntryIndex: [ 0 .. 9 ] UInt8. Must be smaller than 10. This indicates which timer will be set.
 * nextTime: UInt32. Tells the Crownstone when the first upcoming event will be triggered.
 * switchState: [ 0 .. 1 ] Float. Tells the Crownstone the state to switch to when the scheduled event fires. 0 is off, 1 is on, in between is dimming
 * override: Subclass. Can be used to set the override settings. Default all overrides are off.
        Usage of all options:
            ScheduleConfigurator.override.location = true
 * repeatDay: Subclass. Can be used to set the repeat mask. Default all repeats are off.
        Usage of all options:
            ScheduleConfigurator.repeatDay.Monday    = true    // enable this schedule on Monday
            ScheduleConfigurator.repeatDay.Tuesday   = true    // enable this schedule on Tuesday
            ScheduleConfigurator.repeatDay.Wednesday = true    // enable this schedule on Wednesday
            ScheduleConfigurator.repeatDay.Thursday  = true    // enable this schedule on Thurday
            ScheduleConfigurator.repeatDay.Friday    = true    // enable this schedule on Friday
            ScheduleConfigurator.repeatDay.Saturday  = true    // enable this schedule on Saturday
            ScheduleConfigurator.repeatDay.Sunday    = true    // enable this schedule on Sunnay
 
            ScheduleConfigurator.repeatDay.Everyday  = true    // enable this schedule every day. If this is set, the individual day configuration does not matter.
 * fadeDuration: UInt16. This is the amount of seconds (before the set nextTime) the Crownstone starts to slowly fade into the switchState value. It will have reached the switchState AT the nextTime.
 * intervalInMinutes: UInt16. If this is set larger than 0, the schedule will NOT repeat daily, but every intervalInMinutes minutes.
 * toggle: Boolean. If this is true, the fadeDuration and the switchState are not used. If the Crownstone is ON and the scheduled event fires, it will turn OFF. The next time it will fire, it will turn ON.
**/
public class ScheduleConfigurator {
    public var scheduleEntryIndex : UInt8 = 0
    public var nextTime : UInt32 = 0
    public var switchState : Float = 1.0
    
    public var override : ScheduleOverrideMask!
    public var repeatDay : ScheduleRepeatDayMask!
    public var fadeDuration : UInt16 = 0
    public var intervalInMinutes : UInt16 = 0
    public var toggle = false
    
    var repeatMode : String = ""
    var repeatType : UInt8 = 0
    private var repeatPayload = [UInt8]()
    var actionType : UInt8 = 0
    private var actionPayload = [UInt8]()
    
    
    public init(scheduleEntryIndex: UInt8, startTime: TimeInterval, switchState: Float) {
        if (scheduleEntryIndex > 9) {
            LOG.error("SchedulerPackets: ID CANNOT BE LARGER THAN 9!")
        }
        
        self.scheduleEntryIndex = scheduleEntryIndex
        
        self.override = ScheduleOverrideMask()
        self.repeatDay = ScheduleRepeatDayMask()
        
        self.switchState = switchState
        self.nextTime = NSNumber(value: startTime).uint32Value
        
        self.actionPayload = [UInt8]()
        self.repeatPayload = [UInt8]()
    }
    
    public init(scheduleEntryIndex: UInt8, data: [UInt8]) {
        if (data.count == 12) {
            self.scheduleEntryIndex = scheduleEntryIndex
            
            // data[0] is reserved.
            
            self.repeatType = data[1] & 0x0f
            self.actionType = (data[1] >> 4) & 0x0f
            
            self.override = ScheduleOverrideMask(data: data[2])
            
            self.nextTime = Conversion.uint8_array_to_uint32([data[3],data[4],data[5],data[6]])
            switch (self.repeatType) {
            case 0:
                self.intervalInMinutes = Conversion.uint8_array_to_uint16([data[7],data[8]])
                self.repeatDay = ScheduleRepeatDayMask()
                break
            case 1:
                self.repeatDay = ScheduleRepeatDayMask(data: data[7])
                break
            case 2:
                self.repeatDay = ScheduleRepeatDayMask()
                break
            default:
                self.repeatDay = ScheduleRepeatDayMask()
                break
            }
            
            switch (self.actionType) {
            case 0:
                self.switchState = NSNumber(value: data[9]).floatValue / 100.0
                break
            case 1:
                self.switchState = NSNumber(value: data[9]).floatValue / 100.0
                self.fadeDuration = Conversion.uint8_array_to_uint16([data[10],data[11]])
                break
            case 2:
                self.toggle = true
                break
            default:
                break
            }
        }
        else {
            LOG.error("SchedulerPackets: schedule entry must be of size 12 in order to parse!")
        }
    }
    
    
    func _getType() -> UInt8 {
        return self.repeatType + self.actionType << 4
    }
    
    func _setRepeatType() {
        let repeatDayMask = self.repeatDay.getMask()
        if (repeatDayMask > 0) {
            self.repeatType = 1
            self.repeatPayload = [repeatDayMask,0]
            self.repeatMode = "24h"
        }
        else if (intervalInMinutes > 0) {
            self.repeatType = 0
            self.repeatPayload = Conversion.uint16_to_uint8_array(self.intervalInMinutes)
            self.repeatMode = "minute"
        }
        else {
            self.repeatType = 2
            self.repeatPayload = [0,0]
            self.repeatMode = "none"
        }
    }
    
    func _setActionType() {
        let switchState = NSNumber(value: min(1,max(0,self.switchState))*100).uint8Value
        if (self.toggle) {
            self.actionType = 2
            self.actionPayload = [0,0,0]
        }
        else if (self.fadeDuration > 0) {
            self.actionType = 1
            self.actionPayload = [UInt8]()
            self.actionPayload.append(switchState)
            self.actionPayload += Conversion.uint16_to_uint8_array(self.fadeDuration)
        }
        else {
            self.actionType = 0
            self.actionPayload = [switchState,0,0]
        }
    }
    
    public func isAvailable() -> Bool {
        return nextTime == 0
    }
    
    public func isActive() -> Bool {
        return !self.isAvailable()
    }
    
    public func getPacket() -> [UInt8] {
        self._setActionType()
        self._setRepeatType()
        
        var arr = [UInt8]()
        arr.append(self.scheduleEntryIndex)
        arr.append(0) // reserved
        arr.append(self._getType())
        arr.append(self.override.getMask())
        arr += Conversion.uint32_to_uint8_array(self.nextTime)
        arr += self.repeatPayload
        arr += self.actionPayload
        
        return arr
    }
    
    public func getScheduleDataFormat() -> NSDictionary {
        var data = [String: Any]()
        
        self._setRepeatType()
        self._setActionType()
        
        data["scheduleEntryIndex"]     = self.scheduleEntryIndex
        data["nextTime"]               = self.nextTime
        data["switchState"]            = self.switchState
        data["fadeDuration"]           = self.fadeDuration
        data["intervalInMinutes"]      = self.intervalInMinutes
        data["ignoreLocationTriggers"] = self.override.location
        data["active"]                 = true
        data["repeatMode"]             = self.repeatMode
        data["activeMonday"]           = self.repeatDay.Monday    || self.repeatDay.Everyday
        data["activeTuesday"]          = self.repeatDay.Tuesday   || self.repeatDay.Everyday
        data["activeWednesday"]        = self.repeatDay.Wednesday || self.repeatDay.Everyday
        data["activeThursday"]         = self.repeatDay.Thursday  || self.repeatDay.Everyday
        data["activeFriday"]           = self.repeatDay.Friday    || self.repeatDay.Everyday
        data["activeSaturday"]         = self.repeatDay.Saturday  || self.repeatDay.Everyday
        data["activeSunday"]           = self.repeatDay.Sunday    || self.repeatDay.Everyday

        return data as NSDictionary
    }
    
}

public class ScheduleOverrideMask {
    public var location = false
    
    init() {}
    
    init(data: UInt8) {
        self.location = (data >> 1) & 0x01 == 1
    }
    
    public func getMask() -> UInt8 {
        var mask : UInt8 = 0
        
        // bits:
        let locationOverrideBit : UInt8 = location ? 1 : 0
            
        mask = mask | locationOverrideBit << 1
            
        return mask
    }
}

public class ScheduleRepeatDayMask {
    public var Monday    = false
    public var Tuesday   = false
    public var Wednesday = false
    public var Thursday  = false
    public var Friday    = false
    public var Saturday  = false
    public var Sunday    = false
    public var Everyday  = false
    
    init() {}
    
    init(data: UInt8) {
        self.Sunday    = (data >> 0) & 0x01 == 1
        self.Monday    = (data >> 1) & 0x01 == 1
        self.Tuesday   = (data >> 2) & 0x01 == 1
        self.Wednesday = (data >> 3) & 0x01 == 1
        self.Thursday  = (data >> 4) & 0x01 == 1
        self.Friday    = (data >> 5) & 0x01 == 1
        self.Saturday  = (data >> 6) & 0x01 == 1
        self.Everyday       = (data >> 7) & 0x01 == 1
     
        if (self.Everyday) {
            self.Monday    = true
            self.Tuesday   = true
            self.Wednesday = true
            self.Thursday  = true
            self.Friday    = true
            self.Saturday  = true
            self.Sunday    = true
        }
    }
    
    public func getMask() -> UInt8 {
        var mask : UInt8 = 0
        
        // bits:
        let MondayBit    : UInt8 = Monday    ? 1 : 0
        let TuesdayBit   : UInt8 = Tuesday   ? 1 : 0
        let WednesdayBit : UInt8 = Wednesday ? 1 : 0
        let ThursdayBit  : UInt8 = Thursday  ? 1 : 0
        let FridayBit    : UInt8 = Friday    ? 1 : 0
        let SaturdayBit  : UInt8 = Saturday  ? 1 : 0
        let SundayBit    : UInt8 = Sunday    ? 1 : 0
        let EverydayBit  : UInt8 = Everyday  ? 1 : 0
        
    
        // configure mask
        mask = mask | SundayBit    << 0
        mask = mask | MondayBit    << 1
        mask = mask | TuesdayBit   << 2
        mask = mask | WednesdayBit << 3
        mask = mask | ThursdayBit  << 4
        mask = mask | FridayBit    << 5
        mask = mask | SaturdayBit  << 6
        mask = mask | EverydayBit  << 7
        
        // if all days are set, set all true as well.
        if (mask == 127) {
            mask = 255
        }
        
        return mask
    }
}









