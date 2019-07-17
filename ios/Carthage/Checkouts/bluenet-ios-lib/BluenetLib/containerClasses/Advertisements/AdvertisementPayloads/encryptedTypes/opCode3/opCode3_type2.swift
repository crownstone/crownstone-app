//
//  opCode3_type2.swift
//  BluenetLib
//
//  Created by Alex de Mulder on 08/01/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation

func parseOpcode3_type2(serviceData : ScanResponsePacket, data : [UInt8], liteParse: Bool) {
    if (data.count == 16) {
        parseOpcode3_type0(serviceData: serviceData, data: data, liteParse: liteParse)
        
        // apply differences between type 0 and type 2
        serviceData.stateOfExternalCrownstone = true
    }
}
