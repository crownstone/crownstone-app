//
//  bluenetIntegration.swift
//  Crownstone
//
//  Created by Alex de Mulder on 09/06/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

import Foundation
import BluenetLibIOS


@objc class ViewPassThrough : NSObject {
  init(viewController: UIViewController) {
    print("I GOT THE THING!")
    BluenetLibIOS.setViewController(viewController)
  }
}


@objc(Bluenet)
class Bluenet: NSObject {
  
  @objc func get(what: NSNumber, callback: RCTResponseSenderBlock) -> Void {
    let resultsDict = [
      "success" : true,
      "title"  : "hello world"
    ];
    callback([resultsDict])
  }
  
}
