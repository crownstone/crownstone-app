//
//  services.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 13/06/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation
import CoreBluetooth

public let CrownstonePlugAdvertisementServiceUUID = CBUUID(string: "C001")
public let CrownstoneBuiltinAdvertisementServiceUUID = CBUUID(string: "C002")
public let GuidestoneAdvertisementServiceUUID = CBUUID(string: "C003")
public let DFUServiceUUID = CBUUID(string: "00001530-1212-EFDE-1523-785FEABCD123")

public struct CSServices {
    public static let DeviceInformation         = "180a"
    public static let CrownstoneService         = "24f00000-7d10-4805-bfc1-7663a01c3bff"
    public static let SetupService              = "24f10000-7d10-4805-bfc1-7663a01c3bff"
    public static let GeneralService            = "24f20000-7d10-4805-bfc1-7663a01c3bff"
    public static let PowerService              = "24f30000-7d10-4805-bfc1-7663a01c3bff"
    public static let IndoorLocalizationService = "24f40000-7d10-4805-bfc1-7663a01c3bff"
    public static let ScheduleService           = "24f50000-7d10-4805-bfc1-7663a01c3bff"
    public static let MeshService               = "0000fee4-0000-1000-8000-00805f9b34fb"
}

public struct DFUServices {
    public static let DFU = DFUServiceUUID
}
