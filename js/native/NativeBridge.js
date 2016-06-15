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

    // setTimeout(() => {Bluenet.initBluenet();},1000)
    // setTimeout(() => {Bluenet.trackUUID('a643423e-e175-4af0-a2e4-31e32f729a8a','franks!')},3000)
    //
    // var subscription = NativeAppEventEmitter.addListener(
    //   'iBeaconAdvertisement',
    //   (iBeaconAdvertisement) => {
    //     let data = JSON.parse(iBeaconAdvertisement);
    //     console.log("iBeaconAdvertisement:",data);
    //   }//this.bleEvents.emit('statusUpdate', data);}
    // );

    //
    // Bluenet.startCollectingFingerprint('groupid', 'locationid')
    // setTimeout(() => {Bluenet.finishCollectingFingerprint()},200)
    //
    // console.log("STARTING THE CLASSES",NativeAppEventEmitter);
    //
    // this.BleEvents = new EventBus();
    // this.LocationEvents = new EventBus();
    // this.connectedTo = undefined;
    //
    // var subscription = NativeAppEventEmitter.addListener(
    //   'advertisementData',
    //   (advertisementData) => {
    //
    //     let data = JSON.parse(advertisementData);
    //     console.log(data);
    //     // this.BleEvents.emit('statusUpdate', {
    //     //   type: 'statusUpdate',
    //     //   handle: data.id,
    //     //   rssi: data.rssi,
    //     //   message: {
    //     //     id: 2,
    //     //     subjectId: 2,
    //     //     state: 1,
    //     //     currentUsage: 200,
    //     //     timestamp: new Date().valueOf(),
    //     //     totalUsage: 4000,
    //     //     temperature: 20
    //     //   }
    //     // });
    //   });
    // //
    //




    // Don't forget to unsubscribe, typically in componentWillUnmount
    //subscription.remove();

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
    NativeAppEventEmitter.addListener(
      'advertisementData',
      (advertisementData) => {
        processScanResponse(this.store, advertisementData);
      }
    );

    NativeAppEventEmitter.addListener(
      'enterGroup',
      (enterGroup) => {
        //this.store.dispatch({type: 'SET_ACTIVE_GROUP', data: {activeGroup: enterGroup}});
        console.log("enterGroup:",enterGroup);
      }
    );
    NativeAppEventEmitter.addListener(
      'exitGroup',
      (exitGroup) => {
        console.log("exitGroup:",exitGroup);
      }
    );
    NativeAppEventEmitter.addListener(
      'enterLocation',
      (enterLocation) => {
        reactToEnterRoom(this.store, enterLocation);
        console.log("enterLocation:",enterLocation);
      }
    );
    NativeAppEventEmitter.addListener(
      'exitLocation',
      (exitLocation) => {
        reactToExitRoom(this.store, exitLocation);
        console.log("exitLocation:", exitLocation);
      }
    );
    NativeAppEventEmitter.addListener(
      'currentLocation',
      (currentLocation) => {
        console.log("currentLocation:", currentLocation);
      }
    );
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
    return BluenetPromise('connect', uuid);
  }

  disconnect() {
    return BluenetPromise('disconnect');
  }
  
  connectAndSetSwitchState(uuid, state) {
    BlePromiseManager.register(() => {
      return new Promise((resolve, reject) => {
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
    return BluenetPromise(safeState);
  }


  /**
   * This would be fired on all scanResponses from crownstone
   * @param data
   *        {type:'statusUpdate/setup/dfu', handle: CUUID, RSSI: Number, message: {}}
   *
   *        message statusUpdate:
   *          {
   *            id: (uint16 Number),
   *            subjectId: (uint16 Number),
   *            state: Number,
   *            currentUsage: Number,
   *            timestamp: timeStamp,
   *            totalUsage: Number,
   *            temperature: Number
   *          }
   *        message setup:
   *          {}
   *        message dfu:
   *          {????????}
   */
  scanResponseCallback(data) {
    if (data.type == 'statusUpdate') {
      this.bleEvents.emit('statusUpdate', data);
    }
    else if (data.type === 'setup') {
      this.bleEvents.emit('foundCrownstoneInSetupMode', data);
    }
    else if (data.type === 'dfu') {
      this.bleEvents.emit('foundCrownstoneInDFUMode', data);
    }
  }

  setStatusUpdateCallback() {}
  getStonesInSetup() {}
  getStonesInDFU() {}
  
  connect(id) {return new Promise((resolve, reject) => {
    this.connectedTo = id;    resolve()
  });}

  
  disconnect() {}
  
  getMacAddress() {
    return new Promise((resolve, reject) => {
      resolve("testing")
    });
  }
  makeNoise(id) {}
  writeId(id) {}
  writeEncryptionKeys(adminKey, userKey, guestKey) {}
  startActiveMode() {}
  getState(idArray) {}

}

export const NativeBridge = new NativeBridgeClass();