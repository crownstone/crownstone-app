//
//  bleMangager.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 11/04/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation
import CoreBluetooth
import SwiftyJSON
import PromiseKit



struct timeoutDurations {
    static let disconnect              : Double = 3
    static let errorDisconnect         : Double = 5
    static let cancelPendingConnection : Double = 3
    static let connect                 : Double = 10
    static let reconnect               : Double = 0.5
    static let getServices             : Double = 3
    static let getCharacteristics      : Double = 3
    static let readCharacteristic      : Double = 3
    static let writeCharacteristic     : Double = 4
    static let writeCharacteristicWithout : Double = 0.5
    static let enableNotifications     : Double = 2
    static let disableNotifications    : Double = 2
    static let waitForBond             : Double = 12
    static let waitForWrite            : Double = 0.6
    static let waitForReconnect        : Double = 2.0
    static let waitForRestart          : Double = 2
    static let waitForMeshPropagation  : Double = 0.5
}



public class BleManager: NSObject, CBPeripheralDelegate {
    public var centralManager : CBCentralManager!
    var connectedPeripheral: CBPeripheral?
    var connectingPeripheral: CBPeripheral?
    
    
    #if os(iOS)
    var BleState : CBCentralManagerState = .unknown
    #endif
    
    #if os(watchOS)
    var BleState : CBManagerState = .unknown
    #endif
    var pendingPromise = promiseContainer()
    var eventBus : EventBus!
    var notificationEventBus : EventBus!
    public var settings : BluenetSettings!
    
    var decoupledDelegate = false
    
    var uniquenessReference = [String: String]()
    var scanUniqueOnly = false
    var scanning = false
    var scanningStateStored = false
    var scanningForServices : [CBUUID]? = nil
    
    var batterySaving = false
    var backgroundEnabled = true
    
    var cBmanagerUpdatedState = false
    
    var CBDelegate : BluenetCBDelegate!
    var CBDelegateBackground : BluenetCBDelegateBackground!

    public init(eventBus: EventBus, settings: BluenetSettings, backgroundEnabled: Bool = true) {
        super.init();
        
        self.notificationEventBus = EventBus()
        self.settings = settings
        self.eventBus = eventBus
        
        self.backgroundEnabled = backgroundEnabled
        
        self.CBDelegate = BluenetCBDelegate(bleManager: self)
        self.CBDelegateBackground = BluenetCBDelegateBackground(bleManager: self)
        self.setCentralManager()
        
        
        // initialize the pending promise containers
        
        _ = self.eventBus.on("bleStatus", self._handleStateUpdate)
    }
    
    
    func _handleStateUpdate(_ state: Any) {
        LOG.info("BLUENET_LIB: Handling a state update \(state)")
        if let stateStr = state as? String {
            LOG.info("BLUENET_LIB: Handling a state update for state: \(stateStr)")
            switch (stateStr) {
            case "resetting", "poweredOff":
                LOG.info("BLUENET_LIB: Cleaning up after BLE reset.")
                self.connectedPeripheral = nil
                self.connectingPeripheral = nil
                self.pendingPromise.clearDueToReset()
            default:
                break
            }
        }
    }
    
    public func setBackgroundOperations(newBackgroundState: Bool) {
        if (self.backgroundEnabled == newBackgroundState) {
            return
        }
        centralManager.stopScan()
        self.backgroundEnabled = newBackgroundState
        self.BleState = .unknown
        self.cBmanagerUpdatedState = false
        self.setCentralManager()
        
        self.isReady().done{ _ in self.restoreScanning()}.catch{ err in print(err) }
        
        // fallback.
        delay(3, { 
            if (self.cBmanagerUpdatedState == false) {
                self.BleState = .poweredOn
            }
        })
    }
    
    func setCentralManager() {
        if (self.backgroundEnabled) {
            /**
             * The system uses this UID to identify a specific central manager.
             * As a result, the UID must remain the same for subsequent executions of the app
             * in order for the central manager to be successfully restored.
             **/
            self.centralManager = CBCentralManager(
                delegate: self.CBDelegateBackground,
                queue: nil,
                options: [CBCentralManagerOptionShowPowerAlertKey: true, CBCentralManagerOptionRestoreIdentifierKey: APPNAME + "BluenetIOS"]
            )
        }
        else {
            self.centralManager = CBCentralManager(
                delegate: self.CBDelegate,
                queue: nil,
                options: [CBCentralManagerOptionShowPowerAlertKey: true]
            )
        }
    }
    
    /**
     *
     * Battery saving means that initially, the lib will ignore any ble advertisements. No events originating from BLE advertisements 
     * will be propagated and nothing will be decrypted.
     *
     * Additionally, if background mode is disabled, it will also disable scanning alltogether. This will cause the app to fall asleep.
     * This can be disabled by passing the optional doNotChangeScanning parameter.
     *
    **/
    public func enableBatterySaving(doNotChangeScanning: Bool = false) {
        LOG.info("BLUENET_LIB: Enabled Battery Saving. doNotChangeScanning: \(doNotChangeScanning)")
        self.batterySaving = true
        
        if (doNotChangeScanning == false) {
            if (self.backgroundEnabled == false) {
                if (self.decoupledDelegate == true) {
                    LOG.info("BLUENET_LIB: ignored enableBatterySaving scan pausing because the delegate is decoupled (likely due to DFU in progress)")
                    return
                }
                self.pauseScanning()
            }
        }
    }
    
    /**
     * Similar to enable, this will revert the changes done by enable.
     **/
    public func disableBatterySaving(doNotChangeScanning : Bool = false) {
        LOG.info("BLUENET_LIB: Disabled Battery Saving. doNotChangeScanning: \(doNotChangeScanning)")
        self.batterySaving = false
        if (doNotChangeScanning == false) {
            if (self.backgroundEnabled == false) {
                if (self.decoupledDelegate == true) {
                    LOG.info("BLUENET_LIB: ignored disableBatterySaving scan restoration because the delegate is decoupled (likely due to DFU in progress)")
                    return
                }
                self.restoreScanning()
            }
        }
    }
    
    public func decoupleFromDelegate() {
        LOG.info("Decoupling from Delegate")
        self.decoupledDelegate = true
    }
    
    public func reassignDelegate() {
        LOG.info("Reassigning Delegate")
        self.decoupledDelegate = false
        if (self.backgroundEnabled) {
            self.centralManager.delegate = self.CBDelegateBackground
        }
        else {
            self.centralManager.delegate = self.CBDelegate
        }
        self.restoreScanning()
    }
   
    public func emitBleState() {
        if (self.backgroundEnabled) {
            self.CBDelegateBackground.centralManagerDidUpdateState(self.centralManager)
        }
        else {
            self.CBDelegate.centralManagerDidUpdateState(self.centralManager)
        }
    }
    
    // MARK: API
    
    /**
     * This method will fulfill when the bleManager is ready. It polls itself every 0.25 seconds. Never rejects.
     */
    public func isReady() -> Promise<Void> {
        return Promise<Void> { seal in
            if (self.BleState != .poweredOn) {
                delay(0.50, { _ = self.isReady().done{_ -> Void in seal.fulfill(())} })
            }
            else {
                seal.fulfill(())
            }
        }
    }
    
    public func wait(seconds: Double) -> Promise<Void> {
        return Promise<Void> { seal in
            delay(seconds, seal.fulfill)
        }
    }
    
    public func waitToReconnect() -> Promise<Void> {
        return Promise<Void> { seal in
            delay(timeoutDurations.waitForReconnect, seal.fulfill)
        }
    }
    
    public func waitForRestart() -> Promise<Void> {
        return Promise<Void> { seal in
            delay(timeoutDurations.waitForRestart, seal.fulfill)
        }
    }
    
    // this delay is set up for calls that need to write to storage.
    public func waitToWrite(_ iteration: UInt8 = 0) -> Promise<Void> {
        if (iteration > 0) {
            LOG.info("BLUENET_LIB: Could not verify immediatly, waiting longer between steps...")
            return Promise<Void> { seal in
                delay(2 * timeoutDurations.waitForWrite, seal.fulfill)
            }
        }
        
        return Promise<Void> { seal in
            delay(timeoutDurations.waitForWrite, seal.fulfill)
        }
    }

    
    public func getPeripheral(_ uuid: String) -> CBPeripheral? {
        let nsUuid = UUID(uuidString: uuid)
        if (nsUuid == nil) {
            return nil
        }

        // get a peripheral from the known list (TODO: check what happens if it requests an unknown one)
        let peripherals = centralManager.retrievePeripherals(withIdentifiers: [nsUuid!]);
        if (peripherals.count == 0) {
            return nil
        }
        
        return peripherals[0]
    }
    
    /**
     * Connect to a ble device. The uuid is the Apple UUID which differs between phones for a single device
     *
     */
    public func connect(_ uuid: String) -> Promise<Void> {
        LOG.info("BLUENET_LIB: starting to connect")
        return Promise<Void> { seal in
            if (self.BleState != .poweredOn) {
                seal.reject(BluenetError.NOT_INITIALIZED)
            }
            else {
                // start the connection
                if (self.connectedPeripheral != nil) {
                    if (self.connectedPeripheral!.identifier.uuidString == uuid) {
                        LOG.info("BLUENET_LIB: Already connected to this peripheral")
                        seal.fulfill(());
                    }
                    else {
                        LOG.info("BLUENET_LIB: Something is connected")
                        self.disconnect()
                            .then{ _ in self._connect(uuid)}
                            .done{ _ in seal.fulfill(())}
                            .catch{ err in seal.reject(err)}
                    }
                }
                // cancel any connection attempt in progress.
                else if (self.connectingPeripheral != nil) {
                    LOG.info("BLUENET_LIB: connection attempt in progress")
                    self.abortConnecting()
                        .then{ _ in return self._connect(uuid)}
                        .done{ _ in seal.fulfill(())}
                        .catch{ err in seal.reject(err)}
                }
                else {
                    LOG.info("BLUENET_LIB: connecting...")
                    self._connect(uuid)
                        .done{ _ in seal.fulfill(())}
                        .catch{ err in seal.reject(err)}
                }
            }
        };
    }
    
    
    
    /**
     *  Cancel a pending connection
     *
     */
    func abortConnecting()  -> Promise<Void> {
        return Promise<Void> { seal in
            LOG.info("BLUENET_LIB: starting to abort pending connection request")
            if let connectingPeripheralVal = self.connectingPeripheral {
                LOG.info("BLUENET_LIB: pending connection detected")
                // if there was a connection in progress, cancel it with an error
                if (self.pendingPromise.type == .CONNECT) {
                    LOG.info("BLUENET_LIB: rejecting the connection promise")
                    self.pendingPromise.reject(BluenetError.CONNECTION_CANCELLED)
                }
                
                LOG.info("BLUENET_LIB: Waiting to cancel connection....")
                self.pendingPromise.load(seal.fulfill, seal.reject, type: .CANCEL_PENDING_CONNECTION)
                self.pendingPromise.setDelayedReject(timeoutDurations.cancelPendingConnection, errorOnReject: .CANCEL_PENDING_CONNECTION_TIMEOUT)
                
                self.centralManager.cancelPeripheralConnection(connectingPeripheralVal)
                
                // we set it to nil here regardless if the connection abortion fails or not.
                self.connectingPeripheral = nil
            }
            else {
                seal.fulfill(())
            }
        }
    }
    
    /**
     *  This does the actual connection. It stores the pending promise and waits for the delegate to return.
     */
    func _connect(_ uuid: String) -> Promise<Void> {
        let nsUuid = UUID(uuidString: uuid)
        return Promise<Void> { seal in
            if (nsUuid == nil) {
                seal.reject(BluenetError.INVALID_UUID)
            }
            else {
                // get a peripheral from the known list (TODO: check what happens if it requests an unknown one)
                let uuidArray = [nsUuid!]
                let peripherals = self.centralManager.retrievePeripherals(withIdentifiers: uuidArray);
                if (peripherals.count == 0) {
                    seal.reject(BluenetError.CAN_NOT_CONNECT_TO_UUID)
                }
                else {
                    let peripheral = peripherals[0]
                    self.connectingPeripheral = peripheral
                    self.connectingPeripheral!.delegate = self
                    
                    // setup the pending promise for connection
                    self.pendingPromise.load(seal.fulfill, seal.reject, type: .CONNECT)
                    self.pendingPromise.setDelayedReject(timeoutDurations.connect, errorOnReject: .CONNECT_TIMEOUT)
                    self.centralManager.connect(connectingPeripheral!, options: nil)
                }
            }
        }
        .recover{(error: Error) -> Void in
            // we want to hook into the failed connect to set the connecting peripheral to nil. The promise should still fail
            // for other users of the returned promise.
            self.connectingPeripheral = nil
            throw error
        }
    }
    
    
    public func waitForPeripheralToDisconnect(timeout : Double) -> Promise<Void> {
        return Promise<Void> { seal in
            // only disconnect if we are actually connected!
            if (self.connectedPeripheral != nil) {
                LOG.info("BLUENET_LIB: waiting for the connected peripheral to disconnect from us")
                let disconnectPromise = Promise<Void> { innerSeal in
                    // in case the connected peripheral has been disconnected beween the start and invocation of this method.
                    if (self.connectedPeripheral != nil) {
                        self.pendingPromise.load(innerSeal.fulfill, innerSeal.reject, type: .AWAIT_DISCONNECT)
                        self.pendingPromise.setDelayedReject(timeout, errorOnReject: .AWAIT_DISCONNECT_TIMEOUT)
                    }
                    else {
                        innerSeal.fulfill(())
                    }
                }
                // we clean up (self.connectedPeripheral = nil) inside the disconnect() method, thereby needing this inner promise
                disconnectPromise.done { _ -> Void in
                    // make sure the connected peripheral is set to nil so we know nothing is connected
                    self.connectedPeripheral = nil
                    seal.fulfill(())
                }
                .catch { err in seal.reject(err) }
            }
            else {
                seal.fulfill(())
            }
        }
    }
    
    /**
     *  Disconnect from the connected BLE device
     */
    public func errorDisconnect() -> Promise<Void> {
        return Promise<Void> { seal in
            // cancel any pending connections
            if (self.connectingPeripheral != nil) {
                LOG.info("BLUENET_LIB: disconnecting from connecting peripheral due to error")
                abortConnecting()
                    .then{ _ in return self._disconnect(errorMode: true) }
                    .done{_ -> Void in seal.fulfill(())}
                    .catch{err in seal.reject(err)}
            }
            else {
                self._disconnect(errorMode: true)
                    .done{_ -> Void in seal.fulfill(())}
                    .catch{err in seal.reject(err)}
            }
        }
    }
    
    /**
     *  Disconnect from the connected BLE device
     */
    public func disconnect() -> Promise<Void> {
        return Promise<Void> { seal in
            // cancel any pending connections
            if (self.connectingPeripheral != nil) {
                LOG.info("BLUENET_LIB: disconnecting from connecting peripheral")
                abortConnecting()
                    .then{ _ in return self._disconnect() }
                    .done{_ -> Void in seal.fulfill(())}
                    .catch{err in seal.reject(err)}
            }
            else {
                self._disconnect()
                    .done{_ -> Void in seal.fulfill(())}
                    .catch{err in seal.reject(err)}
            }
        }
    }
    
    
    func _disconnect(errorMode: Bool = false) -> Promise<Void> {
        return Promise<Void> { seal in
            // only disconnect if we are actually connected!
            if (self.connectedPeripheral != nil) {
                LOG.info("BLUENET_LIB: disconnecting from connected peripheral")
                let disconnectPromise = Promise<Void> { innerSeal in
                    // in case the connected peripheral has been disconnected beween the start and invocation of this method.
                    if (self.connectedPeripheral != nil) {
                        if (errorMode == true) {
                            self.pendingPromise.load(innerSeal.fulfill, innerSeal.reject, type: .ERROR_DISCONNECT)
                            self.pendingPromise.setDelayedReject(timeoutDurations.errorDisconnect, errorOnReject: .ERROR_DISCONNECT_TIMEOUT)
                        }
                        else {
                            self.pendingPromise.load(innerSeal.fulfill, innerSeal.reject, type: .DISCONNECT)
                            self.pendingPromise.setDelayedReject(timeoutDurations.disconnect, errorOnReject: .DISCONNECT_TIMEOUT)
                        }
                        self.centralManager.cancelPeripheralConnection(self.connectedPeripheral!)
                    }
                    else {
                        innerSeal.fulfill(())
                    }
                }
                disconnectPromise.done { _ -> Void in
                    // make sure the connected peripheral is set to nil so we know nothing is connected
                    self.connectedPeripheral = nil
                    seal.fulfill(())
                }
                .catch { err in seal.reject(err) }
            }
            else {
                seal.fulfill(())
            }
        }
    }

    
    /**
     *  Get the services from a connected device
     *
     */
    public func getServicesFromDevice() -> Promise<[CBService]> {
        return Promise<[CBService]> { seal in
            if (connectedPeripheral != nil) {
                if let services = connectedPeripheral!.services {
                    seal.fulfill(services)
                }
                else {
                    self.pendingPromise.load(seal.fulfill, seal.reject, type: .GET_SERVICES)
                    self.pendingPromise.setDelayedReject(timeoutDurations.getServices, errorOnReject: .GET_SERVICES_TIMEOUT)
                    // the fulfil and reject are handled in the peripheral delegate
                    connectedPeripheral!.discoverServices(nil) // then return services
                }
            }
            else {
                seal.reject(BluenetError.NOT_CONNECTED)
            }
        }
    }

    
    public func getCharacteristicsFromDevice(_ serviceId: String) -> Promise<[CBCharacteristic]> {
        return Promise<[CBCharacteristic]> { seal in
            // if we are not connected, exit
            if (self.connectedPeripheral != nil) {
                // get all services from connected device (is cached if we already know it)
                self.getServicesFromDevice()
                    // then get all characteristics from connected device (is cached if we already know it)
                    .then {(services: [CBService]) -> Promise<[CBCharacteristic]> in // get characteristics
                        if let service = getServiceFromList(services, serviceId) {
                            return self.getCharacteristicsFromDevice(service)
                        }
                        else {
                            throw BluenetError.SERVICE_DOES_NOT_EXIST
                        }
                    }
                    // then get the characteristic we need if it is in the list.
                    .done {(characteristics: [CBCharacteristic]) -> Void in
                        seal.fulfill(characteristics);
                    }
                    .catch {(error: Error) -> Void in
                        seal.reject(error)
                    }
            }
            else {
                seal.reject(BluenetError.NOT_CONNECTED)
            }
        }
    }
    
    func getCharacteristicsFromDevice(_ service: CBService) -> Promise<[CBCharacteristic]> {
        return Promise<[CBCharacteristic]> { seal in
            if (connectedPeripheral != nil) {
                if let characteristics = service.characteristics {
                    seal.fulfill(characteristics)
                }
                else {
                    self.pendingPromise.load(seal.fulfill, seal.reject, type: .GET_CHARACTERISTICS)
                    self.pendingPromise.setDelayedReject(timeoutDurations.getCharacteristics, errorOnReject: .GET_CHARACTERISTICS_TIMEOUT)

                    // the fulfil and reject are handled in the peripheral delegate
                    connectedPeripheral!.discoverCharacteristics(nil, for: service)// then return services
                }
            }
            else {
                seal.reject(BluenetError.NOT_CONNECTED)
            }
        }
    }
    
    
    
    func getChacteristic(_ serviceId: String, _ characteristicId: String) -> Promise<CBCharacteristic> {
        return Promise<CBCharacteristic> { seal in
            // if we are not connected, exit
            if (self.connectedPeripheral != nil) {
                // get all services from connected device (is cached if we already know it)
                self.getServicesFromDevice()
                    // then get all characteristics from connected device (is cached if we already know it)
                    .then{(services: [CBService]) -> Promise<[CBCharacteristic]> in
                        if let service = getServiceFromList(services, serviceId) {
                            return self.getCharacteristicsFromDevice(service)
                        }
                        else {
                            throw BluenetError.SERVICE_DOES_NOT_EXIST
                        }
                    }
                    // then get the characteristic we need if it is in the list.
                    .done{(characteristics: [CBCharacteristic]) -> Void in
                        if let characteristic = getCharacteristicFromList(characteristics, characteristicId) {
                            seal.fulfill(characteristic)
                        }
                        else {
                            throw BluenetError.CHARACTERISTIC_DOES_NOT_EXIST
                        }
                    }
                    .catch{err in seal.reject(err)}
            }
            else {
                seal.reject(BluenetError.NOT_CONNECTED)
            }
        }
    }
    
    public func readCharacteristicWithoutEncryption(_ service: String, characteristic: String) -> Promise<[UInt8]> {
        return Promise<[UInt8]> { seal in
            self.settings.disableEncryptionTemporarily()
            self.readCharacteristic(service, characteristicId: characteristic)
                .done{data -> Void in
                    self.settings.restoreEncryption()
                    seal.fulfill(data)
                }
                .catch{(error: Error) -> Void in
                    self.settings.restoreEncryption()
                    seal.reject(error)
                }
        }
    }
    
    public func readCharacteristic(_ serviceId: String, characteristicId: String) -> Promise<[UInt8]> {
        return Promise<[UInt8]> { seal in
            self.getChacteristic(serviceId, characteristicId)
                .done{characteristic -> Void in
                    if (self.connectedPeripheral != nil) {
                        self.pendingPromise.load(seal.fulfill, seal.reject, type: .READ_CHARACTERISTIC)
                        self.pendingPromise.setDelayedReject(timeoutDurations.readCharacteristic, errorOnReject: .READ_CHARACTERISTIC_TIMEOUT)
                        
                        // the fulfil and reject are handled in the peripheral delegate
                        self.connectedPeripheral!.readValue(for: characteristic)
                    }
                    else {
                        seal.reject(BluenetError.NOT_CONNECTED)
                    }
                }
                .catch{err in seal.reject(err)}
        }
    }
    
    public func writeToCharacteristic(_ serviceId: String, characteristicId: String, data: Data, type: CBCharacteristicWriteType) -> Promise<Void> {
        return Promise<Void> { seal in
            self.getChacteristic(serviceId, characteristicId)
                .done{characteristic -> Void in
                    if (self.connectedPeripheral != nil) {
                        self.pendingPromise.load(seal.fulfill, seal.reject, type: .WRITE_CHARACTERISTIC)
                        
                        if (type == .withResponse) {
                            self.pendingPromise.setDelayedReject(timeoutDurations.writeCharacteristic, errorOnReject: .WRITE_CHARACTERISTIC_TIMEOUT)
                        }
                        else {
                            // if we write without notification, the delegate will not be invoked.
                            self.pendingPromise.setDelayedFulfill(timeoutDurations.writeCharacteristicWithout)
                        }
                        
                        // the fulfil and reject are handled in the peripheral delegate
                        if (self.settings.isEncryptionEnabled()) {
                             LOG.debug("BLUENET_LIB: writing \(data.bytes) which will be encrypted.")
                            do {
                                let encryptedData = try EncryptionHandler.encrypt(data, settings: self.settings)
                                self.connectedPeripheral!.writeValue(encryptedData, for: characteristic, type: type)
                            }
                            catch let err {
                                self.pendingPromise.reject(err)
                            }
                        }
                        else {
                            LOG.debug("BLUENET_LIB: writing \(data.bytes)")
                            self.connectedPeripheral!.writeValue(data, for: characteristic, type: type)
                        }
                    }
                    else {
                        seal.reject(BluenetError.NOT_CONNECTED)
                    }
                }
                .catch{(error: Error) -> Void in
                    LOG.error("BLUENET_LIB: FAILED writing to characteristic \(error)")
                    seal.reject(error)
                }
        }
    }
    
    public func enableNotifications(_ serviceId: String, characteristicId: String, callback: @escaping eventCallback) -> Promise<voidPromiseCallback> {
        var unsubscribeCallback : voidCallback? = nil
        return Promise<voidPromiseCallback> { seal in
            // if there is already a listener on this topic, we assume notifications are already enabled. We just add another listener
            if (self.notificationEventBus.hasListeners(serviceId + "_" + characteristicId)) {
                unsubscribeCallback = self.notificationEventBus.on(serviceId + "_" + characteristicId, callback)
                
                // create the cleanup callback and return it.
                let cleanupCallback : voidPromiseCallback = { 
                    return self.disableNotifications(serviceId, characteristicId: characteristicId, unsubscribeCallback: unsubscribeCallback!)
                }
                seal.fulfill(cleanupCallback)
            }
            else {
                // we first get the characteristic from the device
                self.getChacteristic(serviceId, characteristicId)
                    // then we subscribe to the feed before we know it works to miss no data.
                    .then{(characteristic: CBCharacteristic) -> Promise<Void> in
                        unsubscribeCallback = self.notificationEventBus.on(characteristic.service.uuid.uuidString + "_" + characteristic.uuid.uuidString, callback)
                        
                        // we now tell the device to notify us.
                        return Promise<Void> { innerSeal in
                            if (self.connectedPeripheral != nil) {
                                // the success and failure are handled in the peripheral delegate
                                self.pendingPromise.load(innerSeal.fulfill, innerSeal.reject, type: .ENABLE_NOTIFICATIONS)
                                self.pendingPromise.setDelayedReject(timeoutDurations.enableNotifications, errorOnReject: .ENABLE_NOTIFICATIONS_TIMEOUT)
                                self.connectedPeripheral!.setNotifyValue(true, for: characteristic)
                            }
                            else {
                                innerSeal.reject(BluenetError.NOT_CONNECTED)
                            }
                        }
                    }
                    .done{_ -> Void in
                        let cleanupCallback : voidPromiseCallback = { self.disableNotifications(serviceId, characteristicId: characteristicId, unsubscribeCallback: unsubscribeCallback!) }
                        seal.fulfill(cleanupCallback)
                    }
                    .catch{(error: Error) -> Void in
                        // if something went wrong, we make sure the callback will not be fired.
                        if (unsubscribeCallback != nil) {
                            unsubscribeCallback!()
                        }
                        seal.reject(error)
                    }
            }
        }
    }
    
    func disableNotifications(_ serviceId: String, characteristicId: String, unsubscribeCallback: voidCallback) -> Promise<Void> {
        return Promise<Void> { seal in
            // remove the callback
            unsubscribeCallback()
            
            // if there are still other callbacks listening, we're done!
            if (self.notificationEventBus.hasListeners(serviceId + "_" + characteristicId)) {
                seal.fulfill(())
            }
            // if we are no longer connected we dont need to clean up.
            else if (self.connectedPeripheral == nil) {
                seal.fulfill(())
            }
            else {
                // if there are no more people listening, we tell the device to stop the notifications.
                self.getChacteristic(serviceId, characteristicId)
                    .done{characteristic -> Void in
                        if (self.connectedPeripheral == nil) {
                            seal.fulfill(())
                        }
                        else {
                            self.pendingPromise.load(seal.fulfill, seal.reject, type: .DISABLE_NOTIFICATIONS)
                            self.pendingPromise.setDelayedReject(timeoutDurations.disableNotifications, errorOnReject: .DISABLE_NOTIFICATIONS_TIMEOUT)
                            
                            // the fulfil and reject are handled in the peripheral delegate
                            self.connectedPeripheral!.setNotifyValue(false, for: characteristic)
                        }
                    }
                    .catch{(error: Error) -> Void in
                        seal.reject(error)
                    }
            }
        }
    }
    
    
    /**
     * This will just subscribe for a single notification and clean up after itself. 
     * The merged, finalized reply to the write command will be in the fulfill of this promise.
     */
    public func setupSingleNotification(_ serviceId: String, characteristicId: String, writeCommand: @escaping voidPromiseCallback) -> Promise<[UInt8]> {
        return Promise<[UInt8]> { seal in
            var unsubscribe : voidPromiseCallback? = nil
            var collectedData = [UInt8]();
            
            // use the notification merger to handle the full packet once we have received it.
            let merger = NotificationMerger(callback: { data -> Void in
                if (self.settings.isEncryptionEnabled()) {
                    do {
                        // attempt to decrypt it
                        let decryptedData = try EncryptionHandler.decrypt(Data(data), settings: self.settings)
                        collectedData = decryptedData.bytes;
                    }
                    catch _ {
                        LOG.error("Error decrypting single notification!")
                    }
                }
                else {
                    collectedData = data
                }
                unsubscribe!()
                    .done{ _  in seal.fulfill(collectedData) }
                    .catch{ err in seal.reject(err) }
            })
            
            
            let notificationCallback = {(data: Any) -> Void in
                if let castData = data as? Data {
                    merger.merge(castData.bytes)
                }
            }
            
            self.enableNotifications(serviceId, characteristicId: characteristicId, callback: notificationCallback)
                .then{ unsub -> Promise<Void> in
                    unsubscribe = unsub
                    return writeCommand()
                }
                .catch{ err in seal.reject(err) }
        }
    }
    
    /**
     * This will just subscribe for a single notification and clean up after itself.
     * The merged, finalized reply to the write command will be in the fulfill of this promise.
     */
    public func setupNotificationStream(_ serviceId: String, characteristicId: String, writeCommand: @escaping voidPromiseCallback, resultHandler: @escaping processCallback, timeout: Double = 5, successIfWriteSuccessful: Bool = false) -> Promise<Void> {
        return Promise<Void> { seal in
            var unsubscribe : voidPromiseCallback? = nil
            var streamFinished = false
            var writeSuccessful = false
            
            // use the notification merger to handle the full packet once we have received it.
            let merger = NotificationMerger(callback: { data -> Void in
                var collectedData : [UInt8]? = nil
                if (streamFinished == true) { return }
                
                if (self.settings.isEncryptionEnabled()) {
                    do {
                        // attempt to decrypt it
                        let decryptedData = try EncryptionHandler.decrypt(Data(data), settings: self.settings)
                        collectedData = decryptedData.bytes;
                    }
                    catch _ {
                        LOG.error("Error decrypting notifcation in stream!")
                        seal.reject(BluenetError.COULD_NOT_DECRYPT)
                        return
                    }
                }
                else {
                    collectedData = data
                }
                
                if let data = collectedData {
                    let result = resultHandler(data)
                    if (result == .FINISHED) {
                        streamFinished = true
                        unsubscribe!()
                            .done{ _  in seal.fulfill(()) }
                            .catch{ err in seal.reject(err) }
                    }
                    else if (result == .CONTINUE) {
                        // do nothing.
                    }
                    else if (result == .ABORT_ERROR) {
                        streamFinished = true
                        unsubscribe!()
                            .done{ _  in seal.reject(BluenetError.PROCESS_ABORTED_WITH_ERROR) }
                            .catch{ err in seal.reject(err) }
                    }
                    else {
                        streamFinished = true
                        unsubscribe!()
                            .done{ _  in seal.reject(BluenetError.UNKNOWN_PROCESS_TYPE) }
                            .catch{ err in seal.reject(err) }
                    }
                }
            })
            
            
            let notificationCallback = {(data: Any) -> Void in
                if let castData = data as? Data {
                    merger.merge(castData.bytes)
                }
            }
            
            delay(timeout, { () in
                if (streamFinished == false) {
                    streamFinished = true
                    if (unsubscribe != nil) {
                        unsubscribe!()
                            .done{ _ -> Void in
                                if (successIfWriteSuccessful && writeSuccessful) {
                                    seal.fulfill(())
                                }
                                else {
                                    seal.reject(BluenetError.NOTIFICATION_STREAM_TIMEOUT)
                                }
                            }
                            .catch{ err in
                                if (successIfWriteSuccessful && writeSuccessful) {
                                    seal.fulfill(())
                                }
                                else {
                                    seal.reject(BluenetError.NOTIFICATION_STREAM_TIMEOUT)
                                }
                        }
                    }
                }
            })
            
            self.enableNotifications(serviceId, characteristicId: characteristicId, callback: notificationCallback)
                .then{ unsub -> Promise<Void> in
                    unsubscribe = unsub
                    return writeCommand()
                }
                .done{ _ -> Void in
                    writeSuccessful = true
                }
                .catch{ err in seal.reject(err) }
        }
    }
    
    // MARK: scanning
    
    public func startScanning() {
        self.disableBatterySaving(doNotChangeScanning: true)
        self.scanning = true
        self.scanUniqueOnly = false
        self.scanningForServices = nil
        self.scanningStateStored = true
        
        if (self.decoupledDelegate == true) {
            LOG.info("BLUENET_LIB: ignored startScanning because the delegate is decoupled (likely due to DFU in progress)")
            return
        }
        
        LOG.info("BLUENET_LIB: start scanning everything")
        centralManager.scanForPeripherals(withServices: nil, options:[CBCentralManagerScanOptionAllowDuplicatesKey: true])
    }
    
    public func startScanningForService(_ serviceUUID: String, uniqueOnly: Bool = false) {
         self.disableBatterySaving(doNotChangeScanning: true)
        self.scanning = true
        self.scanUniqueOnly = uniqueOnly
        let service = CBUUID(string: serviceUUID)
        self.scanningForServices = [service]
        self.scanningStateStored = true
        
        if (self.decoupledDelegate == true) {
            LOG.info("BLUENET_LIB: ignored startScanningForService because the delegate is decoupled (likely due to DFU in progress)")
            return
        }
        
        LOG.info("BLUENET_LIB: start scanning for services \(serviceUUID)")
        centralManager.scanForPeripherals(withServices: [service], options:[CBCentralManagerScanOptionAllowDuplicatesKey: !uniqueOnly])
    }
    
    public func startScanningForServices(_ serviceUUIDs: [String], uniqueOnly: Bool = false) {
        var services = [CBUUID]()
        for service in serviceUUIDs {
            services.append(CBUUID(string: service))
        }
        self.startScanningForServicesCBUUID(services, uniqueOnly: uniqueOnly)
    }
    
    public func startScanningForServicesCBUUID(_ services: [CBUUID], uniqueOnly: Bool = false) {
        self.disableBatterySaving(doNotChangeScanning: true)
        self.scanning = true
        self.scanUniqueOnly = uniqueOnly
        self.scanningStateStored = true
        
        self.scanningForServices = services
        
        if (self.decoupledDelegate == true) {
            LOG.info("BLUENET_LIB: ignored startScanningForServices because the delegate is decoupled (likely due to DFU in progress)")
            return
        }
        
        LOG.info("BLUENET_LIB: start scanning for multiple services \(services)")
        centralManager.scanForPeripherals(withServices: services, options:[CBCentralManagerScanOptionAllowDuplicatesKey: !uniqueOnly])
    }
    
    
    public func pauseScanning() {
        LOG.info("BLUENET_LIB: pausing scan")
        centralManager.stopScan()
    }
    

    public func stopScanning() {
        self.scanning = false
        self.scanUniqueOnly = false
        self.scanningForServices = nil
        self.scanningStateStored = true
        
        if (self.decoupledDelegate == true) {
            LOG.info("BLUENET_LIB: ignored stopScanning because the delegate is decoupled (likely due to DFU in progress)")
            return
        }
        
        LOG.info("BLUENET_LIB: stopping scan")
        centralManager.stopScan()
    }
    
    public func restoreScanning() {
        // only restore scanning if we have a valid restoration state.
        if (self.scanningStateStored == false) {
            LOG.info("BLUENET_LIB: Can't restore scanning: no state saved")
            return
        }
        LOG.info("BLUENET_LIB: Restoring scan...")
        
        if (self.scanning == false) {
            self.stopScanning()
        }
        else {
            self.disableBatterySaving(doNotChangeScanning: true)
            centralManager.stopScan()
            centralManager.scanForPeripherals(withServices: self.scanningForServices, options:[CBCentralManagerScanOptionAllowDuplicatesKey: !self.scanUniqueOnly])
        }
    }
    
    // MARK: peripheral delegate
    
    public func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        if (pendingPromise.type == .GET_SERVICES) {
            // we will allow silent errors here if we do not explicitly ask for services
            if (error != nil) {
                pendingPromise.reject(error!)
            }
            else {
                if let services = peripheral.services {
                    pendingPromise.fulfill(services)
                }
                else {
                    pendingPromise.reject(BluenetError.NO_SERVICES)
                }
            }
        }
    }
    
    public func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        if (pendingPromise.type == .GET_CHARACTERISTICS) {
            // we will allow silent errors here if we do not explicitly ask for characteristics
            if (error != nil) {
                pendingPromise.reject(error!)
            }
            else {
                if let characteristics = service.characteristics {
                    pendingPromise.fulfill(characteristics)
                }
                else {
                    pendingPromise.reject(BluenetError.NO_CHARACTERISTICS)
                }
            }
        }
    }
    
    /**
    * This is the reaction to read characteristic AND notifications!
    */
    public func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        // handle the case for failed bonding
        if (error != nil) {
            if (pendingPromise.type == .READ_CHARACTERISTIC) {
                pendingPromise.reject(error!)
            }
            return
        }
        
        
        // in case of notifications:
        let serviceId = characteristic.service.uuid.uuidString
        let characteristicId = characteristic.uuid.uuidString
        let topicString = serviceId + "_" + characteristicId
        if (self.notificationEventBus.hasListeners(topicString)) {
            if let data = characteristic.value {
                // notifications are a chopped up encrypted message. We leave decryption for the handling methods.
                self.notificationEventBus.emit(topicString, data)
            }
        }
        
        if (pendingPromise.type == .READ_CHARACTERISTIC) {
            if (error != nil) {
                pendingPromise.reject(error!)
            }
            else {
                if (characteristic.value != nil) {
                    let data = characteristic.value!
                    if (self.settings.isEncryptionEnabled()) {
                        do {
                            let decryptedData = try EncryptionHandler.decrypt(data, settings: self.settings)
                            pendingPromise.fulfill(decryptedData.bytes)
                        }
                        catch let err {
                            pendingPromise.reject(err)
                        }
                    }
                    else {
                        pendingPromise.fulfill(data.bytes)
                    }
                }
                else {
                    pendingPromise.fulfill([UInt8]())
                }
            }
        }
    }
    
    
    
    public func peripheral(_ peripheral: CBPeripheral, didWriteValueFor characteristic: CBCharacteristic, error: Error?) {
        LOG.info("BLUENET_LIB: written")
        if (pendingPromise.type == .WRITE_CHARACTERISTIC) {
            if (error != nil) {
                pendingPromise.reject(error!)
            }
            else {
                pendingPromise.fulfill(())
            }
        }
    }
    
    public func peripheral(_ peripheral: CBPeripheral, didUpdateNotificationStateFor characteristic: CBCharacteristic, error: Error?) {
        if (pendingPromise.type == .ENABLE_NOTIFICATIONS || pendingPromise.type == .DISABLE_NOTIFICATIONS) {
            if (error != nil) {
                pendingPromise.reject(error!)
            }
            else {
                pendingPromise.fulfill(())
            }
        }
    }
    
    public func peripheral(_ peripheral: CBPeripheral, didModifyServices invalidatedServices: [CBService]) {
        peripheral.discoverServices(nil)
    }
    
    
    
    
}

