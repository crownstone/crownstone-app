//
//  WatchLogger.swift
//  BluenetWatch
//
//  Created by Alex de Mulder on 12/11/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation


#if os(watchOS)

public enum LogLevel : Int {
    case VERBOSE = 0
    case DEBUG
    case INFO
    case WARN
    case ERROR
    case NONE
}


open class LogClass {
    let dir: URL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).last! as URL
    
    var logPrintLevel : LogLevel = .INFO
    var logFileLevel  : LogLevel = .NONE
    var logBaseFilename : String = "BluenetLog"
    var printTimestamps : Bool = false
    
    var lastTimestamp : Double = 0
    
    var daysToStoreLogs : Int = 3
    
    public init() {
    }
    
    public init(daysToStoreLogs: Int) {
        
    }
    
    public init(logBaseFilename: String) {
        
    }
    
    public init(daysToStoreLogs:Int, logBaseFilename: String) {
        
    }
    
    open func setPrintLevel(_ level : LogLevel) {
        logPrintLevel = level
    }
    open func setFileLevel(_ level : LogLevel) {
        logFileLevel = level
    }
    open func setTimestampPrinting( newState: Bool ) {
        printTimestamps = newState
    }
    
    open func verbose(_ data: String) {
        _log("-- VERBOSE: \(data)", level: .VERBOSE, explicitNoWriteToFile: false)
    }
    
    open func debug(_ data: String) {
        _log("-- DEBUG: \(data)", level: .DEBUG, explicitNoWriteToFile: false)
    }
    
    open func info(_ data: String) {
        _log("-- INFO: \(data)", level: .INFO, explicitNoWriteToFile: false)
    }
    
    open func warn(_ data: String) {
        _log("-- WARN: \(data)", level: .WARN, explicitNoWriteToFile: false)
    }
    
    open func error(_ data: String) {
        _log("-- ERROR: \(data)", level: .ERROR, explicitNoWriteToFile: false)
    }
    
    open func fileError(_ data: String) {
        _log(data, level: .ERROR, explicitNoWriteToFile: true)
    }
    
    func _log(_ data: String, level: LogLevel, explicitNoWriteToFile: Bool = false) {
        if (logPrintLevel.rawValue <= level.rawValue) {
            if (printTimestamps) {
                let timestamp = Date().timeIntervalSince1970
                let time = Date().description
                let deltaT = timestamp - self.lastTimestamp
                self.lastTimestamp = timestamp
                print("\(timestamp) (dt: \(deltaT)) @ \(time) \(data)")
            }
            else {
                print(data)
            }
        }
    }
    
    
}

#endif
