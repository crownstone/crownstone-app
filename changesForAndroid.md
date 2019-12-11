add bridge methods;
  syncBehaviours(behaviours: behaviourTransfer[]): Promise<behaviourTransfer[]>,
  getBehaviourMasterHash(behaviours: behaviourTransfer[]): Promise<number>,
  
  // this one is a promise  
  setTimeViaBroadcast(_ time: NSNumber, sunriseSecondsSinceMidnight: NSNumber, sundownSecondsSinceMidnight: NSNumber, referenceId: String, callback: @escaping RCTResponseSenderBlock) -> Void {
  
  // this one is not
  setSunTimes(_ sunriseSecondsSinceMidnight: NSNumber, sundownSecondsSinceMidnight: NSNumber)
   
rename brige method cuz blegh
    saveBehaviour --> addBehaviour
    
add module react-native-maps
https://github.com/react-native-community/react-native-maps