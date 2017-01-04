import { Bluenet, BleActions, NativeBus } from './Proxy';
import { BleUtil } from './BleUtil';
import { KeepAliveHandler } from './KeepAliveHandler';
import { StoneTracker } from './StoneTracker'
import { RoomTracker } from './RoomTracker'
import { canUseIndoorLocalizationInSphere, clearRSSIs, disableStones } from './../util/dataUtil'
import { Scheduler } from './../logic/Scheduler';
import { LOG, LOGDebug, LOGError, LOGBle } from '../logging/Log'
import { getUUID } from '../util/util'
import { ENCRYPTION_ENABLED } from '../ExternalConfig'
import { TYPES } from '../router/store/reducers/stones'

class LocationHandlerClass {
  constructor() {
    this._initialized = false;
    this.store = undefined;
    this.tracker = undefined;

    this._uuid = getUUID();
  }

  loadStore(store) {
    LOG('LOADED STORE LocationHandler', this._initialized);
    if (this._initialized === false) {
      this._initialized = true;
      this.store = store;
      this.tracker = new StoneTracker(store);


      // NativeBus.on(NativeBus.topics.currentRoom, (data) => {LOGDebug('CURRENT ROOM', data)});
      NativeBus.on(NativeBus.topics.enterSphere, (sphereId) => { this.enterSphere(sphereId); });
      NativeBus.on(NativeBus.topics.exitSphere,  (sphereId) => { this.exitSphere(sphereId); });
      NativeBus.on(NativeBus.topics.enterRoom,   (data)     => { this._enterRoom(data); }); // data = {region: sphereId, location: locationId}
      NativeBus.on(NativeBus.topics.exitRoom,    (data)     => { this._exitRoom(data); });  // data = {region: sphereId, location: locationId}
      NativeBus.on(NativeBus.topics.iBeaconAdvertisement, (data) => { this._iBeaconAdvertisement(data) });
    }
  }

  _iBeaconAdvertisement(data) {
    data.forEach((iBeaconPackage) => {
      this.tracker.iBeaconUpdate(iBeaconPackage.major, iBeaconPackage.minor, iBeaconPackage.rssi, iBeaconPackage.referenceId);
    })
  }

  enterSphere(sphereId) {
    let state = this.store.getState();
    // make sure we only do this once per sphere
    if (state.spheres[sphereId].config.present === true)
      return;

    if (state.spheres[sphereId] !== undefined) {
      LOG("ENTER SPHERE", sphereId);

      // set the presence
      this.store.dispatch({type: 'SET_SPHERE_STATE', sphereId: sphereId, data:{reachable: true, present: true}});

      // after 10 seconds, start the keepalive run. This gives the app some time for syncing etc.
      Scheduler.scheduleCallback(() => {KeepAliveHandler.fireTrigger();}, 10000, 'keepAlive');

      // trigger crownstones on enter sphere
      LOG("TRIGGER ENTER HOME EVENT FOR SPHERE", state.spheres[sphereId].config.name);
      this._triggerCrownstones(state, sphereId, TYPES.HOME_ENTER);

      // prepare the settings for this sphere and pass them onto bluenet
      let bluenetSettings = {
        encryptionEnabled: ENCRYPTION_ENABLED,
        adminKey : state.spheres[sphereId].config.adminKey,
        memberKey: state.spheres[sphereId].config.memberKey,
        guestKey : state.spheres[sphereId].config.guestKey,
        referenceId : sphereId
      };

      let canUseLocalization = canUseIndoorLocalizationInSphere(state, sphereId);

      if (canUseLocalization === true) {
        LOG("Starting indoor localization for sphere", sphereId);
        Bluenet.startIndoorLocalization();
      }
      else {
        LOG("Stopping indoor localization for sphere", sphereId, "due to missing fingerprints.");
        Bluenet.stopIndoorLocalization();
      }


      LOG("Set Settings.", bluenetSettings);
      return BleActions.setSettings(bluenetSettings);
    }
  }

  exitSphere(sphereId) {
    LOG("LEAVING SPHERE", sphereId);
    // make sure we only leave a sphere once. It can happen that the disable timeout fires before the exit region in the app.
    let state = this.store.getState();
    if (state.spheres[sphereId].config.present === true) {

      // remove user from all rooms
      this._removeUserFromRooms(state, sphereId, state.user.userId);

      // clear all rssi's
      clearRSSIs(this.store, sphereId);

      // disable all crownstones
      disableStones(this.store, sphereId);

      this.store.dispatch({type: 'SET_SPHERE_STATE', sphereId: sphereId, data: {reachable: false, present: false}});
    }
  }

  _enterRoom(data) {
    LOG("USER_ENTER_LOCATION.", data);
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
      RoomTracker.enterRoom(this.store, sphereId, locationId);
    }
  }

  _exitRoom(data) {
    LOG("USER_EXIT_LOCATION.", data);
    let sphereId = data.region;
    let locationId = data.location;
    let state = this.store.getState();
    if (sphereId && locationId) {
      this.store.dispatch({type: 'USER_EXIT_LOCATION', sphereId: sphereId, locationId: locationId, data: {userId: state.user.userId}});

      // used for clearing the timeouts for this room
      if (state.user.betaAccess) {
        RoomTracker.exitRoom(this.store, sphereId, locationId);
      }
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


  _triggerCrownstones(state, sphereId, type) {
    let sphere = state.spheres[sphereId];
    let stoneIds = Object.keys(sphere.stones);
    stoneIds.forEach((stoneId) => {
      // for each stone in sphere select the behaviour we want to copy into the keep Alive
      let stone = sphere.stones[stoneId];
      let element = this._getElement(sphere, stone);
      let behaviour = element.behaviour[type];
      // we set the state regardless of the current state since it may not be correct in the background.
      if (behaviour.active && stone.config.handle) {
        // if we need to switch:
        let data = {state: behaviour.state};
        if (behaviour.state === 0) {
          data.currentUsage = 0;
        }
        LOG("FIRING ", type, " event for ", element.config.name, stoneId);
        let proxy = BleUtil.getProxy(stone.config.handle);
        proxy.perform(BleActions.setSwitchState, behaviour.state)
          .then(() => {
            this.store.dispatch({
              type: 'UPDATE_STONE_STATE',
              sphereId: sphereId,
              stoneId: stoneId,
              data: data
            });
          })
          .catch((err) => {
            LOGError("COULD NOT SET STATE FROM ROOM ENTER", err);
          })
      }
    });
  }

  // TODO: remove duplicates
  _getElement(sphere, stone) {
    if (stone.config.applianceId) {
      return sphere.appliances[stone.config.applianceId];
    }
    else {
      return stone;
    }
  }
}

export const LocationHandler = new LocationHandlerClass();

