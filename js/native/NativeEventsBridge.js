import { BluenetPromise, Bluenet, BleActions, NativeEvents } from './Proxy';
import { NativeModules, NativeAppEventEmitter } from 'react-native';
import { reactToEnterRoom, reactToExitRoom, processScanResponse } from '../logic/CrownstoneControl'
import { BlePromiseManager } from '../logic/BlePromiseManager'
import { EventBus } from '../util/eventBus'
import { LOG } from '../logging/Log'
import { ENCRYPTION_ENABLED } from '../ExternalConfig'


class NativeEventsClass {
  constructor() {

    this.initialized = false;
    // route the events to React Native
    Bluenet.rerouteEvents();

    // enable scanning for Crownstones
    BluenetPromise("isReady")
      .then(() => {Bluenet.startScanningForCrownstones()});


    this.subscriptions = {};
    this.store = undefined;

    this.bleEvents = new EventBus();
    this.locationEvents = new EventBus();

  }

  loadStore(store) {
    LOG('LOADED STORE NativeEventsClass', this.initialized);
    if (this.initialized === false) {
      this.initialized = true;
      this.store = store;

      this.init();
      this.startListeningToBleEvents();
      this.startListeningToLocationEvents();
    }
  }

  init() {

  }

  startListeningToBleEvents() {
    // bind the BLE events
    let vAdvData = NativeEvents.ble.verifiedAdvertisementData;
    this.subscriptions[vAdvData] = NativeAppEventEmitter.addListener(
      vAdvData,
      (verifiedAdvertisementData) => {
        if (typeof verifiedAdvertisementData == 'string' && verifiedAdvertisementData.length > 2) {
          verifiedAdvertisementData = JSON.parse(verifiedAdvertisementData);
          this.bleEvents.emit(vAdvData, verifiedAdvertisementData);
        }
      }
    );

    let nSetupCS = NativeEvents.ble.nearestSetupCrownstone;
    this.subscriptions[nSetupCS] = NativeAppEventEmitter.addListener(
      nSetupCS,
      (crownstoneUUID) => {
        this.bleEvents.emit(nSetupCS, crownstoneUUID);
      }
    );

    let nCS = NativeEvents.ble.nearestCrownstone;
    this.subscriptions[nCS] = NativeAppEventEmitter.addListener(
      nCS,
      (crownstoneUUID) => {
        this.bleEvents.emit(nCS, crownstoneUUID);
      }
    );

    let iBeaconAdv = NativeEvents.location.iBeaconAdvertisement;
    if (this.subscriptions[iBeaconAdv] === undefined) {
      this.subscriptions[iBeaconAdv] = NativeAppEventEmitter.addListener(
        iBeaconAdv,
        (iBeaconAdvertisement) => {
          this.locationEvents.emit(iBeaconAdv, iBeaconAdvertisement);
        }
      );
    }
  }

  startListeningToLocationEvents() {
    let state = this.store.getState();
    if (state.app.enableLocalization === true) {
      // resume the tracking of the beacons, can also be called safely if we are already listening.
      Bluenet.resumeIBeaconTracking();

      let enterSphere = NativeEvents.location.enterSphere;
      if (this.subscriptions[enterSphere] === undefined) {
        this.subscriptions[enterSphere] = NativeAppEventEmitter.addListener(
          enterSphere,
          (sphereId) => {
            let state = this.store.getState();
            LOG("ENTER SPHERE", sphereId);
            // TODO: move to localization util or something
            if (state.spheres[sphereId] !== undefined) {
              // prepare the settings for this sphere and pass them onto bluenet
              let bluenetSettings = {
                encryptionEnabled:ENCRYPTION_ENABLED,
                adminKey : state.spheres[sphereId].config.adminKey,
                memberKey: state.spheres[sphereId].config.memberKey,
                guestKey : state.spheres[sphereId].config.guestKey,
              };

              LOG("Set Settings.", bluenetSettings, state.spheres[sphereId])
              return BleActions.setSettings(JSON.stringify(bluenetSettings))
                .then(() => {
                  LOG("Setting Active Sphere")
                  this.store.dispatch({type: 'SET_ACTIVE_SPHERE', data: {activeSphere: sphereId}});
                  this.locationEvents.emit(enterSphere, sphereId);
                }).catch()
            }
          }
        );
      }

      let exitSphere = NativeEvents.location.exitSphere;
      if (this.subscriptions[exitSphere] === undefined) {
        this.subscriptions[exitSphere] = NativeAppEventEmitter.addListener(
          exitSphere,
          (sphereId) => {
            LOG("EXIT SPHERE")
            this.locationEvents.emit(exitSphere, sphereId);
            // TODO: move to localization util or something
            this.store.dispatch({type: 'CLEAR_ACTIVE_SPHERE'});
          }
        );
      }


      let enterLoc = NativeEvents.location.enterLocation;
      if (this.subscriptions[enterLoc] === undefined) {
        this.subscriptions[enterLoc] = NativeAppEventEmitter.addListener(
          enterLoc,
          (locationId) => {
            let state = this.store.getState();
            if (state.app.activeSphere && locationId) {
              this.locationEvents.emit(enterLoc, locationId);
              // TODO: move to localization util or something, do something with the behaviour
              this.store.dispatch({type: 'USER_ENTER', sphereId: state.app.activeSphere, locationId: locationId, userId: state.user.userId});
            }
          }
        );
      }


      let exitLoc = NativeEvents.location.exitLocation;
      if (this.subscriptions[exitLoc] === undefined) {
        this.subscriptions[exitLoc] = NativeAppEventEmitter.addListener(
          exitLoc,
          (locationId) => {
            let state = this.store.getState();
            if (state.app.activeSphere && locationId) {
              this.locationEvents.emit(exitLoc, locationId);
              // TODO: move to localization util or something, do something with the behaviour
              this.store.dispatch({type: 'USER_EXIT', sphereId: state.app.activeSphere, locationId: locationId, userId: state.user.userId});
            }
          }
        );
      }


      let currentLoc = NativeEvents.location.currentLocation;
      if (this.subscriptions[currentLoc] === undefined) {
       this.subscriptions[currentLoc] = NativeAppEventEmitter.addListener(
         currentLoc,
         (currentLocation) => {
           this.locationEvents.emit(currentLoc, currentLocation);
         }
       );
      }
    }
    else {
      LOG("LOCALIZATION IS DISABLED IN THE SETTINGS")
    }
  }

  stopListeningToLocationEvents() {
    let locationEvents = NativeEvents.location;
    for (let eventName in locationEvents) {
      if (locationEvents.hasOwnProperty(eventName)) {
        if (this.subscriptions[eventName] !== undefined) {
          this.subscriptions[eventName].remove();
          this.subscriptions[eventName] = undefined;
        }
      }
    }

    Bluenet.stopIBeaconTracking();
  }

}

export const NativeEventsBridge = new NativeEventsClass();