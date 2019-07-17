//
//  opCode5.swift
//  BluenetLib
//
//  Created by Alex de Mulder on 05/04/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation

func parseOpcode5(serviceData : ScanResponsePacket, data : [UInt8], liteParse: Bool = false) {
    if (data.count == 16) {
        serviceData.dataType = data[0]
        
        switch (serviceData.dataType) {
        case 0:
            parseOpcode3_type0(serviceData: serviceData, data: data, liteParse: liteParse)
        case 1:
            parseOpcode3_type1(serviceData: serviceData, data: data, liteParse: liteParse)
        case 2:
            parseOpcode3_type2(serviceData: serviceData, data: data, liteParse: liteParse)
            serviceData.rssiOfExternalCrownstone = Conversion.uint8_to_int8(data[15])
        case 3:
            parseOpcode3_type3(serviceData: serviceData, data: data, liteParse: liteParse)
            serviceData.rssiOfExternalCrownstone = Conversion.uint8_to_int8(data[15])
        default:
            // LOG.warn("Advertisement opCode 3: Got an unknown typeCode \(data[1])")
            parseOpcode3_type0(serviceData: serviceData, data: data, liteParse: liteParse)
        }
    }
}
