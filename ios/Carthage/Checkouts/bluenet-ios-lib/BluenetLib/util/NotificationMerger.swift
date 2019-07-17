//
//  NotificationMerger.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 22/08/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation


class NotificationMerger {
    var data : [UInt8]
    var callback : (([UInt8]) -> Void)
    var lastPacketIndex : UInt8

    init(callback: @escaping (([UInt8]) -> Void)) {
        self.data = [UInt8]()
        self.callback = callback
        self.lastPacketIndex = 0xFF
    }
    
    func merge(_ data: [UInt8]) {
        if (data.count > 0) {
            if (data[0] == 0xFF) {
                self.data += data[1...data.count-1]
                self.callback(self.data)
                self.data = []
            }
            else {
                if (data[0] == 0 && self.lastPacketIndex == 0xFF || (data[0] > 0 && (data[0] - 1) == self.lastPacketIndex)) {
                    self.data += data[1...data.count-1]
                }
                else {
                    LOG.warn("----- BLUENET NotificationMerger: missed packet, invalid payload")
                }
            }
            self.lastPacketIndex = data[0]
        }
    }
    
}
