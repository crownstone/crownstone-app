//
//  util.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 24/05/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation
import CoreBluetooth

/**
 * Delay a callback
 * there is an inherent delay in this method of around 40 - 150 ms
 *
 * @param delay = delay in seconds
 */
public func delay(_ delay: Double, _ closure: @escaping ()->(Void)) {
    DispatchQueue.main.asyncAfter(
        deadline: DispatchTime.now() + Double(Int64(delay * Double(NSEC_PER_SEC))) / Double(NSEC_PER_SEC), execute: closure)
}



#if os(iOS)
/**
 * This will show an alert about location and forward the user to the settings page
 **/
public func showLocationAlert() {
    let alertController = UIAlertController(title: "Allow \(APPNAME) to use your location",
                                            message: "The location permission was not authorized. Please set it to \"Always\" in Settings to continue. You can choose to use the continuous background events in the app, but the permission is required in order to use the Crownstones.",
                                            preferredStyle: .alert)
    
    let settingsAction = UIAlertAction(title: "Settings", style: .default) { (alertAction) in
        // THIS IS WHERE THE MAGIC HAPPENS!!!! It triggers the settings page to change the permissions
        if let appSettings = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.openURL(appSettings)
        }
    }
    alertController.addAction(settingsAction)
    
    let cancelAction = UIAlertAction(title: "Cancel", style: .cancel, handler: nil)
    alertController.addAction(cancelAction)
    
    VIEWCONTROLLER!.present(alertController, animated: true, completion: nil)
}

#endif

/**
 *
 **/
public func getUUID() -> String {
    return UUID().uuidString
}


public func getServiceFromList(_ list: [CBService], _ uuid: String) -> CBService? {
    let matchString = uuid.uppercased()
    for service in list {
        if (service.uuid.uuidString == matchString) {
            return service
        }
    }
    return nil;
}


public func getCharacteristicFromList(_ list: [CBCharacteristic], _ uuid: String) -> CBCharacteristic? {
    let matchString = uuid.uppercased()
    for characteristic in list {
        if (characteristic.uuid.uuidString == matchString) {
            return characteristic
        }
    }
    return nil;
}
