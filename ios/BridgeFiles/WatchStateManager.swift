//
//  WatchStateManager.swift
//  Crownstone
//
//  Created by Alex de Mulder on 24/01/2019.
//  Copyright © 2019 Crownstone. All rights reserved.
//

import Foundation
import WatchConnectivity


class WatchStateManager {

  var state = [String: Any]()
  
  func loadState(_ key: String,_ value : Any) {
    state[key] = value
    self.syncState()
  }
  
  func syncState() {
    if (GLOBAL_BLUENET.watchBridge.watchSupported) {
        do {
  //      print("Sending state to the Watch")
        try WCSession.default.updateApplicationContext(self.state)
      }
      catch {
  //      print("Error while sending to the watch:",error)
      }
    }
  }
  
  func removeKey(_ key: String) {
    state.removeValue(forKey: key)
    self.syncState()
  }
}
