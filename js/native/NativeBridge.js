import { BluenetPromise, Bluenet } from './proxy';
import { NativeModules, NativeAppEventEmitter } from 'react-native';
import { EventBus } from '../util/eventBus'
import { reactToEnterRoom, reactToExitRoom, processScanResponse, BlePromiseManager } from '../logic/CrownstoneControl'

/* Pairing process:

// crownstone is in low tx mode since it's unclaimed (no keys and no id)

// step1: scan for crownstones
// step2: if the serviceData is only 0, it is in pairing mode
// step3: bond to that crownstone, pin: 000000
// step4: read the mac address from the characteristic
// step5: connect to the cloud and create a stone with the groupId and a mac address to receive keys and ID
// step6: write encryption keys and ID to crownstone
// step7: tell crownstone to start in active mode

 */

// usage:
// let TitleMaker = NativeModules.TitleMaker;
// TitleMaker.get(1, (result) => {
//   this.state.title = result.title;
//   this.setState(this.state);
// });

class NativeBridgeClass {
  constructor() {

    this.initialized = false;
    // route the events to React Native
    Bluenet.rerouteEvents();

    BluenetPromise("isReady")
      .then(() => {Bluenet.startScanningForCrownstones()});

    this.fingerprintingActive = false;
    this.fingerprintingSession = null;
    this.fingerprintingSubscriptions = {};

    this.store = undefined
  }

  loadStore(store) {
    if (this.initialized === false) {
      this.initialized = true;
      this.store = store;
      this.init();
    }
  }

  init() {
    // register the ibeacons
    const state = this.store.getState();
    let groupIds = Object.keys(state.groups);
    groupIds.forEach((groupId) => {
      let groupIBeaconUUID = state.groups[groupId].config.uuid;
      let groupName = state.groups[groupId].config.name;

      // track the group beacon UUID
      Bluenet.trackUUID(groupIBeaconUUID, groupName);
    });

    // bind the events
    // NativeAppEventEmitter.addListener(
    //   'advertisementData',
    //   (advertisementData) => {
    //     processScanResponse(this.store, advertisementData);
    //   }
    // );
    //
    // NativeAppEventEmitter.addListener(
    //   'enterGroup',
    //   (enterGroup) => {
    //     //this.store.dispatch({type: 'SET_ACTIVE_GROUP', data: {activeGroup: enterGroup}});
    //     console.log("enterGroup:",enterGroup);
    //   }
    // );
    // NativeAppEventEmitter.addListener(
    //   'exitGroup',
    //   (exitGroup) => {
    //     console.log("exitGroup:",exitGroup);
    //   }
    // );
    // NativeAppEventEmitter.addListener(
    //   'enterLocation',
    //   (enterLocation) => {
    //     reactToEnterRoom(this.store, enterLocation);
    //     console.log("enterLocation:",enterLocation);
    //   }
    // );
    // NativeAppEventEmitter.addListener(
    //   'exitLocation',
    //   (exitLocation) => {
    //     reactToExitRoom(this.store, exitLocation);
    //     console.log("exitLocation:", exitLocation);
    //   }
    // );
    // NativeAppEventEmitter.addListener(
    //   'currentLocation',
    //   (currentLocation) => {
    //     console.log("currentLocation:", currentLocation);
    //   }
    // );
  }

  /**
   * Callback is to register for updates, not a promise
   * @param callback
   */
  startFingerprinting(callback) {
    Bluenet.startCollectingFingerprint();
    this.fingerprintingActive = true;

    if (callback !== undefined) {
      let sessionId = (Math.random()*1e8).toString(36) + '-' + (Math.random()*1e8).toString(36);
      this.fingerprintingSession = sessionId;
      this.fingerprintingSubscriptions[sessionId] =  NativeAppEventEmitter.addListener(
        'iBeaconAdvertisement',
        (iBeaconAdvertisement) => {
          if (Array.isArray(iBeaconAdvertisement)) {
            let data = [];
            for (let i = 0; i < iBeaconAdvertisement.length; i++) {
              data.push(JSON.parse(iBeaconAdvertisement[i]))
            }
            callback(data)
          }
          else {
            console.log("DATA NOT AN ARRAY:", iBeaconAdvertisement)
          }
        }
      );
    }
  }

  abortFingerprinting() {
    this._stopFingerprinting(() => { Bluenet.abortCollectingFingerprint();} );
  }

  finalizeFingerprint(groupId, locationId) {
    this._stopFingerprinting(() => { Bluenet.finalizeFingerprint(groupId, locationId);} );
  }

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

  getFingerprint(groupId, locationId) {
    return new Promise((resolve, reject) => {
      // resolve is pushed ino the fingerprint.
      Bluenet.getFingerprint(groupId, locationId, resolve);
    });
  }


  connect(uuid) {
    console.log('in here')
    return BluenetPromise('connect', uuid);
  }

  disconnect() {
    return BluenetPromise('disconnect');
  }
  
  connectAndSetSwitchState(uuid, state) {
    BlePromiseManager.register(() => {
      return new Promise((resolve, reject) => {
        console.log("here")
        this.connect(uuid)
          .then(() => {
            return this.setSwitchState(state);
          })
          .then(() => {
            return this.disconnect();
          })
          .then(() => {
            resolve()
          })
          .catch((err) => {
            console.log("connectAndSetSwitchState Error:", err);
            reject(err);
          })
      });
    });
  }

  setSwitchState(state) {
    let safeState = Math.min(1, Math.max(0, state));
    safeState = 1;
    return BluenetPromise('setSwitchState', safeState);
  }


}

export const NativeBridge = new NativeBridgeClass();