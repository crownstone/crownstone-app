//
//  BluenetCBDelegate
//  BluenetLib
//
//  Created by Alex de Mulder on 16/10/2017.
//  Copyright © 2017 Alex de Mulder. All rights reserved.
//

import Foundation

import Foundation
import CoreBluetooth
import SwiftyJSON
import PromiseKit


public class BluenetCBDelegate: NSObject, CBCentralManagerDelegate {
    var BleManager : BleManager!
    
    public init(bleManager: BleManager) {
        super.init()
        self.BleManager = bleManager
    }
    
    
    // MARK: CENTRAL MANAGER DELEGATE
    
    public func centralManagerDidUpdateState(_ central: CBCentralManager) {
        BleManager.cBmanagerUpdatedState = true
        
        if #available(iOS 10.0, *) {
            switch central.state{
            case CBManagerState.unauthorized:
                BleManager.BleState = .unauthorized
                BleManager.eventBus.emit("bleStatus", "unauthorized");
                LOG.info("BLUENET_LIB: This app is not authorised to use Bluetooth low energy")
            case CBManagerState.poweredOff:
                BleManager.BleState = .poweredOff
                BleManager.eventBus.emit("bleStatus", "poweredOff");
                LOG.info("BLUENET_LIB: Bluetooth is currently powered off.")
            case CBManagerState.poweredOn:
                BleManager.BleState = .poweredOn
                BleManager.eventBus.emit("bleStatus", "poweredOn");
                LOG.info("BLUENET_LIB: Bluetooth is currently powered on and available to use.")
            case CBManagerState.resetting:
                BleManager.BleState = .resetting
                BleManager.eventBus.emit("bleStatus", "resetting");
                LOG.info("BLUENET_LIB: Bluetooth is currently resetting.")
            case CBManagerState.unknown:
                BleManager.BleState = .unknown
                BleManager.eventBus.emit("bleStatus", "unknown");
                LOG.info("BLUENET_LIB: Bluetooth state is unknown.")
            case CBManagerState.unsupported:
                BleManager.BleState = .unsupported
                BleManager.eventBus.emit("bleStatus", "unsupported");
                LOG.info("BLUENET_LIB: Bluetooth is unsupported?")
            default:
                BleManager.eventBus.emit("bleStatus", "unknown")
                LOG.info("BLUENET_LIB: Bluetooth is other: \(central.state) ")
                break
            }
        } else {
            // Fallback on earlier versions
            switch central.state.rawValue {
            case 3: // CBCentralManagerState.unauthorized :
                BleManager.BleState = .unauthorized
                BleManager.eventBus.emit("bleStatus", "unauthorized");
                LOG.info("BLUENET_LIB: This app is not authorised to use Bluetooth low energy")
            case 4: // CBCentralManagerState.poweredOff:
                BleManager.BleState = .poweredOff
                BleManager.eventBus.emit("bleStatus", "poweredOff");
                LOG.info("BLUENET_LIB: Bluetooth is currently powered off.")
            case 5: //CBCentralManagerState.poweredOn:
                BleManager.BleState = .poweredOn
                BleManager.eventBus.emit("bleStatus", "poweredOn");
                LOG.info("BLUENET_LIB: Bluetooth is currently powered on and available to use.")
            default:
                BleManager.eventBus.emit("bleStatus", "unknown");
                break
            }
        }
    }
    
    
    public func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
        // in some processes, the encryption can be disabled temporarily. Advertisements CAN come in in this period and be misfigured by the lack of decryption.
        // to avoid this, we do not listen to advertisements while the encryption is TEMPORARILY disabled.
        if (BleManager.settings.isTemporarilyDisabled()) {
            return
        }
        
        // battery saving means we do not decrypt everything nor do we emit the data into the app. All incoming advertisements are ignored
        if (BleManager.batterySaving == true) {
            return
        }

        let emitData = Advertisement(
            handle: peripheral.identifier.uuidString,
            name: peripheral.name,
            rssi: RSSI,
            serviceData: advertisementData["kCBAdvDataServiceData"] as? [CBUUID: Data],
            serviceUUID: advertisementData["kCBAdvDataServiceUUIDs"] as? [CBUUID]
        )
    
        BleManager.eventBus.emit("rawAdvertisementData",emitData)
    }
    
    public func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        LOG.info("BLUENET_LIB: in didConnectPeripheral")
        if (BleManager.pendingPromise.type == .CONNECT) {
            LOG.info("BLUENET_LIB: connected")
            BleManager.connectedPeripheral = peripheral
            BleManager.connectingPeripheral = nil
            BleManager.pendingPromise.fulfill(())
        }
    }
    
    public func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        LOG.info("BLUENET_LIB: in didFailToConnectPeripheral")
        if let errorVal = error {
            BleManager.pendingPromise.reject(errorVal)
        }
        else {
            BleManager.pendingPromise.reject(BluenetError.CONNECTION_FAILED)
        }
    }
    
    public func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        // since we disconnected, we must set the connected peripherals to nil.
        BleManager.connectingPeripheral = nil;
        BleManager.connectedPeripheral = nil;
        BleManager.settings.invalidateSessionNonce()
        BleManager.notificationEventBus.reset()
        
        LOG.info("BLUENET_LIB: in didDisconnectPeripheral.")
        if (BleManager.pendingPromise.type == .CANCEL_PENDING_CONNECTION) {
            LOG.info("BLUENET_LIB: Connection cancelled.")
            BleManager.pendingPromise.fulfill(())
        }
        else if (BleManager.pendingPromise.type == .AWAIT_DISCONNECT) {
            LOG.info("BLUENET_LIB: Peripheral disconnected from us succesfully.")
            BleManager.pendingPromise.fulfill(())
        }
        else if (BleManager.pendingPromise.type == .ERROR_DISCONNECT) {
            if (error != nil) {
                LOG.info("BLUENET_LIB: Operation Error_Disconnect: Peripheral disconnected from us.")
            }
            else {
                LOG.info("BLUENET_LIB: Operation Error_Disconnect: We disconnected from Peripheral.")
            }
            BleManager.pendingPromise.fulfill(())
        }
        else {
            if (error != nil) {
                LOG.info("BLUENET_LIB: Disconnected with error \(error!)")
                BleManager.pendingPromise.reject(error!)
            }
            else {
                LOG.info("BLUENET_LIB: Disconnected succesfully")
                // if the pending promise is NOT for disconnect, a disconnection event is a rejection.
                if (BleManager.pendingPromise.type != .DISCONNECT) {
                    BleManager.pendingPromise.reject(BluenetError.DISCONNECTED)
                }
                else {
                    BleManager.pendingPromise.fulfill(())
                }
            }
        }
    }

}

