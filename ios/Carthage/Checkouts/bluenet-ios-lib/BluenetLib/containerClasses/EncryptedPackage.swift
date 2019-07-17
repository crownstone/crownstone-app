//
//  EncryptedPackage.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 21/07/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation

/**
 * This class unwraps an encrypted NSData package according to Protocol V5
 *
 */
class EncryptedPackage {
    var nonce : [UInt8]!
    var userLevel : UserLevel
    var payload : [UInt8]?
    
    init(data: Data) throws {
        let prefixLength = PACKET_NONCE_LENGTH + PACKET_USERLEVEL_LENGTH
        if (data.count < prefixLength) {
            throw BluenetError.INVALID_PACKAGE_FOR_ENCRYPTION_TOO_SHORT
        }
        
        nonce = [UInt8](repeating: 0, count: PACKET_NONCE_LENGTH);
        var dataArray = Array(UnsafeBufferPointer(start: (data as NSData).bytes.bindMemory(to: UInt8.self, capacity: data.count), count: data.count))
        var payloadData = [UInt8](repeating: 0, count: dataArray.count - prefixLength)
        
        // 20 is the minimal size of a packet (3+1+16)
        if (dataArray.count < 20) {
            throw BluenetError.INVALID_PACKAGE_FOR_ENCRYPTION_TOO_SHORT
        }
        
        // copy the nonce over to the class var
        for i in [Int](0...nonce.count-1) {
            nonce[i] = dataArray[i]
        }
        
        
        // only allow 0, 1, 2 for Admin, User, Basic and 100 for Setup
        if (dataArray[PACKET_NONCE_LENGTH] > 2 && dataArray[PACKET_NONCE_LENGTH] != UInt8(UserLevel.setup.rawValue)) {
            throw BluenetError.INVALID_KEY_FOR_ENCRYPTION
        }
        
        // get the key from the data
        let packageLevel = UserLevel(rawValue: Int(dataArray[PACKET_NONCE_LENGTH]))
        
        if (packageLevel != nil) {
            userLevel = packageLevel!
        }
        else {
            throw BluenetError.USERLEVEL_IN_READ_PACKET_INVALID
        }
        
        // copy the nonce over to the class var
        for i in (0...payloadData.count - 1) {
            payloadData[i] = dataArray[i + prefixLength]
        }
        
        if (payloadData.count % 16 != 0) {
            throw BluenetError.INVALID_SIZE_FOR_ENCRYPTED_PAYLOAD
        }
        
        payload = payloadData;
    }
    
    func getPayload() throws -> [UInt8] {
        if (payload != nil) {
            return payload!
        }
        throw BluenetError.CAN_NOT_GET_PAYLOAD
    }
}
