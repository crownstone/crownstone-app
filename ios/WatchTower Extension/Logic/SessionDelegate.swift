//
//  SessionDelegate.swift
//  WatchTower Extension
//
//  Created by Alex de Mulder on 28/11/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation
import WatchKit
import BluenetWatch
import WatchConnectivity


class SessionDelegate: NSObject, WCSessionDelegate {
    var applicationContext = [String:Any]()
        
    // Called when WCSession activation state is changed.
    //
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        applicationContext = session.receivedApplicationContext
        eventBus.emit(Event.newApplicationContext, session.receivedApplicationContext )
    }
    
    // Called when WCSession reachability is changed.
    //
    func sessionReachabilityDidChange(_ session: WCSession) {
        print("sessionReachabilityDidChange", session)
    }
    
    // Called when an app context is received.
    //
    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        print("didReceiveApplicationContext")
        self.applicationContext = applicationContext
        eventBus.emit(Event.newApplicationContext, applicationContext )
    }
    
    // Called when a message is received and the peer doesn't need a response.
    //
    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
       print("didReceiveMessage", message)
    }
    
    // Called when a message is received and the peer needs a response.
    //
    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        print("didReceiveMessage", message)
    }
    
    // Called when a piece of message data is received and the peer doesn't need a response.
    //
    func session(_ session: WCSession, didReceiveMessageData messageData: Data) {
        print("didReceiveMessageData", messageData)
    }
    
    // Called when a piece of message data is received and the peer needs a response.
    //
    func session(_ session: WCSession, didReceiveMessageData messageData: Data, replyHandler: @escaping (Data) -> Void) {
        print("didReceiveMessageData_wReplyHandler", messageData)
    }
  
    func getName(crownstoneId: String, referenceId: String?) -> String {
      if (referenceId != nil) {
        if (self.applicationContext["crownstoneNames"] != nil) {
          if let referenceDict = self.applicationContext["crownstoneNames"] as? [String: Any] {
            if let stoneMap = referenceDict[referenceId!] as? [String: String] {
              if let name = stoneMap[crownstoneId] {
                return name
              }
              return "Unknown StoneId"
            }
            return "Unknown ReferenceId"
          }
          return "Invalid name map"
        }
        return "No name map"
      }
      return "Not validated"
    }

}
