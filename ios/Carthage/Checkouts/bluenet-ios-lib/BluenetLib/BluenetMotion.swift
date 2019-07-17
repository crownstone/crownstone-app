//
//  BluenetMotion.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 08/12/2016.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation
import CoreMotion


public class BluenetMotion  {

    var motionManager: CMMotionManager!
    
    public init() {
        motionManager = CMMotionManager()
        motionManager.deviceMotionUpdateInterval = 1.0
    }
    
    public func startMotion() {
        motionManager.startDeviceMotionUpdates(to: OperationQueue.main, withHandler: {motion, error in
            LOG.info("BLUENET_LIB: motion \(String(describing: motion))")
        })
    }
}


