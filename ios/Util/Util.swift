//
//  Util.swift
//  Crownstone
//
//  Created by Alex de Mulder on 09/07/2018.
//  Copyright © 2018 Crownstone. All rights reserved.
//

import Foundation
import PromiseKit

public typealias voidPromiseCallback = () -> Promise<Void>
public typealias eventCallback = (Any) -> Void

/**
 * Generate a UUID.. obviously...
 **/
public func getUUID() -> String {
  return UUID().uuidString
}
