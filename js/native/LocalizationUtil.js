import { NativeEventsBridge } from './NativeEventsBridge'
import { Bluenet, NativeEvents, BleActions } from './Proxy';

class FingerprintManagerClass {
  constructor() {
    this.fingerprintingActive = false;
    this.fingerprintingSession = null;
    this.fingerprintingSubscriptions = {};
  }


  /**
   * Callback is to register for updates, not a promise. It binds a callback to the eventstream and cleans up using stopFingerprinting
   * @param nativeCall
   * @param callback
   */
  _startFingerprinting(nativeCall, callback) {
    nativeCall();
    this.fingerprintingActive = true;

    if (callback !== undefined) {
      let sessionId = (Math.random() * 1e8).toString(36) + '-' + (Math.random() * 1e8).toString(36);
      this.fingerprintingSession = sessionId;
      this.fingerprintingSubscriptions[sessionId] = NativeEventsBridge.locationEvents.on(
        NativeEvents.location.iBeaconAdvertisement,
        (iBeaconAdvertisement) => {
          if (Array.isArray(iBeaconAdvertisement)) {
            let data = [];
            for (let i = 0; i < iBeaconAdvertisement.length; i++) {
              data.push(JSON.parse(iBeaconAdvertisement[i]))
            }
            callback(data);
          }
          else {
            // console.log("DATA NOT AN ARRAY:", iBeaconAdvertisement)
          }
        }
      );
    }
  }

  /**
   * clean up the listening to the iBeacon eventstream
   * @param nativeCall
   */
  _stopFingerprinting(nativeCall) {
    if (this.fingerprintingSession !== null) {
      this.fingerprintingSubscriptions[this.fingerprintingSession].remove();
      delete this.fingerprintingSubscriptions[this.fingerprintingSession]
    }

    if (this.fingerprintingActive) {
      nativeCall();
      this.fingerprintingSession = null;
      this.fingerprintingActive = false;
    }
  }

  /**
   * Callback is to register for updates, not a promise. You can do what you want with this information, it will not influence the fingerprint
   * @param callback
   */
  startFingerprinting(callback) {
    // console.log(this)
    this._startFingerprinting(() => {
      Bluenet.startCollectingFingerprint();
    }, callback);
  }

  resumeCollectingFingerprint(callback) {
    this._startFingerprinting(() => {
      Bluenet.resumeCollectingFingerprint();
    }, callback);
  }

  abortFingerprinting() {
    this._stopFingerprinting(() => {
      Bluenet.abortCollectingFingerprint();
    });
  }

  finalizeFingerprint(groupId, locationId) {
    this._stopFingerprinting(() => {
      Bluenet.finalizeFingerprint(groupId, locationId);
    });
  }

  pauseCollectingFingerprint() {
    this._stopFingerprinting(() => {
      Bluenet.abortCollectingFingerprint();
    });
  }

  getFingerprint(groupId, locationId) {
    return new Promise((resolve, reject) => {
      // resolve is pushed ino the fingerprint.
      Bluenet.getFingerprint(groupId, locationId, resolve);
    });
  }
}

export const FingerprintManager = new FingerprintManagerClass();

export const LocalizationUtil = {

  /**
   * clear all beacons and re-register them. This will not re-emit roomEnter/exit if we are in the same room.
   */
  trackGroups: function (store) {
    BleActions.clearTrackedBeacons()
      .then(() => {
        // register the iBeacons UUIDs with the localization system.
        const state = store.getState();
        let groupIds = Object.keys(state.groups);
        groupIds.forEach((groupId) => {
          let groupIBeaconUUID = state.groups[groupId].config.iBeaconUUID;

          // track the group beacon UUID
          Bluenet.trackIBeacon(groupIBeaconUUID, groupId);

          // console.log("-------------- SETUP TRACKING FOR ", groupIBeaconUUID);

          let locations = state.groups[groupId].locations;
          let locationIds = Object.keys(locations);
          locationIds.forEach((locationId) => {
            if (locations[locationId].config.fingerprintRaw) {
              Bluenet.loadFingerprint(groupId, locationId, locations[locationId].config.fingerprintRaw)
            }
          });
        });
      })
  },

  
};

