import { BluenetPromise, Bluenet, BleActions, NativeEvents } from './Proxy';
import { NativeModules, NativeAppEventEmitter } from 'react-native';
import { reactToEnterRoom, reactToExitRoom, processScanResponse } from '../logic/CrownstoneControl'
import { BlePromiseManager } from '../logic/BlePromiseManager'
import { EventBus } from '../util/eventBus'



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
    console.log('LOADED STORE NativeEventsClass', this.initialized);
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

      let enterGroup = NativeEvents.location.enterGroup;
      if (this.subscriptions[enterGroup] === undefined) {
        this.subscriptions[enterGroup] = NativeAppEventEmitter.addListener(
          enterGroup,
          (groupId) => {
            this.locationEvents.emit(enterGroup, groupId);
            // TODO: move to localization util or something
            if (state.groups[groupId] !== undefined) {
              // prepare the settings for this group and pass them onto bluenet
              let bluenetSettings = {
                encryptionEnabled:true,
                adminKey : state.groups[groupId].config.adminKey,
                memberKey: state.groups[groupId].config.memberKey,
                guestKey : state.groups[groupId].config.guestKey,
              };
              return BleActions.setSettings(JSON.stringify(bluenetSettings))
                .then(() => {
                  this.store.dispatch({type: 'SET_ACTIVE_GROUP', data: {activeGroup: groupId}});
                })
            }
          }
        );
      }

      let exitGroup = NativeEvents.location.exitGroup;
      if (this.subscriptions[exitGroup] === undefined) {
        this.subscriptions[exitGroup] = NativeAppEventEmitter.addListener(
          exitGroup,
          (groupId) => {
            this.locationEvents.emit(exitGroup, groupId);
            // TODO: move to localization util or something
            this.store.dispatch({type: 'CLEAR_ACTIVE_GROUP'});
          }
        );
      }


      let enterLoc = NativeEvents.location.enterLocation;
      if (this.subscriptions[enterLoc] === undefined) {
        this.subscriptions[enterLoc] = NativeAppEventEmitter.addListener(
          enterLoc,
          (locationId) => {
            this.locationEvents.emit(enterLoc, locationId);
            // TODO: move to localization util or something, do something with the behaviour
            this.store.dispatch({type: 'USER_ENTER', groupId: state.app.activeGroup, locationId: locationId});
          }
        );
      }


      let exitLoc = NativeEvents.location.exitLocation;
      if (this.subscriptions[exitLoc] === undefined) {
        this.subscriptions[exitLoc] = NativeAppEventEmitter.addListener(
          exitLoc,
          (locationId) => {
            this.locationEvents.emit(exitLoc, locationId);
            // TODO: move to localization util or something, do something with the behaviour
            this.store.dispatch({type: 'USER_EXIT', groupId: state.app.activeGroup, locationId: locationId});
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
      console.log("LOCALIZATION IS DISABLED IN THE SETTINGS")
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