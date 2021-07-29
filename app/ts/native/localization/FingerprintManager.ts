import { BluenetPromiseWrapper } from '../libInterface/BluenetPromise';
import { Bluenet  }              from '../libInterface/Bluenet';
import { LOG }                   from '../../logging/Log'
import { core } from "../../Core";

class FingerprintManagerClass {
  fingerprintingActive : any;
  fingerprintingSession : any;
  fingerprintingSubscriptions : any;

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
      this.fingerprintingSubscriptions[sessionId] = core.nativeBus.on(core.nativeBus.topics.iBeaconAdvertisement,
        (iBeaconAdvertisement) => {
          if (Array.isArray(iBeaconAdvertisement)) {
            let data = [];
            for (let i = 0; i < iBeaconAdvertisement.length; i++) {
              data.push(iBeaconAdvertisement[i])
            }
            callback(data);
          }
          else {
            LOG.info("DATA NOT AN ARRAY:", iBeaconAdvertisement)
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
    return BluenetPromiseWrapper.finalizeFingerprint(sphereId, locationId)
  }

  pauseCollectingFingerprint() {
    this._stopFingerprinting(() => {
      Bluenet.pauseCollectingFingerprint();
    });
  }


  /**
   * Use this method to catch any case where the fingerprint would be incorrect due to bugs or old formats.
   *
   * @returns {boolean}
   * @param stringifiedFingerprint
   */
  validateFingerprint(stringifiedFingerprint) {
    let fingerprint = JSON.parse(stringifiedFingerprint);
    if (fingerprint.length > 0 && fingerprint[0].devices !== undefined) {
      // check for negative major or minors, coming from casting to Int16 instead of UInt16 in Android.
      for (let i = 0; i < fingerprint.length; i++) {
        let deviceIds = Object.keys(fingerprint[i].devices);
        for (let j = 0; j < deviceIds.length; j++) {
          if (deviceIds[j].length < 1 || deviceIds[j].indexOf(':-') > 0) {
            return false;
          }
        }
      }

      return true;
    }

    return false;
  }



  shouldTransformFingerprint(stringifiedFingerprint) {
    return stringifiedFingerprint.indexOf(".Maj:") !== -1;
  }

  transformFingerprint(stringifiedFingerprint) {
    let step1 = stringifiedFingerprint.replace(/(\.Maj:)/g,"_Maj:");
    let step2 = step1.replace(/(\.Min:)/g,"_Min:");
    return step2;
  }

}



export const FingerprintManager = new FingerprintManagerClass();
