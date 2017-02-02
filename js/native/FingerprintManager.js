import { Bluenet, NativeBus, BluenetPromises } from './Proxy';
import { LOG } from '../logging/Log'

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
      this.fingerprintingSubscriptions[sessionId] = NativeBus.on(NativeBus.topics.iBeaconAdvertisement,
        (iBeaconAdvertisement) => {
          if (Array.isArray(iBeaconAdvertisement)) {
            let data = [];
            for (let i = 0; i < iBeaconAdvertisement.length; i++) {
              data.push(iBeaconAdvertisement[i])
            }
            callback(data);
          }
          else {
            LOG("DATA NOT AN ARRAY:", iBeaconAdvertisement)
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
    this._cleanup();

    if (nativeCall)
      nativeCall();
  }

  _cleanup() {
    if (this.fingerprintingSession !== null) {
      this.fingerprintingSubscriptions[this.fingerprintingSession]();
      delete this.fingerprintingSubscriptions[this.fingerprintingSession]
    }

    if (this.fingerprintingActive) {
      this.fingerprintingSession = null;
      this.fingerprintingActive = false;
    }
  }

  /**
   * Callback is to register for updates, not a promise. You can do what you want with this information, it will not influence the fingerprint
   * @param callback
   */
  startFingerprinting(callback) {
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

  finalizeFingerprint(sphereId, locationId) {
    this._stopFingerprinting(() => {});
    return BluenetPromises.finalizeFingerprint(sphereId, locationId)
  }

  pauseCollectingFingerprint() {
    this._stopFingerprinting(() => {
      Bluenet.abortCollectingFingerprint();
    });
  }
}

export const FingerprintManager = new FingerprintManagerClass();
