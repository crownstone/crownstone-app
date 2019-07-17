//
//  opCode4.swift
//  BluenetLib
//
//  Created by Alex de Mulder on 08/01/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation

func parseOpcode4(serviceData : ScanResponsePacket, data : [UInt8], liteParse: Bool = false) {
    if (data.count == 16) {
        serviceData.dataType = data[0]
        serviceData.setupMode = true
        switch (serviceData.dataType) {
        case 0:
            parseOpcode4_type0(serviceData: serviceData, data: data, liteParse: liteParse)
        default:
            // LOG.warn("Advertisement opCode 4: Got an unknown typeCode \(data[1])")
            parseOpcode4_type0(serviceData: serviceData, data: data, liteParse: liteParse)
        }
    }
}
