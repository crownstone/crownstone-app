//
//  BluenetNavigation.swift
//  BluenetLibIOS
//
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation
import UIKit
import SwiftyJSON


/**

 */
public class TrainingHelper {
    // Modules
    var bluenetLocalization : BluenetLocalization!
    
    
    var collectingTrainingData : TrainingData?
    var collectingCallback : voidCallback?
    
    // MARK API
  
    /**
     * On init the handlers and interpreters are bound to the events broadcasted by this lib.
     */
    public init(bluenetLocalization: BluenetLocalization) {
        self.bluenetLocalization = bluenetLocalization
    }
    
    
    /**
     * Start collecting a TrainingData set.
     */
    public func startCollectingTrainingData() {
        self.collectingTrainingData = TrainingData()
        self._registerTrainingDataCollectionCallback();
    }
    
    
    /**
     * Pause collecting a TrainingData. Usually when something in the app would interrupt the user.
     */
    public func pauseCollectingTrainingData() {
        self._removeTrainingDataListener()
    }
    
    
    /**
     * Resume collecting a TrainingData.
     */
    public func resumeCollectingTrainingData() {
        self._registerTrainingDataCollectionCallback()
    }
    
    
    /**
     * Stop collecting a TrainingData without loading it into the classifier.
     */
    public func abortCollectingTrainingData() {
        self._cleanupCollectingTrainingData()
    }
   
    
    /**
     * Finalize collecting a TrainingData and store it in the appropriate classifier based on the referenceId and the locationId.
     */
    public func finishCollectingTrainingData() -> String? {
        var returnData : String? = nil
        if (self.collectingTrainingData != nil) {
            returnData = self.collectingTrainingData!.stringify()
        }
        self._cleanupCollectingTrainingData()
        return returnData
    }
    
    
    
    // MARK: UTIL
    
    func _registerTrainingDataCollectionCallback() {
        // in case this method is called wrongly, clean up the last listener
        self._removeTrainingDataListener()
        
        // start listening to the event stream
        self.collectingCallback = self.bluenetLocalization.on("iBeaconAdvertisement", {ibeaconData in
            if let data = ibeaconData as? [iBeaconPacket] {
                if let TrainingData = self.collectingTrainingData {
                    TrainingData.collect(data)
                }
                else {
                    self._cleanupCollectingTrainingData()
                }
            }
        });
    }
    
    func _removeTrainingDataListener() {
        if let unsubscribe = self.collectingCallback {
            unsubscribe()
        }
    }
    
    
    func _cleanupCollectingTrainingData() {
        self._removeTrainingDataListener()
        self.collectingCallback = nil
        self.collectingTrainingData = nil
    }
   
}

