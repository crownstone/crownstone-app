import { Alert }                    from 'react-native';

import { NativeBus }                from '../libInterface/NativeBus';
import { BluenetPromiseWrapper }    from '../libInterface/BluenetPromise';
import { Bluenet  }                 from '../libInterface/Bluenet';
import { BehaviourUtil }            from '../../util/BehaviourUtil';
import { KeepAliveHandler }         from '../../backgroundProcesses/KeepAliveHandler';
import { StoneTracker }             from '../advertisements/StoneTracker';
import { Scheduler }                from '../../logic/Scheduler';
import { LOG }                      from '../../logging/Log';
import { Util }                     from '../../util/Util';
import { BEHAVIOUR_TYPES }          from '../../router/store/reducers/stones';
import { ENCRYPTION_ENABLED, KEEPALIVE_INTERVAL } from '../../ExternalConfig';
import { canUseIndoorLocalizationInSphere, clearRSSIs, disableStones } from '../../util/DataUtil';
import { eventBus }                 from '../../util/EventBus';
import { CLOUD }                    from '../../cloud/cloudAPI';
import { BatterySavingUtil }        from '../../util/BatterySavingUtil';


class LocationHandlerClass {
  _initialized : boolean;
  store : any;
  tracker : any;
  _uuid : string;
  _readyForLocalization = false;

  constructor() {
    this._initialized = false;
    this.store = undefined;
    this.tracker = undefined;

    this._uuid = Util.getUUID();


    // subscribe to iBeacons when the spheres in the cloud change.
    CLOUD.events.on('CloudSyncComplete_spheresChanged', () => {
      if (this._readyForLocalization) {
        LocationHandler.initializeTracking();
      }
    });

    // when a sphere is created, we track all spheres anew.
    eventBus.on('userLoggedInFinished', () => { this._readyForLocalization = true; });
    eventBus.on('sphereCreated', () => {
      if (this._readyForLocalization) {
        LocationHandler.initializeTracking();
      }
    });
  }

  _loadStore(store) {
    LOG.info('LocationHandler: LOADED STORE LocationHandler', this._initialized);
    if (this._initialized === false) {
      this._initialized = true;
      this.store = store;
      this.tracker = new StoneTracker(store);

      // NativeBus.on(NativeBus.topics.currentRoom, (data) => {LOG.debug('CURRENT ROOM', data)});
      NativeBus.on(NativeBus.topics.enterSphere, (sphereId) => { this.enterSphere(sphereId); });
      NativeBus.on(NativeBus.topics.exitSphere,  (sphereId) => { this.exitSphere(sphereId); });
      NativeBus.on(NativeBus.topics.enterRoom,   (data)     => { this._enterRoom(data); }); // data = {region: sphereId, location: locationId}
      NativeBus.on(NativeBus.topics.exitRoom,    (data)     => { this._exitRoom(data); });  // data = {region: sphereId, location: locationId}
      NativeBus.on(NativeBus.topics.iBeaconAdvertisement, (data) => { this._iBeaconAdvertisement(data); });
    }
  }

  _iBeaconAdvertisement(data) {
    data.forEach((iBeaconPackage) => {
      this.tracker.iBeaconUpdate(iBeaconPackage.major, iBeaconPackage.minor, iBeaconPackage.rssi, iBeaconPackage.referenceId);
    });
  }

  enterSphere(sphereId) {
    let state = this.store.getState();
    let sphere = state.spheres[sphereId];

    if (!sphere) {
      LOG.error('LocationHandler: Received enter sphere for a sphere that we shouldn\'t be tracking...');
      return;
    }

    // The call on our own eventbus is different from the native bus because enterSphere can be called by fallback mechanisms.
    eventBus.emit('enterSphere', sphereId);

    // We load the settings and start the localization regardless if we are already in the sphere. The calls themselves
    // are cheap and it could be that the lib has restarted: losing it's state. This will make sure we will always have the
    // right settings in the lib.

    // prepare the settings for this sphere and pass them onto the bluenet lib
    let bluenetSettings = {
      encryptionEnabled: ENCRYPTION_ENABLED,
      adminKey:  sphere.config.adminKey,
      memberKey: sphere.config.memberKey,
      guestKey:  sphere.config.guestKey,
      referenceId: sphereId
    };

    if (canUseIndoorLocalizationInSphere(state, sphereId) === true) {
      LOG.info('LocationHandler: Starting indoor localization for sphere', sphereId);
      Bluenet.startIndoorLocalization();
    }
    else {
      LOG.info('LocationHandler: Stopping indoor localization for sphere', sphereId, 'due to missing fingerprints or not enough Crownstones.');
      Bluenet.stopIndoorLocalization();
    }

    // scan for crownstones on entering a sphere.
    BatterySavingUtil.startNormalUsage(sphereId);


    LOG.info("Set Settings.", bluenetSettings);
    BluenetPromiseWrapper.setSettings(bluenetSettings).catch((err) => {
      LOG.error("LocationHandler: Could not set Settings!", err);
      Alert.alert("Could not set Keys!","This should not happen. Make sure you're an admin to avoid this. This will be fixed soon!", [{text:"OK..."}]);
    });


    // make sure we only do the following once per sphere
    if (sphere && sphere.config && sphere.config.present === true) {
      LOG.info('LocationHandler: IGNORE ENTER SPHERE because I\'m already in the Sphere.');
      return;
    }

    // update location of the sphere, start the keepAlive and check if we have to perform an enter sphere behaviour trigger.
    if (sphere !== undefined) {
      LOG.info('LocationHandler: ENTER SPHERE', sphereId);

      BluenetPromiseWrapper.requestLocation()
        .catch((err) => {
          LOG.error('Could not get Location when entering a sphere: ', err);
        })
        .then((location) => {
          if (location && location.latitude && location.longitude) {
            if (sphere.config.latitude && sphere.config.longitude) {
              let dx = location.latitude - sphere.config.latitude;
              let dy = location.longitude - sphere.config.longitude;
              let distance = Math.sqrt(dx*dx + dy*dy);
              if (distance > 0.4) {
                LOG.info('LocationHandler: Update sphere location, old: (', sphere.config.latitude, ',', sphere.config.longitude,') to new: (', location.latitude, ',', location.longitude,')');
                this.store.dispatch({type: 'UPDATE_SPHERE_CONFIG', sphereId: sphereId, data: {latitude: location.latitude, longitude: location.longitude}});
              }
            }
            else {
              LOG.info('LocationHandler: Setting sphere location to (', location.latitude, ',', location.longitude,')');
              this.store.dispatch({type: 'UPDATE_SPHERE_CONFIG', sphereId: sphereId, data: {latitude: location.latitude, longitude: location.longitude}});
            }
          }
        })
        .catch((err) => {});

      // set the presence
      this.store.dispatch({type: 'SET_SPHERE_STATE', sphereId: sphereId, data: {reachable: true, present: true}});

      // start the keep alive run. This gives the app some time for syncing and pointing out which stones are NOT disabled.
      Scheduler.scheduleCallback(() => {
        KeepAliveHandler.fireTrigger();
      }, 1000, 'sphere enter keepAlive trigger');

      // get the time last seen of the crownstones in this sphere
      let stones = state.spheres[sphereId].stones;
      let stoneIds = Object.keys(stones);
      let timeLastSeen = 0;
      stoneIds.forEach((stoneId) => {
        // get the most recent time.
        if (stones[stoneId].config.lastSeen && timeLastSeen < stones[stoneId].config.lastSeen) {
          timeLastSeen = stones[stoneId].config.lastSeen;
        }
      });

      // we reduce this amount by 1 times the keep-alive interval. This is done to account for possible lossy keepalives.
      let sphereTimeout = state.spheres[sphereId].config.exitDelay - KEEPALIVE_INTERVAL;
      let timeSinceLastCrownstoneWasSeen = new Date().valueOf() - timeLastSeen;
      if (timeSinceLastCrownstoneWasSeen > sphereTimeout) {
        // trigger crownstones on enter sphere
        LOG.info('LocationHandler: TRIGGER ENTER HOME EVENT FOR SPHERE', sphere.config.name);
        BehaviourUtil.enactBehaviourInSphere(this.store, sphereId, BEHAVIOUR_TYPES.HOME_ENTER);
      }
      else {
        LOG.info('LocationHandler: DO NOT TRIGGER ENTER HOME EVENT SINCE TIME SINCE LAST SEEN STONE IS ', timeSinceLastCrownstoneWasSeen, ' WHICH IS LESS THAN KEEPALIVE_INTERVAL*1000*1.5 = ', KEEPALIVE_INTERVAL*1000*1.5, ' ms');
      }
    }
  }


  /**
   * Reset will clear the last time present from the check. This will cause the enter sphere event to work as it should.
   * @param sphereId
   * @param reset
   */
  exitSphere(sphereId) {
    LOG.info('LocationHandler: LEAVING SPHERE', sphereId);
    // make sure we only leave a sphere once. It can happen that the disable timeout fires before the exit region in the app.
    let state = this.store.getState();

    if (state.spheres[sphereId].config.present === true) {
      LOG.info('Applying EXIT SPHERE');
      // remove user from all rooms
      this._removeUserFromRooms(state, sphereId, state.user.userId);

      // clear all rssi's
      clearRSSIs(this.store, sphereId);

      // disable all crownstones
      disableStones(this.store, sphereId);

      // check if you are present in any sphere. If not, stop scanning (BLE, not iBeacon).
      let presentSomewhere = false;
      Object.keys(state.spheres).forEach((checkSphereId) => {
        if (state.spheres[checkSphereId].config.present === true && checkSphereId !== sphereId) {
          presentSomewhere = true;
        }
      });

      // if we're not in any sphere, stop scanning to save battery
      if (presentSomewhere === false) {
        BatterySavingUtil.startBatterySaving(true);
      }

      this.store.dispatch({type: 'SET_SPHERE_STATE', sphereId: sphereId, data: {reachable: false, present: false}});
    }
  }

  _enterRoom(data) {
    LOG.info('LocationHandler: USER_ENTER_LOCATION.', data);
    let sphereId = data.region;
    let locationId = data.location;
    let state = this.store.getState();
    if (sphereId && locationId) {
      // remove user from all locations except the locationId, if we are in the location ID, don't trigger anything
      let presentAtProvidedLocationId = this._removeUserFromRooms(state, sphereId, state.user.userId, locationId);

      // if we are in the location ID, don't trigger anything
      if (presentAtProvidedLocationId === true) {
        return;
      }

      this.store.dispatch({type: 'USER_ENTER_LOCATION', sphereId: sphereId, locationId: locationId, data: {userId: state.user.userId}});

      // used for clearing the timeouts for this room and toggling stones in this room
      LOG.info('RoomTracker: Enter room: ', locationId, ' in sphere: ', sphereId);
      this._triggerRoomEvent(this.store, sphereId, locationId, BEHAVIOUR_TYPES.ROOM_ENTER);
    }
  }

  _exitRoom(data) {
    LOG.info('LocationHandler: USER_EXIT_LOCATION.', data);
    let sphereId = data.region;
    let locationId = data.location;
    let state = this.store.getState();
    if (sphereId && locationId) {
      this.store.dispatch({type: 'USER_EXIT_LOCATION', sphereId: sphereId, locationId: locationId, data: {userId: state.user.userId}});

      // used for clearing the timeouts for this room
      LOG.info('RoomTracker: Exit room: ', locationId, ' in sphere: ', sphereId);
      this._triggerRoomEvent(this.store, sphereId, locationId, BEHAVIOUR_TYPES.ROOM_EXIT);
    }
  }


  _removeUserFromAllRooms(state, userId, exceptionRoomId = null) {
    let sphereIds = Object.keys(state.spheres);
    sphereIds.forEach((sphereId) => {
      this._removeUserFromRooms(state,sphereId,userId,exceptionRoomId);
    })
  }

  /**
   * @param state
   * @param sphereId
   * @param userId
   * @param exceptionRoomId   | The exception is a room that this method does not have to take the user out of.
   * @returns {boolean}
   * @private
   */
  _removeUserFromRooms(state, sphereId, userId, exceptionRoomId = null) {
    let presentAtProvidedLocationId = false;

    // check if the user is in another location:
    let locationIds = Object.keys(state.spheres[sphereId].locations);
    for (let i = 0; i < locationIds.length; i++) {
      let location = state.spheres[sphereId].locations[locationIds[i]];

      // check if user is in a room:
      if (location.presentUsers.indexOf(userId) !== -1) {
        if (locationIds[i] === exceptionRoomId) {
          // if this room is the exception, do not take the user out and return true at the end of the method.
          presentAtProvidedLocationId = true;
        }
        else {
          this._exitRoom({region: sphereId, location: locationIds[i]});
        }
      }
    }

    return presentAtProvidedLocationId;
  }

  /**
   * Clean up and cancel pending actions for this room, fire the enter/exit event
   * @param store
   * @param sphereId
   * @param locationId
   * @param behaviourType
   * @param [ bleController ]
   * @private
   */
  _triggerRoomEvent( store, sphereId, locationId, behaviourType, bleController?) {
    // fire BEHAVIOUR_TYPES.ROOM_ENTER on crownstones in room
    BehaviourUtil.enactBehaviourInLocation(store, sphereId, locationId, behaviourType, bleController);
  }


  applySphereStateFromStore() {
    LOG.info("LocationHandler: Apply the sphere state from the store.");
    let state = this.store.getState();

    let lastSeenPerSphere = {};
    Util.data.callOnAllStones(state, (sphereId, stoneId, stone) => {
      lastSeenPerSphere[sphereId] = Math.max(stone.config.lastSeen || 0, lastSeenPerSphere[sphereId] || 0);
    });

    let sphereIds = Object.keys(lastSeenPerSphere);
    let currentSphere = null;
    let mostRecentSeenTime = 0;
    for (let i = 0; i < sphereIds.length; i++) {
      if (lastSeenPerSphere[sphereIds[i]] > mostRecentSeenTime) {
        currentSphere = sphereIds[i];
        mostRecentSeenTime = lastSeenPerSphere[sphereIds[i]];
      }
    }

    if (currentSphere === null) {
      return;
    }

    // we reduce this amount by 1 times the keep-alive interval. This is done to account for possible lossy keepalives.
    let sphereTimeout = state.spheres[currentSphere].config.exitDelay - KEEPALIVE_INTERVAL;
    if (mostRecentSeenTime > (new Date().valueOf() - sphereTimeout)) {
      LOG.info("LocationHandler: Apply enter sphere.", currentSphere);
      this.enterSphere(currentSphere);
    }
    else {
      // exit all spheres
      Object.keys(state.spheres).forEach((sphereId) => {
        LOG.info("LocationHandler: Apply exit sphere.", sphereId);
        this.exitSphere(sphereId);
      });
    }
  }


  loadFingerprints() {
    LOG.info("LocationHandler: loadFingerprints.");
    BluenetPromiseWrapper.isReady()
      .then(() => {
        return BluenetPromiseWrapper.clearFingerprintsPromise();
      })
      .then(() => {
        // register the iBeacons UUIDs with the localization system.
        const state = this.store.getState();
        let sphereIds = Object.keys(state.spheres);
        let showRemoveFingerprintNotification : boolean = false;
        let actions = [];

        sphereIds.forEach((sphereId) => {
          let sphereIBeaconUUID = state.spheres[sphereId].config.iBeaconUUID;

          LOG.info('LocalizationUtil: Setup tracking for iBeacon UUID: ', sphereIBeaconUUID, ' with sphereId:', sphereId);

          let locations = state.spheres[sphereId].locations;
          let locationIds = Object.keys(locations);
          locationIds.forEach((locationId) => {
            if (locations[locationId].config.fingerprintRaw) {
              // check format of the fingerprint:
              LOG.info('LocalizationUtil: Checking fingerprint format for: ', locationId, ' in sphere: ', sphereId);
              if (validateFingerprint(locations[locationId].config.fingerprintRaw)) {
                LOG.info('LocalizationUtil: Loading fingerprint for: ', locationId, ' in sphere: ', sphereId);
                Bluenet.loadFingerprint(sphereId, locationId, locations[locationId].config.fingerprintRaw);
              }
              else {
                showRemoveFingerprintNotification = true;
                actions.push({type: 'REMOVE_LOCATION_FINGERPRINT', sphereId: sphereId, locationId: locationId})
              }
            }
          });
        });

        if (showRemoveFingerprintNotification) { //  === true
          if (actions.length > 0) {
            this.store.batchDispatch(actions);
          }

          Alert.alert(
            'Please forgive me :(',
            'Due to many improvements in the localization you will have to train your rooms again...',
            [{text:'OK'}]
          );
        }
      })
      .catch((err) => {})
  }

  /**
   * clear all beacons and re-register them. This will not re-emit roomEnter/exit if we are in the same room.
   */
  trackSpheres() {
    LOG.info("LocationHandler: Track Spheres called.");
    BluenetPromiseWrapper.isReady()
      .then(() => {
        return BluenetPromiseWrapper.clearTrackedBeacons();
      })
      .then(() => {
        // register the iBeacons UUIDs with the localization system.
        const state = this.store.getState();
        let sphereIds = Object.keys(state.spheres);

        sphereIds.forEach((sphereId) => {
          let sphereIBeaconUUID = state.spheres[sphereId].config.iBeaconUUID;

          // track the sphere beacon UUID
          Bluenet.trackIBeacon(sphereIBeaconUUID, sphereId);
          LOG.info("LocationHandler: Setup tracking for iBeacon UUID: ", sphereIBeaconUUID);

        });
      })
      .catch((err) => {})
  }

  initializeTracking() {
    this.trackSpheres();
    this.loadFingerprints();
  }
}



/**
 * Use this method to catch any case where the fingerprint would be incorrect due to bugs or old formats.
 *
 * @param fingerprintRaw
 * @returns {boolean}
 */
function validateFingerprint(fingerprintRaw) {
  let fingerprint = JSON.parse(fingerprintRaw);
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

export const LocationHandler = new LocationHandlerClass();

