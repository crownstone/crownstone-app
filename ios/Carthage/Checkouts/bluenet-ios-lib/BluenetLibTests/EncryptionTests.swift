//
//  EncryptionTests.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 26/07/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import XCTest
import CryptoSwift
import PromiseKit
@testable import BluenetLib


class EncryptionTests: XCTestCase {
    var settings : BluenetSettings!
    
    override func setUp() {
        super.setUp()
        
        // Put setup code here. This method is called before the invocation of each test method in the class.
        settings = BluenetSettings()
        
        settings.loadKeySets(encryptionEnabled: true, keySets: [
            KeySet(adminKey: "adminKeyForCrown",
                   memberKey: "memberKeyForHome",
                   basicKey: "guestKeyForOther",
                   localizationKey: "localizationKeyX",
                   serviceDataKey: "myServiceDataKey",
                   referenceId: "test")
            ])
        
        settings.setLocationState(
            sphereUID: 234,
            locationId: 60,
            profileIndex: 6,
            referenceId: "test"
        )
        settings.setDevicePreferences(
            rssiOffset: -10,
            tapToToggle: true,
            useBackgroundBroadcasts:true,
            useBaseBroadcasts: true
        )
        
        
        BLUENET_ENCRYPTION_TESTING = true
        
    }
    
    
    
    
    func testBackground() {
        if let referenceId = self.settings.locationState.referenceId {
            if let key = self.settings.getLocalizationKey(referenceId: referenceId) {
                let uuids = BroadcastProtocol.getServicesForBackgroundBroadcast(locationState: self.settings.locationState, devicePreferences: self.settings.devicePreferences, key: key)
                
                print("UUIDs", uuids)
            }
        }
        
    }
    
    func testBart() {
        let exp = expectation(description: "Example")
        var elements : [BroadcastElement] = []

        let promise = Promise<Void> { seal in
        
            elements.append(
                BroadcastElement(
                    referenceId:"test",
                    type: .multiSwitch,
                    packet: BroadcastStone_SwitchPacket(crownstoneId: 7, state: 100).getPacket(),
                    seal: seal,
                    target: 7
                )
            )
            elements.append(
                BroadcastElement(
                    referenceId:"test",
                    type: .multiSwitch,
                    packet: BroadcastStone_SwitchPacket(crownstoneId: 6, state: 100).getPacket(),
                    seal: seal,
                    target: 6
                )
            )
            elements.append(
                BroadcastElement(
                    referenceId:"test",
                    type: .multiSwitch,
                    packet: BroadcastStone_SwitchPacket(crownstoneId: 5, state: 100).getPacket(),
                    seal: seal,
                    target: 5
                )
            )
            elements.append(
                BroadcastElement(
                    referenceId:"test",
                    type: .multiSwitch,
                    packet: BroadcastStone_SwitchPacket(crownstoneId: 4, state: 100).getPacket(),
                    seal: seal,
                    target: 4
                )
            )
            elements.append(
                BroadcastElement(
                    referenceId:"test",
                    type: .multiSwitch,
                    packet: BroadcastStone_SwitchPacket(crownstoneId: 3, state: 100).getPacket(),
                    seal: seal,
                    target: 3
                )
            )
            
            
            print("elements", elements)
            
            let broadcastType = elements[0].type
            let broadcastReferenceId = elements[0].referenceId
            
            // create a buffer that will be broadcast
            let bufferToBroadcast = BroadcastBuffer(referenceId: broadcastReferenceId, type: broadcastType)
            
            // singular elements will immediately mark the buffer as full.
            for element in elements {
                if (bufferToBroadcast.accepts(element)) {
                    bufferToBroadcast.loadElement(element)
                    // if the buffer is now full, stop the loop.
                    if (bufferToBroadcast.isFull()) {
                        break
                    }
                }
            }
            
            let referenceIdOfBuffer = bufferToBroadcast.referenceId
            var time = 0
            if (settings.setSessionId(referenceId: referenceIdOfBuffer) == false) {
                print("Error in _broadcastBuffer Invalid referenceId")
                return
            }
            
            if let localizationKey = self.settings.getLocalizationKey(referenceId: referenceIdOfBuffer) {
                let packet = bufferToBroadcast.getPacket(validationNonce: NSNumber(value:time).uint32Value)
                do {
                    print("generating short uuids")
                    let otherUUIDs = try BroadcastProtocol.getUInt16ServiceNumbers(
                        locationState: self.settings.locationState,
                        devicePreferences: self.settings.devicePreferences,
                        protocolVersion: 0,
                        accessLevel: self.settings.userLevel,
                        key: localizationKey
                    )
                    
                    var nonce = [UInt8]()
                    for uuidNum in otherUUIDs {
                        nonce += Conversion.uint16_to_uint8_array(uuidNum)
                    }
                    
                    do {
                        print("unencyptedUUID", packet, "nonce",nonce)
                        let encryptedUUID = try BroadcastProtocol.getEncryptedServiceUUID(referenceId: referenceIdOfBuffer, settings: self.settings, data: packet, nonce: nonce)
                        print("encryptedUUID", encryptedUUID)
                        var broadcastUUIDs = BroadcastProtocol.convertUInt16ListToUUID(otherUUIDs)
                        broadcastUUIDs.append(encryptedUUID)
                        print(broadcastUUIDs)
                    }
                    catch let err {
                        print("Could not get uint16 ids", err)
                    }
                }
                catch let err {
                    print("Could not get encrypted service uuid", err)
                }
            }
            
            seal.fulfill(())
            exp.fulfill()
        }
        
        waitForExpectations(timeout: 1, handler: nil)
        
    }
    
    
    
    
    
    func testRC5() {
        let key = Conversion.ascii_or_hex_string_to_16_byte_array("localizationKeyX")
        
        print("key", key)
        let expandedKey = RC5ExpandKey(key: key)
        print("expandedKey", expandedKey)
        
        let encrypted = RC5Encrypt(input: 123456789, S: expandedKey);
        print("encrypted", encrypted);
        
        
        
    }
    
    
//    func testBroadcastPayload() {
//        let exp = expectation(description: "Example")
//        let a = Promise<Void> { seal in
//            let switchState : UInt8 = 60
//            let stoneId : UInt8 = 3
//            let packet  = BroadcastStone_SwitchPacket(crownstoneId: stoneId, state: switchState).getPacket()
//            let element = BroadcastElement(referenceId: "test", type: .multiSwitch, packet: packet, seal: seal, target: stoneId)
//
//            // check in which referenceId the first block to be advertised lives and what it's type is.
//            let broadcastType = element.type
//            let broadcastReferenceId = element.referenceId
//
//            // create a buffer that will be broadcast
//            let bufferToBroadcast = BroadcastBuffer(referenceId: broadcastReferenceId, type: broadcastType)
//            bufferToBroadcast.loadElement(element)
//
//
//            let referenceIdOfBuffer = bufferToBroadcast.referenceId
//            var time : Double = 100000.0
//
//            if let basicKey = self.settings.getBasicKey(referenceId: "test") {
//                let payload = BroadcastProtocol.getRC5Payload(validationNonce: 0, locationState: self.settings.locationState, devicePreferences: self.settings.devicePreferences, key: basicKey)
//                print("RC5", payload)
//            }
//
//            if let basicKey = self.settings.getBasicKey(referenceId: referenceIdOfBuffer) {
//                let packet = bufferToBroadcast.getPacket(validationNonce: NSNumber(value:time).uint32Value)
//                do {
//                    let otherUUIDs = try BroadcastProtocol.getUInt16ServiceNumbers(
//                        locationState: self.settings.locationState,
//                        devicePreferences: self.settings.devicePreferences,
//                        protocolVersion: 1,
//                        accessLevel: self.settings.userLevel,
//                        key: basicKey
//                    )
//
//                    var nonce = [UInt8]()
//                    for uuidNum in otherUUIDs {
//                        nonce += Conversion.uint16_to_uint8_array(uuidNum)
//                    }
//
//                    do {
//                        print("128bit buffer unencrypted", packet)
//                        let encryptedUUID = try BroadcastProtocol.getEncryptedServiceUUID(referenceId: referenceIdOfBuffer, settings: self.settings, data: packet, nonce: nonce)
//
//                        var broadcastUUIDs = BroadcastProtocol.convertUInt16ListToUUID(otherUUIDs)
//                        broadcastUUIDs.append(encryptedUUID)
//                        print("BroadcastUUIDs", otherUUIDs)
//                        print("BroadcastUUIDs", encryptedUUID)
//                    }
//                    catch let err {
//                        print("Could not get uint16 ids", err)
//                    }
//                }
//                catch let err {
//                    print("Could not get encrypted service uuid", err)
//                }
//            }
//
//
//        }
//
//        waitForExpectations(timeout: 1, handler: nil)
//    }
//
//    override func tearDown() {
//        // Put teardown code here. This method is called after the invocation of each test method in the class.
//        super.tearDown()
//    }
//    
//       
//    func testKeys() {
//        let adminKey   = try! EncryptionHandler._getKey(UserLevel.admin, settings)
//        let memberKey  = try! EncryptionHandler._getKey(UserLevel.member, settings)
//        let guestKey   = try! EncryptionHandler._getKey(UserLevel.guest, settings)
//
//        XCTAssertEqual(adminKey,  settings.adminKey!)
//        XCTAssertEqual(memberKey, settings.memberKey!)
//        XCTAssertEqual(guestKey,  settings.guestKey!)
//
//    }
//    
//    func testSwitchPacketEncryption() {
//        settings.setSessionNonce([49,50,51,52,53])
//        let payload : [UInt8] = [0,0,1,0,100]
//        let payloadData = Data(payload)
//        let data = try! EncryptionHandler.encrypt(payloadData, settings: settings)
//        
//        print("ENC DATA \(data.bytes)")
//    }
//
//    
//    func testNotificationPacketEncryption() {
//        settings.loadKeys(encryptionEnabled: true, adminKey: "f40a7ab9eb1c9909a35e4b5bb1c07bcd", memberKey: "dcad9f07f4a13339db066b4acf437646", guestKey: "9332b7abf19b86f548156d88c687def6", referenceId: "test")
//        settings.setSessionNonce([245, 128, 31, 110, 0])
//        let payload : [UInt8] =  [184, 200, 141, 1, 103, 184, 15, 98, 70, 17, 30, 224, 126, 226, 113, 105, 144, 144, 35, 180]
//        let payloadData = Data(payload)
//        let data = try? EncryptionHandler.decrypt(payloadData, settings: settings)
//        
//        print("dec data \(data)")
//    }
//    
//    func testEncryption() {
//        // we are going to try if the CTR method from Cryptswift is doing what we think its doing when adding the counter to the IV
//        settings.setSessionNonce([81,82,83,84,85])
//        let payload : [UInt8] = [1,2,3,4,5,6,7,8,9,10,11,12,13]
//        let payloadData = Data(payload)
//        let data = try! EncryptionHandler.encrypt(payloadData, settings: settings)
//        
//        print("ENC DATA \(data)")
//        // key we use above
//        let key = settings.adminKey
//        
//        // first part
//        var iv : [UInt8]             = [128, 128, 128, 81, 82, 83, 84, 85, 0, 0, 0, 0, 0, 0,  0,  0]
//        let validation : [UInt8]     = [81, 82, 83, 84]
//        let payloadPart1  : [UInt8]  = [1,  2,  3,  4, 5, 6, 7, 8, 9, 10, 11, 12]
//        let encryptionLoadPart1      = validation + payloadPart1
//        var encryptedDataPart1       = try! AES(key: key!, blockMode: CryptoSwift.BlockMode.ECB, padding: .noPadding).encrypt(iv)
//
//        for i in [Int](0...15) { encryptedDataPart1[i] ^= encryptionLoadPart1[i] } // perform XOR
//        
//        // second part
//        iv[iv.count-1] += 1
//        let payloadPart2  : [UInt8]  = [13,  0,   0,   0,  0,  0,  0,  0,  0, 0, 0, 0, 0, 0, 0, 0]
//        var encryptedDataPart2       = try! AES(key: key!, blockMode: CryptoSwift.BlockMode.ECB, padding: .noPadding).encrypt(iv)
//
//        for i in [Int](0...15) { encryptedDataPart2[i] ^= payloadPart2[i] } // perform XOR
//        
//        // this prefix contains the "random" numbers and the user level access.
//        let prefix : [UInt8] = [128, 128, 128, 0]
//        let emulatedCTRResult = prefix + encryptedDataPart1 + encryptedDataPart2
//    
//        
//        let uint8Arr = data.bytes
//        XCTAssertEqual(uint8Arr, emulatedCTRResult, "ctr mode not the same as expected ecb emulation")
//        
//        let decryptedData = try! EncryptionHandler.decrypt(data, settings: settings)
//        let decryptedUint8Array = decryptedData.bytes
//        
//        XCTAssertEqual(decryptedUint8Array, payloadPart1+payloadPart2, "decryption failed")
//        // we slice both the decrypted data and the payload so both are of type ArraySlice in order to match the contents
//        XCTAssertEqual(decryptedUint8Array[0...12], payload[0...payload.count-1], "decryption failed")
//
//    }
//    
//    func testCTREncryptionOnChip() {
//        // we are going to try if the CTR method from Cryptswift is doing what we think its doing when adding the counter to the IV
//        let payload : [UInt8] = [2,2,2,2]
//        settings.setSessionNonce([64,64,64,64,64])
//        settings.adminKey = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
//        let payloadData = Data(payload)
//        _ = try! EncryptionHandler.encrypt(payloadData, settings: settings)
//        
//
//        print(Conversion.uint32_to_uint8_array(0xcafebabe))
//    }
//    
//    func testMultiblockCTREncryptionOnChip() {
//        // we are going to try if the CTR method from Cryptswift is doing what we think its doing when adding the counter to the IV
//        settings.setSessionNonce([64,64,64,64,64])
//        let payload : [UInt8] = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26]
//        settings.adminKey = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
//        let payloadData = Data(bytes: payload)
//        _ = try! EncryptionHandler.encrypt(payloadData, settings: settings)
//
//    }
//    
//    func testECBEncryptionOnChip() {
//        let payload  : [UInt8]  = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]
//        let key : [UInt8] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
//        let encryptedData = try! AES(key: key, blockMode: CryptoSwift.BlockMode.ECB, padding: .noPadding).encrypt(payload)
//        print(encryptedData)
//    }
//    
//    func testECBEncryptionAndDecryption() {
//        let payload  : [UInt8]  = [0, 0, 100, 0, 25]
//        let paddedData = zeroPadding.add(to: payload, blockSize: 16)
//        print("paddedData \(paddedData)")
//
//        let key : [UInt8] = Conversion.ascii_or_hex_string_to_16_byte_array("9e34c5a7da5c2b8d36e9fc5cf7497a6b")
//        print(key)
//        let encryptedData = try! AES(key: key, blockMode: CryptoSwift.BlockMode.ECB, padding: .noPadding).encrypt(paddedData)
//        print("encryptedData \(encryptedData)")
//        let decryptedData = try! AES(key: key, blockMode: CryptoSwift.BlockMode.ECB, padding: .noPadding).decrypt(encryptedData)
//        print("decryptedData \(decryptedData)")
//        
//        XCTAssertEqual(decryptedData[0...decryptedData.count-1], paddedData[0...paddedData.count-1], "decryption failed")
//    }
//    
//    func testEncryptionWithoutKey() {
//        let payload  : [UInt8]  = [0, 0, 100, 0, 25]
//        let paddedData = zeroPadding.add(to: payload, blockSize: 16)
//        print("paddedData \(paddedData)")
//        
//        let key : [UInt8] = [0];
//        do {
//            guard key.count   == 16 else { throw BluenetError.DO_NOT_HAVE_ENCRYPTION_KEY }
//            guard paddedData.count == 16 else { throw BluenetError.INVALID_PACKAGE_FOR_ENCRYPTION_TOO_SHORT }
//            let aes = try AES(key: key, blockMode: CryptoSwift.BlockMode.ECB, padding: .noPadding)
//            print("GOT THE AES", aes)
//            let data = try aes.decrypt(paddedData)
//            print("DONE", data)
//        }
//        catch {
//            print("Could not decrypt advertisement \(error)")
//        }
//        
//        
//    }
}
