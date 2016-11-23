import { Bluenet, BleActions, NativeBus } from './Proxy';
import { BleUtil } from './BleUtil';
import { KeepAliveHandler } from './KeepAliveHandler';
import { StoneTracker } from './StoneTracker'
import { RoomTracker } from './RoomTracker'
import { sphereRequiresFingerprints } from './../util/dataUtil'
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
      NativeBus.on(NativeBus.topics.enterSphere, (sphereId) => {this.enterSphere(sphereId);});
      NativeBus.on(NativeBus.topics.exitSphere,  (sphereId) => {this.exitSphere(sphereId);});
      NativeBus.on(NativeBus.topics.enterRoom,   (data)     => {this._enterRoom(data);}); // data = {region: sphereId, location: locationId}
      NativeBus.on(NativeBus.topics.exitRoom,    (data)     => {this._exitRoom(data);});  // data = {region: sphereId, location: locationId}
      NativeBus.on(NativeBus.topics.iBeaconAdvertisement, this._iBeaconAdvertisement.bind(this));
    }
  }

  _iBeaconAdvertisement(data) {
    data.forEach((iBeaconPackage) => {
      // LOGDebug("iBeaconPackage",iBeaconPackage);
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

      KeepAliveHandler.keepAlive();

      // trigger crownstones on enter sphere
      this._triggerCrownstones(state, sphereId, TYPES.HOME_ENTER);

      // start high frequency scan when entering a sphere.
      BleUtil.startHighFrequencyScanning(this._uuid, 5000);

      // prepare the settings for this sphere and pass them onto bluenet
      let bluenetSettings = {
        encryptionEnabled: ENCRYPTION_ENABLED,
        adminKey : state.spheres[sphereId].config.adminKey,
        memberKey: state.spheres[sphereId].config.memberKey,
        guestKey : state.spheres[sphereId].config.guestKey,
        referenceId : sphereId
      };

      let moreFingerprintsNeeded = sphereRequiresFingerprints(state, sphereId);

      if (moreFingerprintsNeeded === false) {
        LOGDebug("Starting indoor localization for sphere", sphereId);
        Bluenet.startIndoorLocalization();
      }
      else {
        LOGDebug("Stopping indoor localization for sphere", sphereId, "due to missing fingerprints.");
        Bluenet.stopIndoorLocalization();
      }


      LOG("Set Settings.", bluenetSettings);
      return BleActions.setSettings(bluenetSettings)
        .then(() => {
          LOG("Setting Active Sphere");
          let sphereActions = [];
          let stoneIds = Object.keys(state.spheres[sphereId].stones);
          stoneIds.forEach((stoneId) => {
            sphereActions.push({type: 'UPDATE_STONE_DISABILITY', stoneId: stoneId, data:{ disabled: true }});
          });

          sphereActions.push({type: 'SET_SPHERE_STATE', sphereId: sphereId, data:{reachable: true, present: true}});
          this.store.batchDispatch(sphereActions);
        }).catch()
    }
  }

  exitSphere(sphereId) {
    LOG("LEAVING SPHERE", sphereId);
    // make sure we only leave a sphere once. It can happen that the disable timeout fires before the exit region in the app.
    let state = this.store.getState();
    if (state.spheres[sphereId].config.present === true) {
      Bluenet.forceClearActiveRegion();
      this.store.dispatch({type: 'SET_SPHERE_STATE', sphereId: sphereId, data: {reachable: false, present: false}});
    }
  }

  _enterRoom(data) {
    LOG("USER_ENTER_LOCATION.", data);
    let sphereId = data.region;
    let locationId = data.location;
    let state = this.store.getState();
    if (sphereId && locationId) {
      // check if the user is in another location:
      let locationIds = state.spheres[sphereId].locations;
      for (let i = 0; i < locationIds.length; i++) {
        // do not remove and put back in the same room
        if (locationIds[i] !== locationId) {
          let location = state.spheres[sphereId].locations[locationIds[i]];
          if (location.presentUsers.indexOf(state.user.userId) !== -1) {
            this._exitRoom({region: sphereId, location: locationIds[i]});
          }
        }
        else {
          // if we are already in the room, do not do anything
          return;
        }
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


  _triggerCrownstones(state, sphereId, type) {
    let sphere = state.spheres[sphereId];
    let stoneIds = Object.keys(sphere.stones);
    stoneIds.forEach((stoneId) => {
      // for each stone in sphere select the behaviour we want to copy into the keep Alive
      let stone = sphere.stones[stoneId];
      let element = this._getElement(sphere, stone);
      let behaviour = element.behaviour[type];

      if (behaviour.active && stone.config.handle && behaviour.state !== stone.state.state) {
        // if we need to switch:
        let data = {state: behaviour.state};
        if (behaviour.state === 0) {
          data.currentUsage = 0;
        }
        LOGBle("FIRING ", type, " event for ", element.config.name, stoneId);
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

