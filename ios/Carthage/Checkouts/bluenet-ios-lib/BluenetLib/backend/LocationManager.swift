//
//  guideStoneManager.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 11/04/16./Users/alex/Library/Developer/Xcode/DerivedData/BluenetLibIOS-dcbozafhnxsptqgpaxsncklrmaoz/Build/Products/Debug-iphoneos/BluenetLibIOS.framework
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation
import CoreLocation
import SwiftyJSON
import UIKit

public class LocationManager : NSObject, CLLocationManagerDelegate {
    var manager : CLLocationManager?
    
    var eventBus : EventBus!
    var trackingBeacons = [iBeaconContainer]()
    var appName = "Crownstone"
    var started = false
    var startedStateBackground = true
    var monitoringState = false
    var rangingState = false
    
    var backgroundRangingEnabled = false
    var appIsInBackground = false
    
    // cache for the location
    var coordinates = CLLocationCoordinate2D()
    var coordinatesSet = false
    
    public init(eventBus: EventBus, backgroundRangingEnabled: Bool = false) {
        super.init()
        
        self.eventBus = eventBus
        self.backgroundRangingEnabled = backgroundRangingEnabled
        
        LOG.info("BLUENET_LIB_NAV: location services enabled: \(CLLocationManager.locationServicesEnabled())");
        LOG.info("BLUENET_LIB_NAV: ranging services enabled: \(CLLocationManager.isRangingAvailable())");
    }
    
    /**
     * Enable/disable background ranging
     */
    public func setBackgroundScanning(newBackgroundState: Bool) {
        if (self.backgroundRangingEnabled == newBackgroundState) {
            return
        }
        LOG.info("BLUENET_LIB_NAV: setBackgroundScanning to \(newBackgroundState)")
        self.backgroundRangingEnabled = newBackgroundState
        self.requestLocationPermission()
    }
    
    /**
     * Make sure you hook this up to your AppDelegate method for applicationWillEnterForeground. It will re-enable ranging if the backgroundRangingEnabled is not allowed.
     */
    public func applicationWillEnterForeground() {
        self.appIsInBackground = false
        if (self.backgroundRangingEnabled == false) {
            LOG.info("BLUENET_LIB_NAV: applicationDidEnterBackground. Will continue pauseRangingRegions.")
            self.refreshRegionState()
        }
    }
    
    /**
     * Make sure you hook this up to your AppDelegate method for applicationDidEnterBackground. It will disable ranging if the backgroundRangingEnabled is not allowed.
     */
    public func applicationDidEnterBackground() {
        appIsInBackground = true
        if (self.backgroundRangingEnabled == false) {
            LOG.info("BLUENET_LIB_NAV: applicationDidEnterBackground. Will now pauseRangingRegions.")
            self.pauseRangingRegions()
        }
    }
    
    /**
     * Request the GPS coordinates within 3KM radius (least accurate)
     */
    public func requestLocation() -> CLLocationCoordinate2D {
        // ask for permission if the manager does not exist and create the manager
        if (self.coordinatesSet) {
            return coordinates
        }
        else {
            LOG.error("BLUENET_LIB_NAV: Requesting location while it has not been obtained yet.")
            return coordinates
        }
    }
    
    /**
     * Request Permissions to use the background location. A manager will be instantiated if required and the didChangeAuthorization delegate method will be called.
     */
    public func requestLocationPermission() {
        if (self.manager == nil) {
            // initializing a new manager will already invoke the didChangeAuthorization delegate method.
            self._setLocationManager()
        }
        else {
            LOG.info("BLUENET_LIB_NAV: Requesting permission from requestLocationPermission")
            if (Thread.isMainThread == true) {
                self.locationManager(self.manager!, didChangeAuthorization: CLLocationManager.authorizationStatus())
            }
            else {
                DispatchQueue.main.sync{
                    self.locationManager(self.manager!, didChangeAuthorization: CLLocationManager.authorizationStatus())
                }
            }
        }
    }
    
    public func getTrackingState() -> [String:Bool] {
        return [
            "isMonitoring": self.monitoringState,
            "isRanging":    self.rangingState
        ];
    }
    
    /**
     * Start monitoring the region for this beacon. 
     * A manager will be initialized if required. Will only start monitoring if the manager is already started. 
     * If it is not, we will add this beacon to the list of regions to monitor. Once the manager is started, the list will be monitored.
     */
    public func trackBeacon(_ beacon: iBeaconContainer) {
        LOG.info("BLUENET_LIB_NAV: Requesting tracking for \(beacon.UUID)")
        // ask for permission if the manager does not exist and create the manager
        if (self.manager == nil) { self.requestLocationPermission() }
        
        if (!self._beaconInList(beacon, list: self.trackingBeacons)) {
            trackingBeacons.append(beacon);
            if (self.started == true && self.manager != nil) {
                LOG.info("BLUENET_LIB_NAV: Manager started. Start monitoring for \(beacon.UUID)")
                self.monitoringState = true
                self.manager!.startMonitoring(for: beacon.region)
                self.manager!.requestState(for: beacon.region)
            }
        }
    }

    
    /**
     * Request to invoke the didDetermineState delegate method and fire the events again.
     */
    public func refreshRegionState() {
        if (self.manager != nil) {
            for region in self.manager!.monitoredRegions {
                self.manager!.requestState(for: region)
            }
        }
        else {
            LOG.error("BLUENET_LIB_NAV: refreshRegionState: No manager available.")
        }
    }
    
    /**
     * Stop monitoring and ranging all regions that are currently being tracked by the manager. Not neccesarily the ones we know if in our class.
     */
    public func stopTrackingAllRegions() {
        if (self.manager != nil) {
            // stop monitoring all previous regions
            for region in self.manager!.monitoredRegions {
                LOG.info("BLUENET_LIB_NAV: INITIALIZATION: stop monitoring old region: \(region)")
                self.manager!.stopMonitoring(for: region)
                if let beaconRegion = region as? CLBeaconRegion {
                    self.manager!.stopRangingBeacons(in: beaconRegion)
                }
            }
            self.monitoringState = false
            self.rangingState = false
        }
        else {
            LOG.error("BLUENET_LIB_NAV: stopTrackingAllRegions: No manager available.")
        }
    }
    
    /**
     * Stop monitoring and ranging all regions we know of in our class (ie. the ones we added)
     */
    public func clearTrackedBeacons() {
        self.pauseTrackingRegions()
        self.trackingBeacons.removeAll()
    }
    
    /**
     * Stop monitoring and ranging a specific ibeacon region.
     */
    public func stopTrackingIBeacon(_ uuid: String) {
        if (self.manager != nil) {
            // stop monitoring this beacon
            var targetIndex : Int? = nil;
            let uuidObject = UUID(uuidString : uuid)
            if (uuidObject == nil) {
                return
            }
            
            let uuidString = uuidObject!.uuidString
            for (index, beacon) in self.trackingBeacons.enumerated() {
                if (beacon.UUID.uuidString == uuidString) {
                    self.manager!.stopRangingBeacons(in: beacon.region)
                    self.manager!.stopMonitoring(for: beacon.region)
                    targetIndex = index;
                    break
                }
            }

            if (targetIndex != nil) {
                self.trackingBeacons.remove(at: targetIndex!)
                if (self.trackingBeacons.count == 0) {
                    self.monitoringState = false
                    self.rangingState = false
                }
            }
        }
        else {
            LOG.error("BLUENET_LIB_NAV: stopTrackingIBeacon: No manager available.")
        }
    }
    
    
    /**
     * Will stop ranging beacons
     */
    public func pauseRangingRegions() {
        // only do something if beacons are being ranged
        if (self.manager != nil && self.rangingState == true) {
            // stop ranging all becons
            for beacon in self.trackingBeacons {
                self.manager!.stopRangingBeacons(in: beacon.region)
            }
            self.rangingState = false
        }
    }
    
    public func isMonitoringRegions() -> Bool {
        return self.monitoringState
    }
    
    
    /**
     * Start monitoring all regions we have in our trackingBeacons list.
     */
    public func startMonitoringRegions() {
        LOG.info("BLUENET_LIB_NAV: startMonitoringRegions")
        // we need a CL location manager for this.
        if (self.manager != nil) {
            // reinitialize
            for beacon in self.trackingBeacons {
                self.manager!.startMonitoring(for: beacon.region)
                self.manager!.requestState(for: beacon.region)
                
            }
            self.monitoringState = true
        }
        else {
            LOG.error("BLUENET_LIB_NAV: startMonitoringRegions: No manager available.")
        }
    }
    
    
    /**
     * Pause monitoring and ranging (= tracking) all regions. This is different from clear since we keep them in the trackingBeacons list. With this list, we can resume tracking later on.
     */
    public func pauseTrackingRegions() {
        // we need a CL location manager for this.
        if (self.manager != nil) {
            // stop monitoring all becons
            for beacon in self.trackingBeacons {
                self.manager!.stopRangingBeacons(in: beacon.region)
                self.manager!.stopMonitoring(for: beacon.region)
            }
            self.monitoringState = false
            self.rangingState = false
        }
        else {
            LOG.error("BLUENET_LIB_NAV: pauseTrackingRegions: No manager available.")
        }
    }
    
    /**
     * Basically turning it off and on again. Useful for reinitializing the list when a new CL location manager is initialized.
     */
    func resetBeaconRanging() {
        LOG.info("BLUENET_LIB_NAV: Resetting ibeacon tracking")
        self.pauseTrackingRegions()
        self.startMonitoringRegions()
    }
    
    
    /**
     * Start is called once the permissions are obtained (from didChangeAuthorization). 
     * It will invoke the appropriate start method depending on the backgroundEnabled setting (which is set on init or with setBackgroundScanning).
     */
    func start() {
        // if we do not wish to use background scanning, start the LocationManager without background options.
        if (self.backgroundRangingEnabled == false) {
            self.startWithoutBackground()
        }
        else {
            self.startWithBackground()
        }
    }
    
    
    /**
     * Start with Background will initialize a location manager if required and instruct it to deliver location updates in the background.
     */
    func startWithBackground() {
        LOG.info("BLUENET_LIB_NAV: Start called")
        // verify we have a manager. If not, it will be created.
        if (self.manager == nil) {
            // Setting the location manager will trigger a cycle of location permission -> start so we return this start method after setting the location manager.
            self._setLocationManager()
            return
        }
        
        self.manager!.desiredAccuracy = kCLLocationAccuracyThreeKilometers
        self.manager!.pausesLocationUpdatesAutomatically = true
        self.manager!.startUpdatingLocation()
        if (self.manager!.responds(to: #selector(getter: CLLocationManager.allowsBackgroundLocationUpdates))) {
            LOG.info("BLUENET_LIB_NAV: Manager allows background location updates. We enable it.")
            self.manager!.allowsBackgroundLocationUpdates = true
        }
        
        self.resetBeaconRanging();
        self.started = true
        self.startedStateBackground = false
    }
    
    /**
     * Start without Background will re-initialize a location manager if required and instruct it to deliver location updates in the foreground.
     */
    func startWithoutBackground() {
        LOG.info("BLUENET_LIB_NAV: startWithoutBackground called")
        
        // This will reset the location manager if required. Once a location manager has received background permission, we cannot unset it.
        if (self.startedStateBackground == false || self.manager == nil) {
            self.startedStateBackground = true
            LOG.info("BLUENET_LIB_NAV: Resetting the location manager")
            
            // Setting the location manager will trigger a cycle of location permission -> start so we return this start method after setting the location manager.
            self._setLocationManager()
            return
        }
        
        self.manager!.pausesLocationUpdatesAutomatically = true
        self.manager!.startUpdatingLocation()
        if (self.manager!.responds(to: #selector(getter: CLLocationManager.allowsBackgroundLocationUpdates))) {
            LOG.info("BLUENET_LIB_NAV: Manager allows background location updates. we disable it.")
            self.manager!.allowsBackgroundLocationUpdates = false
        }
        
        self.resetBeaconRanging();
        self.started = true
    }
    
    
    // MARK: delegate methods
    
    public func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        LOG.info("BLUENET_LIB_NAV: Changed Authorization \(status)")
        switch (CLLocationManager.authorizationStatus()) {
            case .notDetermined:
                LOG.info("BLUENET_LIB_NAV: didChangeAuthorization NotDetermined, requesting Always:")
                /*
                 First you need to add NSLocationWhenInUseUsageDescription or NSLocationAlwaysUsageDescription(if you want to use in background) in your info.plist file OF THE PROGRAM THAT IMPLEMENTS THIS!
                 */
                
                // when just requesting in use, iBeacon permission is DENIED! We need ALWAYS!
                manager.requestAlwaysAuthorization()

                self.eventBus.emit("locationStatus", "unknown");
            case .restricted:
                LOG.info("BLUENET_LIB_NAV: location Restricted")
                self.eventBus.emit("locationStatus", "off");
            case .denied:
                LOG.info("BLUENET_LIB_NAV: location Denied")
                self.eventBus.emit("locationStatus", "off");
                showLocationAlert()
            case .authorizedAlways:
                LOG.info("BLUENET_LIB_NAV: location AuthorizedAlways")
                self.eventBus.emit("locationStatus", "on");
                self.start()
            case .authorizedWhenInUse:
                LOG.info("BLUENET_LIB_NAV: location AuthorizedWhenInUse")
                manager.requestAlwaysAuthorization()
                self.eventBus.emit("locationStatus", "foreground");
                showLocationAlert()
        }
    }
    
    
    public func locationManager(_ manager : CLLocationManager, didStartMonitoringFor region : CLRegion) {
        LOG.info("BLUENET_LIB_NAV: did start MONITORING \(region) \n");
    }
        
    
    public func locationManager(_ manager : CLLocationManager, didRangeBeacons beacons : [CLBeacon], in region: CLBeaconRegion) {
        var iBeacons = [iBeaconPacket]()
        
        for beacon in beacons {
            if (beacon.rssi < -1) {
                iBeacons.append(iBeaconPacket(
                    uuid: beacon.proximityUUID.uuidString,
                    major: beacon.major,
                    minor: beacon.minor,
                    rssi: NSNumber(value: beacon.rssi),
                    referenceId: region.identifier
                ))
            }
        }
        
        if (iBeacons.count > 0) {
            self.eventBus.emit("iBeaconAdvertisement", iBeacons)
        }
    }
    
    public func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
        LOG.info("BLUENET_LIB_NAV: did enter region \(region) \n");
        self._startRanging(region);
    }
    
    
    public func locationManager(_ manager: CLLocationManager, didExitRegion region: CLRegion) {
        LOG.info("BLUENET_LIB_NAV: did exit region \(region) \n");
        self._stopRanging(region);
    }
    
    // this is a fallback mechanism because the enter and exit do not always fire.
    public func locationManager(_ manager: CLLocationManager, didDetermineState state: CLRegionState, for region: CLRegion) {
        LOG.info("BLUENET_LIB_NAV: State change \(state.rawValue) , \(region)")
        if (state.rawValue == 1) {       // 1 == inside
            LOG.info("BLUENET_LIB_NAV: State change to inside")
            self._startRanging(region)
        }
        else if (state.rawValue == 2) {  // 2 == outside
            LOG.info("BLUENET_LIB_NAV: State change to outside")
            self._stopRanging(region)
        }
        else {                           // 0 == unknown,
            LOG.info("BLUENET_LIB_NAV: State change to unknown")
           // self._stopRanging(region)
        }
    }
    
    
    
    /*
     *  locationManager:rangingBeaconsDidFailForRegion:withError:
     *
     *  Discussion:
     *    Invoked when an error has occurred ranging beacons in a region. Error types are defined in "CLError.h".
     */
    public func locationManager(_ manager: CLLocationManager, rangingBeaconsDidFailFor region: CLBeaconRegion, withError error: Error) {
         LOG.error("BLUENET_LIB_NAV: did rangingBeaconsDidFailForRegion \(region)  withError: \(error) \n");
    }
    
    

    /*
     *  locationManager:didFailWithError:
     *
     *  Discussion:
     *    Invoked when an error has occurred. Error types are defined in "CLError.h".
     */
  
    public func locationManager(_ manager: CLLocationManager, didFailWithError error: Error){
        LOG.error("BLUENET_LIB_NAV: did didFailWithError withError: \(error) \n");
    }
    
    /*
     *  locationManager:monitoringDidFailForRegion:withError:
     *
     *  Discussion:
     *    Invoked when a region monitoring error has occurred. Error types are defined in "CLError.h".
     */
    public func locationManager(_ manager: CLLocationManager, monitoringDidFailFor region: CLRegion?, withError error: Error){
        LOG.error("BLUENET_LIB_NAV: did monitoringDidFailForRegion \(String(describing: region))  withError: \(error)\n");
    }
    

    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        if let location = locations.first {
            LOG.verbose("BLUENET_LIB_NAV: update user's location: \(location.coordinate)")
            self.coordinates = location.coordinate
            self.coordinatesSet = true
        }
    }
    
    
    
    
    // MARK: util
    // --------------UITL -------------------------//
    
    /**
     * Set or re-set the location manager. This will initialize a CL location manager and assign the delegate to this class.
     * It will also stop tracking all previously active regions so there is a clean start.
     * In case there was a previous manager, it will stop updating the location before overwriting it.
     *
     * This has to be done on the main thread, hence the if else.
     *
     * Setting the location manager will trigger a permission request. This means the delegate method didChangeAuthorization will be invoked.
     */
    func _setLocationManager() {
        if (Thread.isMainThread == true) {
            LOG.info("BLUENET_LIB_NAV: _setLocationManager, Creating CLLocationManager");
            if (self.manager != nil) {
                self.manager!.stopUpdatingLocation()
            }
            self.manager = CLLocationManager()
            self.manager!.delegate = self
            self.stopTrackingAllRegions()
        }
        else {
            DispatchQueue.main.sync{
                LOG.info("BLUENET_LIB_NAV: _setLocationManager, Creating CLLocationManager");
                if (self.manager != nil) {
                    self.manager!.stopUpdatingLocation()
                }
                self.manager = CLLocationManager()
                self.manager!.delegate = self
                self.stopTrackingAllRegions()
            }
        }
    }

    
    
    func _beaconInList(_ beacon: iBeaconContainer, list: [iBeaconContainer]) -> Bool {
        for element in list {
            if (element.UUID == beacon.UUID) {
                return true;
            }
        }
        return false;
    }

    func _startRanging(_ region: CLRegion) {
        if (self.manager != nil) {
            // do not range in the background if this is explicitly not enabled
            if (self.backgroundRangingEnabled == false && self.appIsInBackground == true) {
                return
            }
            
            // do not start ranging this if we are already ranging it
            for element in self.manager!.rangedRegions {
                if (element.identifier == region.identifier) {
                    return
                }
            }
            
            self.eventBus.emit("lowLevelEnterRegion", region.identifier)
            for element in self.trackingBeacons {
                if (element.region.identifier == region.identifier) {
                    LOG.info("BLUENET_LIB_NAV: startRanging region \(region.identifier)")
                    self.manager!.startRangingBeacons(in: element.region)
                }
            }
            self.rangingState = true
        }
        else {
           LOG.error("BLUENET_LIB_NAV: _startRanging: No manager available.")
        }
    }
    
    func _stopRanging(_ region: CLRegion) {
        if (self.manager != nil) {
            var abort = true
            
            // only stop ranging if we are already ranging it.
            for element in self.manager!.rangedRegions {
                if (element.identifier == region.identifier) {
                    abort = false
                }
            }
            
            // abort. We're not ranging this region anymore
            if (abort) {
                return
            }
            
            self.eventBus.emit("lowLevelExitRegion", region.identifier)
            
            for element in self.trackingBeacons {
                if (element.region.identifier == region.identifier) {
                    LOG.info("BLUENET_LIB_NAV: stopRanging region \(region.identifier)!")
                    self.manager!.stopRangingBeacons(in: element.region)
                }
            }
            self.rangingState = false
        }
        else {
            LOG.error("BLUENET_LIB_NAV: _stopRanging: No manager available.")
        }
    }

}
