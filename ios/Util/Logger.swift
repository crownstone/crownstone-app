//
//  Logger.swift
//  Crownstone
//
//  Created by Alex de Mulder on 21/11/2017.
//  Copyright © 2017 Crownstone. All rights reserved.
//

import Foundation
import BluenetShared

let LOGGER = BluenetShared.LogClass(daysToStoreLogs: 3, logBaseFilename: "BridgeLog")

@objc open class ObjectiveCLogger : NSObject {
  @objc public class func logInfo(log: String) {
    LOGGER.info(log)
  }
}
