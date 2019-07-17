//
//  services.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 02/02/17.
//  Copyright © 2016 Alex de Mulder. All rights reserved.

import Foundation

/*
 *
 *
 *  These are valid for SDK 0.8.0
 *
 *
 */

enum MeshChannel : UInt8 {
    case KeepAlive       = 1
    case StateBroadcast  = 2
    case StateChange     = 3
    case Command         = 4
    case CommandReply    = 5
    case ScanResult      = 6
    case BigData         = 7
    case MultiSwitch     = 8
}


