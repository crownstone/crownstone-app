//
//  DfuHandler.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 10/08/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation
import PromiseKit
import CoreBluetooth
import iOSDFULibrary


public class DfuHandler: DFUServiceDelegate, DFUProgressDelegate, LoggerDelegate {
    let bleManager : BleManager!
    var settings : BluenetSettings!
    let eventBus : EventBus!
    var wasScanning = false
    
    fileprivate var dfuController : DFUServiceController?
    var pendingDFUPromiseFulfill : (()) -> Void = {_ in }
    var pendingDFUPromiseReject : (BluenetError) -> Void  = {_ in }
    var promisePending = false
    
    let secureDFU = false
    
    init (bleManager: BleManager, eventBus: EventBus, settings: BluenetSettings) {
        self.bleManager = bleManager
        self.settings   = settings
        self.eventBus   = eventBus
    }
    
    
    /**
     *
     * This method requires the Crownstone to be in DFU mode and not in an active ble connection.
     * We provide our CBCentralManager, but it's delegate is pointed their BaseDFUPeripheral.
     * After the DFU finishes (fail or success) we have to reassign the delegate to our bleManager using the self.bleManager.reassignDelegate method.
     *
     **/
    public func startDFU(handle: String, firmwareURL: URL) -> Promise<Void> {
        if (self.promisePending == true) {
            self.rejectPromise(BluenetError.DFU_OVERRULED)
            _ = dfuController?.abort()
            dfuController = nil
        }
        
        return Promise<Void> { seal in
            self.promisePending = true
            let dfuPeripheral = self.bleManager.getPeripheral(handle)

            self.pendingDFUPromiseReject = seal.reject
            self.pendingDFUPromiseFulfill = seal.fulfill
            
            guard dfuPeripheral != nil else {
                self.rejectPromise(BluenetError.COULD_NOT_FIND_PERIPHERAL)
                return
            }
            
            self.bleManager.decoupleFromDelegate()
            let dfuInitiator = DFUServiceInitiator(centralManager: self.bleManager.centralManager!, target: dfuPeripheral!)
            dfuInitiator.delegate = self
            dfuInitiator.progressDelegate = self
            dfuInitiator.logger = self
            dfuInitiator.packetReceiptNotificationParameter = 22
            
            // This enables the experimental Buttonless DFU feature from SDK 12.
            // Please, read the field documentation before use.
            dfuInitiator.enableUnsafeExperimentalButtonlessServiceInSecureDfu = false
            
            let selectedFirmware = DFUFirmware(urlToZipFile: firmwareURL)
            dfuController = dfuInitiator.with(firmware: selectedFirmware!).start()
        }
    }
    
    
    //MARK: - DFUServiceDelegate
    
    public func dfuStateDidChange(to state: DFUState) {
        if (self.promisePending) {
            switch state {
            case .disconnecting:
                self.eventBus.emit("dfuStateDidChange", "disconnecting")
                LOG.verbose("DFU: disconnecting")
            case .completed:
                self.eventBus.emit("dfuStateDidChange", "completed")
                self.fulfillPromise()
                LOG.verbose("DFU: completed")
            case .aborted:
                self.eventBus.emit("dfuStateDidChange", "aborted")
                self.rejectPromise(BluenetError.DFU_ABORTED)
                LOG.verbose("DFU: aborted")
            default:
                LOG.verbose("DFU: default")
            }
            
            LOG.verbose("DFU: Changed state to: \(state.description())")

        }
    }
    
    public func dfuError(_ error: DFUError, didOccurWithMessage message: String) {
        LOG.error("Error \(error.rawValue): \(message)")
        self.eventBus.emit("dfuError", "\(error.rawValue): \(message)")
        self.rejectPromise(BluenetError.DFU_ERROR)
    }
    
    public func bootloaderToNormalMode(uuid: String) -> Promise<Void> {
        var cleanup : voidPromiseCallback?
        self.bleManager.settings.disableEncryptionTemporarily()
        var success = false
        return Promise<Void> { seal in
            self.bleManager.isReady() // first check if the bluenet lib is ready before using it for BLE things.
                .then {(_) -> Promise<Void> in return self.bleManager.connect(uuid)}
                .then {(_) -> Promise<Void> in
                    return Promise<Void> { innerSeal in
                        self.bleManager.getServicesFromDevice()
                            .done{ services -> Void in
                                var isInDfuMode = false
                                for service in services {
                                    if service.uuid == DFUServiceUUID {
                                        isInDfuMode = true
                                        break
                                    }
                                }
                                
                                if (isInDfuMode == false) {
                                    innerSeal.reject(BluenetError.NOT_IN_DFU_MODE)
                                }
                                else {
                                    innerSeal.fulfill(())
                                }
                            }
                            .catch{ err in innerSeal.reject(err) }
                    }
                }
                .then {(_) -> Promise<voidPromiseCallback> in return self.setupNotifications() /*the bootloader requires the user to subscribe to notifications in order to function*/}
                .then {cleanupCallback -> Promise<Void> in
                    cleanup = cleanupCallback
                    success = true
                    return self._writeResetCommand()
                }
                .recover{(err: Error) -> Promise<Void> in
                    return Promise <Void> { innerSeal in
                        // we only want to pass this to the main promise of connect if we successfully received the nonce, but cant decrypt it.
                        if let bleErr = err as? BluenetError {
                            if bleErr != BluenetError.NOT_IN_DFU_MODE {
                                innerSeal.reject(err)
                                return
                            }
                        }
                        innerSeal.fulfill(())
                    }
                }
                .then {(_) -> Promise<Void> in
                    self.bleManager.settings.restoreEncryption()
                    if (cleanup != nil) {
                        return cleanup!()
                    }
                    else {
                        return Promise.value(())
                    }
                }
                .then {(_) -> Promise<Void> in
                    cleanup = nil
                    return self.bleManager.disconnect()
                }
                .done {(_) -> Void in seal.fulfill(())}
                .catch {(err) -> Void in
                    self.bleManager.settings.restoreEncryption()
                    if (cleanup != nil) {
                        _ = cleanup!()
                    }
                    self.bleManager.disconnect()
                        .done{_ -> Void in
                            if (success) { seal.fulfill(()) }
                            else { seal.reject(err) }
                        }
                        .catch{_ in
                            if (success) { seal.fulfill(()) }
                            else { seal.reject(err) }
                        }
            }
        }
    }
    
    func _writeResetCommand() -> Promise<Void> {
        let packet : [UInt8] = [0x06]
        LOG.info("BLUENET_LIB: Writing DFU reset command. \(packet)")
        return self.bleManager.writeToCharacteristic(
            DFUServices.DFU.uuidString,
            characteristicId: DFUCharacteristics.ControlPoint,
            data: Data(bytes: UnsafePointer<UInt8>(packet), count: packet.count),
            type: CBCharacteristicWriteType.withResponse
        )
    }
    
    func setupNotifications() -> Promise<voidPromiseCallback> {
        let notificationCallback = {(data: Any) -> Void in }
        return self.bleManager.enableNotifications(
            DFUServices.DFU.uuidString,
            characteristicId: DFUCharacteristics.ControlPoint,
            callback: notificationCallback
        )
    }
    
    
    //MARK: - DFUProgressDelegate
    
    public func dfuProgressDidChange(for part: Int, outOf totalParts: Int, to progress: Int, currentSpeedBytesPerSecond: Double, avgSpeedBytesPerSecond: Double) {
        var data = [String: NSNumber]()
        data["part"]        = NSNumber(value: part)
        data["totalParts"]  = NSNumber(value: totalParts)
        data["progress"]    = NSNumber(value: progress)
        data["currentSpeedBytesPerSecond"] = NSNumber(value: currentSpeedBytesPerSecond)
        data["avgSpeedBytesPerSecond"]     = NSNumber(value: avgSpeedBytesPerSecond)
        self.eventBus.emit("dfuProgress", data)
        
        LOG.info("\(part) out of \(totalParts) so progress \(progress) at a speed of \(currentSpeedBytesPerSecond/1024)")
    }
    
    //MARK: - LoggerDelegate
    
    public func logWith(_ level: LogLevel, message: String) {
        print("\(level.name()): \(message)")
    }

    
    func rejectPromise(_ err: BluenetError) {
        if (self.promisePending) {
            self.promisePending = false
            self.pendingDFUPromiseReject(err)
        }
        self.bleManager.reassignDelegate()
    }
    
    func fulfillPromise() {
        if (self.promisePending) {
            self.promisePending = false
            self.pendingDFUPromiseFulfill(())
        }
        self.bleManager.reassignDelegate()
    }
    
}
