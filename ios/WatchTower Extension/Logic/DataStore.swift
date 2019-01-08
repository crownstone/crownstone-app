//
//  DataStore.swift
//  WatchTower Extension
//
//  Created by Alex de Mulder on 04/01/2019.
//  Copyright © 2019 Crownstone. All rights reserved.
//

import Foundation



public class DataStore {
  public let store : UserDefaults!
  init() {
    store = UserDefaults.init(suiteName: "validationStore")
  }
  
  
  
}
