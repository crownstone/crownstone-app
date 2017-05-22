import { Alert, NativeModules, NativeAppEventEmitter } from 'react-native';
import { LOG } from '../../logging/Log'

class NativeBusClass {
  topics: any;
  refMap: any;

  constructor() {
    this.topics = {
      setupAdvertisement:   "verifiedSetupAdvertisementData",   // data type = crownstoneAdvertisement
      dfuAdvertisement:     "verifiedDFUAdvertisementData",     // data type = crownstoneAdvertisement
      advertisement:        "verifiedAdvertisementData",        // data type = crownstoneAdvertisement // = from crownstone in normal operation mode.
      anyAdvertisement:     "anyVerifiedAdvertisementData",     // data type = crownstoneAdvertisement
      setupProgress:        "setupProgress",                    // data type = number ([1 .. 13], 0 for error)
      dfuProgress:          "dfuProgress",                      // data type = {percentage: number, part: number, totalParts: number, progress: number, currentSpeedBytesPerSecond: number, avgSpeedBytesPerSecond: number}
      bleStatus:            "bleStatus",                        // data type = string ("unauthorized", "poweredOff", "poweredOn", "unknown")
      locationStatus:       "locationStatus",                   // data type = string ("unknown", "off", "foreground", "on")

      nearest:              "nearestCrownstone",                // data type = type_nearest
      nearestSetup:         "nearestSetupCrownstone",           // data type = type_nearest

      iBeaconAdvertisement: "iBeaconAdvertisement",             // data type = type_beacon[]
      enterSphere:          "enterSphere",                      // data type = string (sphereId)
      exitSphere:           "exitSphere",                       // data type = string (sphereId)
      enterRoom:            "enterLocation",                    // data type = {region: sphereId, location: locationId}
      exitRoom:             "exitLocation",                     // data type = {region: sphereId, location: locationId}
      currentRoom:          "currentLocation",                  // data type = {region: sphereId, location: locationId}
    };

    this.refMap = {};
    Object.keys(this.topics).forEach((key) => {
      this.refMap[this.topics[key]] = true;
    });
  }

  on(topic, callback) {
    if (!(topic)) {
      LOG.error("Attempting to subscribe to undefined topic:", topic);
      return;
    }
    if (!(callback)) {
      LOG.error("Attempting to subscribe without callback to topic:", topic);
      return;
    }
    if (this.refMap[topic] === undefined) {
      LOG.error("Attempting to subscribe to a topic that does not exist in the native bus.", topic);
      return;
    }

    // subscribe to native event.
    let subscription = NativeAppEventEmitter.addListener(topic, callback);


    // return unsubscribe function.
    return () => {
      subscription.remove();
    };
  }
}

export const NativeBus = new NativeBusClass();


/** type defs **/

// type type_nearest = {
//   name      : string,
//   handle    : string,
//   rssi      : number,
//   setupMode : boolean
// }
//
// type type_beacon = {
//   id        : string,
//   uuid      : string,
//   major     : number,
//   minor     : number,
//   rssi      : number,
//   referenceId : string,
// }


/** end of type **/