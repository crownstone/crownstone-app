import { BluenetPromiseWrapper, NativeBus } from './Proxy';
import { Bluenet  }                         from './Bluenet';
import { BehaviourUtil } from '../util/BehaviourUtil';
import { KeepAliveHandler } from './KeepAliveHandler';
import { StoneTracker } from './StoneTracker';
import { canUseIndoorLocalizationInSphere, clearRSSIs, disableStones } from '../util/DataUtil';
import { Scheduler } from './../logic/Scheduler';;
import { LOG } from '../logging/Log';
import { Util } from '../util/Util';
import { ENCRYPTION_ENABLED, KEEPALIVE_INTERVAL } from '../ExternalConfig';
import { TYPES } from '../router/store/reducers/stones';
import { StoneStateHandler } from "./StoneStateHandler";

class LocationHandlerClass {
  _initialized : boolean;
  store : any;
  tracker : any;
  _uuid : string;

  constructor() {
    this._initialized = false;
    this.store = undefined;
    this.tracker = undefined;

    this._uuid = Util.getUUID();
  }

  loadStore(store) {
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
    })
  }

  enterSphere(sphereId) {
    let state = this.store.getState();
    let sphere = state.spheres[sphereId];
    // make sure we only do this once per sphere
    if (sphere && sphere.config && sphere.config.present === true) {
      LOG.info("LocationHandler: IGNORE ENTER SPHERE because I'm already in the sphere.");
      return;
    }

    if (sphere !== undefined) {
      LOG.info("LocationHandler: ENTER SPHERE", sphereId);

      BluenetPromiseWrapper.requestLocation()
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

      let lastTimePresent = sphere.config.lastTimePresent;

      // set the presence
      this.store.dispatch({type: 'SET_SPHERE_STATE', sphereId: sphereId, data: {reachable: true, present: true}});

      // after 10 seconds, start the keep alive run. This gives the app some time for syncing etc.
      Scheduler.scheduleCallback(() => {
        KeepAliveHandler.fireTrigger();
      }, 10000, 'keepAlive');

      // prepare the settings for this sphere and pass them onto bluenet
      let bluenetSettings = {
        encryptionEnabled: ENCRYPTION_ENABLED,
        adminKey:  sphere.config.adminKey,
        memberKey: sphere.config.memberKey,
        guestKey:  sphere.config.guestKey,
        referenceId: sphereId
      };

      if (canUseIndoorLocalizationInSphere(state, sphereId) === true) {
        LOG.info("LocationHandler: Starting indoor localization for sphere", sphereId);
        Bluenet.startIndoorLocalization();
      }
      else {
        LOG.info("LocationHandler: Stopping indoor localization for sphere", sphereId, "due to missing fingerprints or not enough Crownstones.");
        Bluenet.stopIndoorLocalization();
      }

      // scan for crownstones on entering a sphere.
      Bluenet.startScanningForCrownstonesUniqueOnly();


      LOG.info("Set Settings.", bluenetSettings);
      BluenetPromiseWrapper.setSettings(bluenetSettings)
        .then(() => {
          let exitEnterTimeDifference = new Date().valueOf() - lastTimePresent;
          if (exitEnterTimeDifference > KEEPALIVE_INTERVAL*1000*1.5) {
            // trigger crownstones on enter sphere
            LOG.info("LocationHandler: TRIGGER ENTER HOME EVENT FOR SPHERE", sphere.config.name);
            BehaviourUtil.enactBehaviourInSphere(this.store, sphereId, TYPES.HOME_ENTER);
          }
          else {
            LOG.info("LocationHandler: DO NOT TRIGGER ENTER HOME EVENT SINCE TIME SINCE HOME EXIT IS ", exitEnterTimeDifference, " WHICH IS LESS THAN KEEPALIVE_INTERVAL*1000*1.5 = ", KEEPALIVE_INTERVAL*1000*1.5, " ms");
          }
        })
    }
  }


  /**
   * Reset will clear the last time present from the check. This will cause the enter sphere event to work as it should.
   * @param sphereId
   * @param reset
   */
  exitSphere(sphereId, reset = false) {
    LOG.info("LocationHandler: LEAVING SPHERE", sphereId);
    // make sure we only leave a sphere once. It can happen that the disable timeout fires before the exit region in the app.
    let state = this.store.getState();

    if (state.spheres[sphereId].config.present === true) {

      // remove user from all rooms
      this._removeUserFromRooms(state, sphereId, state.user.userId);

      // clear all rssi's
      clearRSSIs(this.store, sphereId);

      // disable all crownstones
      disableStones(this.store, sphereId);

      // check if you are present in any sphere. If not, stop scanning.
      let presentSomewhere = false;
      Object.keys(state.spheres).forEach((checkSphereId) => {
        if (state.spheres[checkSphereId].config.present === true && checkSphereId !== sphereId) {
          presentSomewhere = true;
        }
      });

      // if we're not in any sphere, stop scanning to save battery
      if (presentSomewhere === false) {
        Bluenet.stopScanning();
      }

      this.store.dispatch({type: 'SET_SPHERE_STATE', sphereId: sphereId, data: {reachable: false, present: false, lastTimePresent: reset === true ? 1 : undefined}});
    }
  }

  _enterRoom(data) {
    LOG.info("LocationHandler: USER_ENTER_LOCATION.", data);
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
      LOG.info("RoomTracker: Enter room: ", locationId, ' in sphere: ', sphereId);
      this._triggerRoomEvent(this.store, sphereId, locationId, TYPES.ROOM_ENTER);
    }
  }

  _exitRoom(data) {
    LOG.info("LocationHandler: USER_EXIT_LOCATION.", data);
    let sphereId = data.region;
    let locationId = data.location;
    let state = this.store.getState();
    if (sphereId && locationId) {
      this.store.dispatch({type: 'USER_EXIT_LOCATION', sphereId: sphereId, locationId: locationId, data: {userId: state.user.userId}});

      // used for clearing the timeouts for this room
      LOG.info("RoomTracker: Exit room: ", locationId, ' in sphere: ', sphereId);
      this._triggerRoomEvent(this.store, sphereId, locationId, TYPES.ROOM_EXIT);
    }
  }


  /**
   *
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
    // fire TYPES.ROOM_ENTER on crownstones in room
    BehaviourUtil.enactBehaviourInLocation(store, sphereId, locationId, behaviourType, bleController);
  }

}


export const LocationHandler = new LocationHandlerClass();

