//
//  Bridge.swift
//  Crownstone
//

import Foundation


@objc(TitleMaker)
class TitleMaker: NSObject {
  
  @objc func get(what: NSNumber, callback: RCTResponseSenderBlock) -> Void {
    let resultsDict = [
      "success" : true,
      "title"  : "hello world"
    ];
    callback([resultsDict])
  }
  
}
