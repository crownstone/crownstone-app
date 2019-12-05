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
  var shouldSync = true
  var shouldSyncCounter = 0
  var state = [String: Any]()
  
  func loadState(_ key: String,_ value : Any) {
    state[key] = value
    self.syncState()
  }
  
  func syncState() {
    print("Syncing this state: \(self.state)")
    if self.shouldSync == false {
      self.shouldSyncCounter += 1
      if self.shouldSyncCounter > 20 {
        self.shouldSyncCounter = 0
        self.shouldSync = true
      }
      else {
        return
      }
    }
    
    do {
      print("Sending state to the Watch")
      try WCSession.default.updateApplicationContext(self.state)
    }
    catch {
      self.shouldSync = false
      self.shouldSyncCounter = 0
      print("Error while sending to the watch:",error)
    }
  }
  
  func removeKey(_ key: String) {
    state.removeValue(forKey: key)
    self.syncState()
  }
}
