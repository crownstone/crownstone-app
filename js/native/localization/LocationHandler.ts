import { Languages } from "../../Languages";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocationHandler", key)(a,b,c,d,e);
}

import { Alert }                    from 'react-native';

import { BluenetPromiseWrapper }    from '../libInterface/BluenetPromise';
import { Bluenet  }                 from '../libInterface/Bluenet';
import { LOG, LOGe } from '../../logging/Log';
import { BatterySavingUtil } from '../../util/BatterySavingUtil';
import {FingerprintManager} from "./FingerprintManager";
import { SphereUtil } from "../../util/SphereUtil";
import { core } from "../../core";
import { Permissions } from "../../backgroundProcesses/PermissionManager";
import { canUseIndoorLocalizationInSphere } from "../../util/DataUtil";

class LocationHandlerClass {
  _initialized : boolean;
  _readyForLocalization = false;

  _unsubscribeLocationEvents = [];



  constructor() {
    this._initialized = false;

    // subscribe to iBeacons when the spheres in the cloud change.
    core.eventBus.on('CloudSyncComplete_spheresChanged', () => {
      if (this._readyForLocalization) {
        LocationHandler.initializeTracking();
      }
    });

    // when a sphere is created, we track all spheres anew.
    core.eventBus.on('userLoggedInFinished', () => { this._readyForLocalization = true; });
    core.eventBus.on('sphereCreated', () => {
      if (this._readyForLocalization) {
        LocationHandler.initializeTracking();
      }
    });


    core.eventBus.on("reloadTracking", () => {
      this.reloadFingerprintTracking();
    })
  }

  init() {
    LOG.info('LocationHandler: LOADED STORE LocationHandler', this._initialized);
    if (this._initialized === false) {
      this._initialized = true;

      // core.nativeBus.on(core.nativeBus.topics.currentRoom, (data) => {LOGd.info('CURRENT ROOM', data)});
      this._unsubscribeLocationEvents.push(core.nativeBus.on(core.nativeBus.topics.enterSphere, (sphereId) => { this.enterSphere(sphereId); }));
      this._unsubscribeLocationEvents.push(core.nativeBus.on(core.nativeBus.topics.exitSphere,  (sphereId) => { this.exitSphere(sphereId); }));
      this._unsubscribeLocationEvents.push(core.nativeBus.on(core.nativeBus.topics.enterRoom,   (data)     => { this._enterRoom(data); })); // data = {region: sphereId, location: locationId}
      this._unsubscribeLocationEvents.push(core.nativeBus.on(core.nativeBus.topics.exitRoom,    (data)     => { this._exitRoom(data); })); // data = {region: sphereId, location: locationId}
    }
  }

  destroy() {
    this._unsubscribeLocationEvents.forEach((unsub) => { unsub(); });
  }


  enterSphere(enteringSphereId) {
    let state = core.store.getState();
    let sphere = state.spheres[enteringSphereId];

    if (!sphere) {
      LOGe.info('LocationHandler: Received enter sphere for a sphere that we shouldn\'t be tracking...');
      return;
    }

    // We load the settings and start the localization regardless if we are already in the sphere. The calls themselves
    // are cheap and it could be that the lib has restarted: losing it's state. This will make sure we will always have the
    // right settings in the lib.

    if (canUseIndoorLocalizationInSphere(state, enteringSphereId) === true) {
      LOG.info('LocationHandler: Starting indoor localization for sphere', enteringSphereId);
      Bluenet.startIndoorLocalization();
    }
    else {
      LOG.info('LocationHandler: Stopping indoor localization for sphere', enteringSphereId, 'due to missing fingerprints or not enough Crownstones.');
      Bluenet.stopIndoorLocalization();
    }

    // scan for crownstones on entering a sphere.
    BatterySavingUtil.startNormalUsage(enteringSphereId);

    // get the time last seen of the crownstones in this sphere
    let timeLastSeen  = SphereUtil.getTimeLastSeenInSphere(state, enteringSphereId);
    let sphereTimeout = 5*60*1000; // 5 minutes.
    let timeSinceLastCrownstoneWasSeen = new Date().valueOf() - timeLastSeen;
    let sphereHasTimedOut = timeSinceLastCrownstoneWasSeen > sphereTimeout;

    // make sure we only do the following once per sphere
    if (sphere && sphere.state && sphere.state.present === true && sphereHasTimedOut === false) {
      LOG.info('LocationHandler: IGNORE ENTER SPHERE because I\'m already in the Sphere.');

      // The call on our own eventbus is different from the native bus because enterSphere can be called by fallback mechanisms.
      core.eventBus.emit('enterSphere', enteringSphereId);

      return;
    }

    // update location of the sphere, start the keepAlive and check if we have to perform an enter sphere behaviour trigger.
    LOG.info('LocationHandler: ENTER SPHERE', enteringSphereId);

    if (sphere.config.latitude && sphere.config.longitude || Permissions.inSphere(enteringSphereId).canSetSphereLocation == false) {
      // do not request new position.
    }
    else {
      BluenetPromiseWrapper.requestLocation()
        .catch((err) => {
          LOGe.info('LocationHandler: Could not get GPS Location when entering a sphere: ', err);
        })
        .then((location) => {
          if (location && location.latitude && location.longitude) {
            if (sphere.config.latitude && sphere.config.longitude) {
              let dx = location.latitude  - sphere.config.latitude;
              let dy = location.longitude - sphere.config.longitude;
              let distance = Math.sqrt(dx*dx + dy*dy);
              if (distance > 0.4) {
                LOG.info('LocationHandler: Update sphere location, old: (', sphere.config.latitude, ',', sphere.config.longitude,') to new: (', location.latitude, ',', location.longitude,')');
                core.store.dispatch({type: 'SET_SPHERE_GPS_COORDINATES', sphereId: enteringSphereId, data: {latitude: location.latitude, longitude: location.longitude}});
              }
            }
            else {
              LOG.info('LocationHandler: Setting sphere location to (', location.latitude, ',', location.longitude,')');
              core.store.dispatch({type: 'SET_SPHERE_GPS_COORDINATES', sphereId: enteringSphereId, data: {latitude: location.latitude, longitude: location.longitude}});
            }
          }
        })
        .catch((err) => {});
    }

    // set the presence
    core.store.dispatch({type: 'SET_SPHERE_STATE', sphereId: enteringSphereId, data: {reachable: true, present: true}});



    if (sphereHasTimedOut) {
      // trigger crownstones on enter sphere
    }
    else {
      LOG.info('LocationHandler: DO NOT TRIGGER ENTER HOME EVENT SINCE TIME SINCE LAST SEEN STONE IS ', timeSinceLastCrownstoneWasSeen);
    }

    // The call on our own eventbus is different from the native bus because enterSphere can be called by fallback mechanisms.
    core.eventBus.emit('enterSphere', enteringSphereId);
  }


  /**
   * Reset will clear the last time present from the check. This will cause the enter sphere event to work as it should.
   * @param sphereId
   */
  exitSphere(sphereId) {
    LOG.info('LocationHandler: LEAVING SPHERE', sphereId);
    // make sure we only leave a sphere once. It can happen that the disable timeout fires before the exit region in the app.
    let state = core.store.getState();

    if (state.spheres[sphereId] && state.spheres[sphereId].state.present === true) {
      LOG.info('Applying EXIT SPHERE');
      // remove user from all rooms
      this._removeUserFromRooms(state, sphereId, state.user.userId);

      // check if you are present in any sphere. If not, stop scanning (BLE, not iBeacon).
      let presentSomewhere = false;
      Object.keys(state.spheres).forEach((checkSphereId) => {
        if (state.spheres[checkSphereId].state.present === true && checkSphereId !== sphereId) {
          presentSomewhere = true;
        }
      });

      // if we're not in any sphere, stop scanning to save battery
      if (presentSomewhere === false) {
        BatterySavingUtil.startBatterySaving(true);
      }

      core.store.dispatch({type: 'SET_SPHERE_STATE', sphereId: sphereId, data: {reachable: false, present: false}});

      core.eventBus.emit('exitSphere', sphereId);
    }
  }

  _enterRoom(data : locationDataContainer) {
    LOG.info('LocationHandler: USER_ENTER_LOCATION.', data);
    let sphereId = data.region;
    let locationId = data.location;
    let state = core.store.getState();

    if (state.app.indoorLocalizationEnabled === false) { return };

    if (sphereId && locationId) {
      // remove user from all locations except the locationId, if we are in the location ID, don't trigger anything
      let presentAtProvidedLocationId = this._removeUserFromRooms(state, sphereId, state.user.userId, locationId);

      // if we are in the location ID, don't trigger anything
      if (presentAtProvidedLocationId === true) {
        return;
      }

      core.store.dispatch({type: 'USER_ENTER_LOCATION', sphereId: sphereId, locationId: locationId, data: {userId: state.user.userId}});
      // used for clearing the timeouts for this room and toggling stones in this room
      LOG.info('RoomTracker: Enter room: ', locationId, ' in sphere: ', sphereId);
    }
  }

  _exitRoom(data : locationDataContainer) {
    LOG.info('LocationHandler: USER_EXIT_LOCATION.', data);

    let sphereId = data.region;
    let locationId = data.location;
    let state = core.store.getState();

    if (state.app.indoorLocalizationEnabled === false) { return };

    if (sphereId && locationId) {
      core.store.dispatch({type: 'USER_EXIT_LOCATION', sphereId: sphereId, locationId: locationId, data: {userId: state.user.userId}});
      // used for clearing the timeouts for this room
      LOG.info('RoomTracker: Exit room: ', locationId, ' in sphere: ', sphereId);
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
   * This method recovers the location state from the store. This is important to avoid double firing of the enter sphere event.
   */
  applySphereStateFromStore() {
    LOG.info("LocationHandler: Apply the sphere state from the store.");
    let state = core.store.getState();

    let sphereIds = Object.keys(state.spheres);
    let now = new Date().valueOf();
    sphereIds.forEach((sphereId) => {
      let sphereTimeout = 1000*(state.spheres[sphereId].config.exitDelay);
      if (SphereUtil.getTimeLastSeenInSphere(state, sphereId) > (now - sphereTimeout)) {
        this.enterSphere(sphereId);
      }
      else {
        this.exitSphere(sphereId)
      }
    })
  }


  loadFingerprints() {
    LOG.info("LocationHandler: loadFingerprints.");
    BluenetPromiseWrapper.isReady()
      .then(() => {
        return BluenetPromiseWrapper.clearFingerprintsPromise();
      })
      .then(() => {
        // register the iBeacons UUIDs with the localization system.
        const state = core.store.getState();
        let sphereIds = Object.keys(state.spheres);
        let showRemoveFingerprintNotification : boolean = false;
        let actions = [];

        sphereIds.forEach((sphereId) => {
          let sphereIBeaconUUID = state.spheres[sphereId].config.iBeaconUUID;

          LOG.info('LocationHandler: Setup tracking for iBeacon UUID: ', sphereIBeaconUUID, ' with sphereId:', sphereId);

          let locations = state.spheres[sphereId].locations;
          let locationIds = Object.keys(locations);
          locationIds.forEach((locationId) => {
            if (locations[locationId].config.fingerprintRaw) {
              // check format of the fingerprint:
              LOG.info('LocationHandler: Checking fingerprint format for: ', locationId, ' in sphere: ', sphereId);
              if (FingerprintManager.validateFingerprint(locations[locationId].config.fingerprintRaw)) {
                let activeFingerprint = locations[locationId].config.fingerprintRaw;
                if (FingerprintManager.shouldTransformFingerprint(activeFingerprint)) {
                  LOG.info('LocationHandler: Transforming fingerprint format for: ', locationId, ' in sphere: ', sphereId);
                  activeFingerprint = FingerprintManager.transformFingerprint(activeFingerprint);
                  core.store.dispatch({
                    type: 'UPDATE_NEW_LOCATION_FINGERPRINT',
                    sphereId: sphereId,
                    locationId: locationId,
                    data: { fingerprintRaw: activeFingerprint }
                  });
                }

                LOG.info('LocationHandler: Loading fingerprint for: ', locationId, ' in sphere: ', sphereId);
                Bluenet.loadFingerprint(sphereId, locationId, activeFingerprint);
              }
              else {
                showRemoveFingerprintNotification = true;
                actions.push({type: 'REMOVE_LOCATION_FINGERPRINT', sphereId: sphereId, locationId: locationId});
              }
            }
          });
        });

        if (showRemoveFingerprintNotification) { //  === true
          if (actions.length > 0) {
            core.store.batchDispatch(actions);
          }

          Alert.alert(
            lang("Please_forgive_me___"),
            lang("Due_to_many_improvements_"),
            [{text:lang("OK")}]
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
        Bluenet.requestLocationPermission();
        return BluenetPromiseWrapper.clearTrackedBeacons();
      })
      .then(() => {
        // register the iBeacons UUIDs with the localization system.
        const state = core.store.getState();
        let sphereIds = Object.keys(state.spheres);

        sphereIds.forEach((sphereId) => {
          let sphereIBeaconUUID = state.spheres[sphereId].config.iBeaconUUID;

          // track the sphere beacon UUID
          Bluenet.trackIBeacon(sphereIBeaconUUID, sphereId);

        });
      })
      .catch((err) => { LOGe.info("Tracking Spheres Failed", err); })
  }

  initializeTracking() {
    this.trackSpheres();
    this.reloadFingerprintTracking();
  }


  reloadFingerprintTracking() {
    this.loadFingerprints();
    Bluenet.startIndoorLocalization();
  }


}


export const LocationHandler = new LocationHandlerClass();