export const NATIVE_BUS_TOPICS : NativeBusTopics = {
  setupAdvertisement:   "verifiedSetupAdvertisementData",   // data type = crownstoneAdvertisement
  dfuAdvertisement:     "verifiedDFUAdvertisementData",     // data type = crownstoneBaseAdvertisement
  advertisement:        "verifiedAdvertisementData",        // data type = crownstoneAdvertisement // Any verfied advertisement, only normal operation mode.
  crownstoneAdvertisementReceived: "crownstoneAdvertisementReceived",   // data type = crownstoneAdvertisementSummary. // Any advertisement, verified and unverified from crownstones.
  unverifiedAdvertisementData:     "unverifiedAdvertisementData",       // data type = crownstoneAdvertisement // Any unverified advertisement from crownstones.
  setupProgress:        "setupProgress",                    // data type = number ([1 .. 13], 0 for error) // Is 0 required? Or is rejecting the promise enough?
  dfuProgress:          "dfuProgress",                      // data type = {part: number, totalParts: number, progress: number, currentSpeedBytesPerSecond: number, avgSpeedBytesPerSecond: number}
  bleStatus:            "bleStatus",                        // data type = string ("unauthorized", "poweredOff", "poweredOn", "unknown")
  bleBroadcastStatus:   "bleBroadcastStatus",               // data type = string ( "notDetermined" | "restricted" | "denied" | "authorized")
  locationStatus:       "locationStatus",                   // data type = string ("unknown", "off", "foreground", "on", "noPermission")

  nearest:              "nearestCrownstone",                // data type = nearestStone // Any stone, validated or not, any operation mode.
  nearestSetup:         "nearestSetupCrownstone",           // data type = nearestStone

  tick:                 "tick",                             // data type = none. Should be sent about every second.
  iBeaconAdvertisement: "iBeaconAdvertisement",             // data type = ibeaconPackage[]
  enterSphere:          "enterSphere",                      // data type = string (sphereId)
  exitSphere:           "exitSphere",                       // data type = string (sphereId)
  currentRoom:          "currentLocation",                  // Sent every time the location is calculated. data type = {region: sphereId, location: locationId}
  currentLocationKNN:   "currentLocationKNN",               // Sent every time the location is calculated. data type = {region: sphereId, location: locationId}

  libAlert:             "libAlert",                         // data type = {header: string, body: string, buttonText: string }
  libPopup:             "libPopup",                         // data type = {header: string, body: string, buttonText: string, type: <not used yet> }

  classifierProbabilities: "classifierProbabilities",       // data type = {locationId1: {sampleSize: number, probability: number }, locationId2: {sampleSize: number, probability: number }, ...}
  classifierResult:        "classifierResult",              // data type = {highestPredictionLabel: string, highestPrediction: number } // highestPredictionLabel == locationId with highest probability and highestPrediction is that probability

  callbackUrlInvoked:      "callbackUrlInvoked",            // data type = string (url)
  localizationPausedState: "localizationPausedState",       // data type = string (url)

  connectedToPeripheral:       "connectedToPeripheral",       // date type = string (handle). Sent immediately after connect, before service discovery.
  disconnectedFromPeripheral:  "disconnectedFromPeripheral",  // date type = string (handle). Sent after disconnect cleanup. Can be called multiple times.
}

export const TOPICS = {
  datapointCollected: 'datapointCollected',
}
