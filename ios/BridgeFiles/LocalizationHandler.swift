//
//  LocalizationHandler.swift
//  Crownstone
//
//  Created by Alex de Mulder on 10/09/2021.
//  Copyright © 2021 Crownstone. All rights reserved.
//

import Foundation
import BluenetShared
import BluenetLib
import BluenetLocalization

class Localization {
    var indoorLocalizationEnabled = false
    
    var classifier : CrownstoneBasicClassifier!
    
    var eventBus : EventBus!
    var counter : Int = 0
    
    var locationState = [String:String?]()
    
    init() {
        eventBus = EventBus()
        classifier = CrownstoneBasicClassifier(useSmoothing: true)
    }
    
    
    /**
     * This will enable the classifier. It requires the TrainingData to be setup and will trigger the current/enter/exitRoom events
     * This should be used if the user is sure the TrainingData process has been finished.
     */
    public func startIndoorLocalization() {
        self.indoorLocalizationEnabled = true;
    }
    /**
     * This will disable the classifier. The current/enter/exitRoom events will no longer be fired.
     */
    public func stopIndoorLocalization() {
        self.indoorLocalizationEnabled = false;
    }
    
    
    func loadTrainingData(_ dataId: String, referenceId: String, trainingData: String) {
        classifier.loadTrainingData(dataId, referenceId: referenceId, trainingData: trainingData)
    }
    
    func handleMeasurement(_ data: [iBeaconPacket]) {
        if self.indoorLocalizationEnabled == false {
            return
        }
        
        // log ibeacon receiving for debugging purposes {
        self.counter += 1
        LOGGER.verbose("received iBeacon nr: \(self.counter)")
        var referenceIdSet = Set<String>()
        for packet in data {
            referenceIdSet.insert(packet.referenceId)
            LOGGER.verbose("received iBeacon DETAIL \(packet.idString) \(packet.rssi) \(packet.referenceId)")
        }
        
        // I assume we will only get one set of referenceIds in this method, but if there are more, we cleanly handle them
        for referenceId in referenceIdSet {
            // use the data for classification
            if (data.count > 0 && self.classifier != nil) {
                if let currentLocation = self.classifier!.classify(data, referenceId: referenceId) {
                    // change in location!
                    if (self.locationState[referenceId] != currentLocation) {
                        // we already were in a specific location
                        if (self.locationState[referenceId] != nil) {
                            // exit previous location
                            self.eventBus.emit("exitLocation", ["region": referenceId, "location": self.locationState[referenceId]!])
                        }

                        // store the new location as my current location in this region
                        self.locationState[referenceId] = currentLocation

                        // emit enter event
                        self.eventBus.emit("enterLocation", ["region": referenceId, "location": currentLocation])
                    }

                    // always emit the current location prediction
                    self.eventBus.emit("currentLocation", ["region": referenceId, "location": currentLocation])
                }
            }
            else {
                LOG.error("BluenetLocalization: Received ibeacon referenceId that does not exist in our locationState object. This should not be possible!")
            }
        }
        
    }
    
    
    func resetAllTrainingData() {
        classifier.resetAllTrainingData()
    }
}
