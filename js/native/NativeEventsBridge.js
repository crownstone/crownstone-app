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
    if (this.initialized === false) {
      this.initialized = true;
      this.store = store;

      this.init();
      this.startListeningToBleEvents();
      this.startListeningToLocationEvents();
    }
  }

  init() {
    // register the iBeacons uuids with the localization system.
    const state = this.store.getState();
    let groupIds = Object.keys(state.groups);
    groupIds.forEach((groupId) => {
      let groupIBeaconUUID = state.groups[groupId].config.iBeaconUUID;

      // track the group beacon UUID
      Bluenet.trackIBeacon(groupIBeaconUUID, groupId);

      let locations = state.groups[groupId].locations;
      let locationIds = Object.keys(locations);
      locationIds.forEach((locationId) => {
        if (locations[locationId].config.fingerprintRaw !== undefined) {
          console.log(locationId,"locations[locationId].config.fingerprintRaw", locations[locationId].config.fingerprintRaw);
          Bluenet.loadFingerprint(groupId, locationId, locations[locationId].config.fingerprintRaw)
        }
      });
    });
  }

  startListeningToBleEvents() {
    // bind the BLE events
    let eventName = NativeEvents.ble.verifiedAdvertisementData;
    if (this.subscriptions[eventName] === undefined) {
      this.subscriptions[eventName] = NativeAppEventEmitter.addListener(
        eventName,
        (verifiedAdvertisementData) => {
          if (typeof verifiedAdvertisementData == 'string' && verifiedAdvertisementData.length > 2) {
            verifiedAdvertisementData = JSON.parse(verifiedAdvertisementData);
            this.bleEvents.emit(eventName, verifiedAdvertisementData);
          }
        }
      );
    }

    eventName = NativeEvents.ble.nearestSetupCrownstone;
    this.subscriptions[eventName] = NativeAppEventEmitter.addListener(
      eventName,
      (crownstoneUUID) => {
        this.bleEvents.emit(eventName, crownstoneUUID);
      }
    );

    eventName = NativeEvents.ble.nearestCrownstone;
    this.subscriptions[eventName] = NativeAppEventEmitter.addListener(
      eventName,
      (crownstoneUUID) => {
        this.bleEvents.emit(eventName, crownstoneUUID);
      }
    );
  }

  startListeningToLocationEvents() {
    let state = this.store.getState();
    if (state.app.enableLocalization === true) {
      // resume the tracking of the beacons, can also be called safely if we are already listening.
      Bluenet.resumeIBeaconTracking();

      let eventName = NativeEvents.location.enterGroup;
      if (this.subscriptions[eventName] === undefined) {
        this.subscriptions[eventName] = NativeAppEventEmitter.addListener(
          eventName,
          (groupId) => {
            this.locationEvents.emit(eventName, groupId);
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

      eventName = NativeEvents.location.exitGroup;
      if (this.subscriptions[eventName] === undefined) {
        this.subscriptions[eventName] = NativeAppEventEmitter.addListener(
          eventName,
          (groupId) => {
            this.locationEvents.emit(eventName, groupId);
            // TODO: move to localization util or something
            this.store.dispatch({type: 'CLEAR_ACTIVE_GROUP'});
          }
        );
      }


      eventName = NativeEvents.location.enterLocation;
      if (this.subscriptions[eventName] === undefined) {
        this.subscriptions[eventName] = NativeAppEventEmitter.addListener(
          eventName,
          (locationId) => {
            this.locationEvents.emit(eventName, locationId);
            // TODO: move to localization util or something, do something with the behaviour
            this.store.dispatch({type: 'USER_ENTER', groupId: state.app.activeGroup, locationId: locationId});
          }
        );
      }


      eventName = NativeEvents.location.exitLocation;
      if (this.subscriptions[eventName] === undefined) {
        this.subscriptions[eventName] = NativeAppEventEmitter.addListener(
          eventName,
          (locationId) => {
            this.locationEvents.emit(eventName, locationId);
            // TODO: move to localization util or something, do something with the behaviour
            this.store.dispatch({type: 'USER_EXIT', groupId: state.app.activeGroup, locationId: locationId});
          }
        );
      }


      eventName = NativeEvents.location.currentLocation;
      if (this.subscriptions[eventName] === undefined) {
       this.subscriptions[eventName] = NativeAppEventEmitter.addListener(
         eventName,
         (currentLocation) => {
           this.locationEvents.emit(eventName, currentLocation);
         }
       );
      }

      eventName = NativeEvents.location.iBeaconAdvertisement;
      if (this.subscriptions[eventName] === undefined) {
        this.subscriptions[eventName] = NativeAppEventEmitter.addListener(
          eventName,
          (iBeaconAdvertisement) => {
            this.locationEvents.emit(eventName, iBeaconAdvertisement);
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