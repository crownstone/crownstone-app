import { NativeEventsBridge } from './NativeEventsBridge'
import { Bluenet, NativeEvents } from './Proxy';
import { NativeEventsBridge } from './NativeEventsBridge'

export const LocalizationUtil = {
  fingerprintingActive: false,
  fingerprintingSession: null,
  fingerprintingSubscriptions: {},
  /**
   * Callback is to register for updates, not a promise. You can do what you want with this information, it will not influence the fingerprint
   * @param callback
   */
  startFingerprinting: (callback) => {
    this._startFingerprinting(() => { Bluenet.startCollectingFingerprint(); }, callback);
  },

  resumeCollectingFingerprint: (callback) => {
    this._startFingerprinting(() => { Bluenet.resumeCollectingFingerprint(); }, callback);
  },

  abortFingerprinting: () => {
    this._stopFingerprinting(() => { Bluenet.abortCollectingFingerprint();} );
  },

  finalizeFingerprint: (groupId, locationId) => {
    this._stopFingerprinting(() => { Bluenet.finalizeFingerprint(groupId, locationId);} );
  },

  pauseCollectingFingerprint: () => {
    this._stopFingerprinting(() => { Bluenet.abortCollectingFingerprint(); });
  },

  /**
   * Callback is to register for updates, not a promise. It binds a callback to the eventstream and cleans up using stopFingerprinting
   * @param nativeCall
   * @param callback
   */
  _startFingerprinting: (nativeCall, callback) => {
    nativeCall();
    this.fingerprintingActive = true;

    if (callback !== undefined) {
      let sessionId = (Math.random()*1e8).toString(36) + '-' + (Math.random()*1e8).toString(36);
      this.fingerprintingSession = sessionId;
      this.fingerprintingSubscriptions[sessionId] =  NativeEventsBridge.on(
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
            console.log("DATA NOT AN ARRAY:", iBeaconAdvertisement)
          }
        }
      );
    }
  },

  /**
   * clean up the listening to the iBeacon eventstream
   * @param nativeCall
   */
  _stopFingerprinting: (nativeCall) => {
    if (this.fingerprintingSession !== null) {
      this.fingerprintingSubscriptions[this.fingerprintingSession].remove();
      delete this.fingerprintingSubscriptions[this.fingerprintingSession]
    }

    if (this.fingerprintingActive) {
      nativeCall();
      this.fingerprintingSession = null;
      this.fingerprintingActive = false;
    }
  },

  getFingerprint: (groupId, locationId) => {
    return new Promise((resolve, reject) => {
      // resolve is pushed ino the fingerprint.
      Bluenet.getFingerprint(groupId, locationId, resolve);
    });
  },
};

