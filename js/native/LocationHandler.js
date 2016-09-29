import { Bluenet, BleActions, NativeBus } from './Proxy';
import { LOG } from '../logging/Log'
import { ENCRYPTION_ENABLED } from '../ExternalConfig'


class LocationHandlerClass {
  constructor() {
    this.initialized = false;

    this.subscriptions = {};
    this.store = undefined;
  }

  loadStore(store) {
    LOG('LOADED STORE LocationHandler', this.initialized);
    if (this.initialized === false) {
      this.initialized = true;
      this.store = store;

      NativeBus.on(NativeBus.topics.enterSphere, this._enterSphere.bind(this));
      NativeBus.on(NativeBus.topics.exitSphere,  this._exitSphere.bind(this) );
      NativeBus.on(NativeBus.topics.enterRoom,   this._enterRoom.bind(this)  );
      NativeBus.on(NativeBus.topics.exitRoom,    this._exitRoom.bind(this)   );
    }
  }


  _enterSphere(sphereId) {
    let state = this.store.getState();
    LOG("ENTER SPHERE", sphereId);
    if (state.spheres[sphereId] !== undefined) {
      // prepare the settings for this sphere and pass them onto bluenet
      let bluenetSettings = {
        encryptionEnabled: ENCRYPTION_ENABLED,
        adminKey : state.spheres[sphereId].config.adminKey,
        memberKey: state.spheres[sphereId].config.memberKey,
        guestKey : state.spheres[sphereId].config.guestKey,
      };

      LOG("Set Settings.", bluenetSettings, state.spheres[sphereId]);
      return BleActions.setSettings(bluenetSettings)
        .then(() => {
          LOG("Setting Active Sphere")
          this.store.dispatch({type: 'SET_ACTIVE_SPHERE', data: {activeSphere: sphereId}});
        }).catch()
    }
  }

  _exitSphere(sphereId) {
    this.store.dispatch({type: 'CLEAR_ACTIVE_SPHERE'});
  }

  _enterRoom(locationId) {
    let state = this.store.getState();
    if (state.app.activeSphere && locationId) {
      this.store.dispatch({type: 'USER_ENTER', sphereId: state.app.activeSphere, locationId: locationId, userId: state.user.userId});
    }
  }

  _exitRoom(locationId) {
    let state = this.store.getState();
    if (state.app.activeSphere && locationId) {
      this.store.dispatch({type: 'USER_EXIT', sphereId: state.app.activeSphere, locationId: locationId, userId: state.user.userId});
    }
  }

}

export const LocationHandler = new LocationHandlerClass();

export const LocalizationUtil = {

  /**
   * clear all beacons and re-register them. This will not re-emit roomEnter/exit if we are in the same room.
   */
  trackSpheres: function (store) {
    BleActions.clearTrackedBeacons()
      .then(() => {
        // register the iBeacons UUIDs with the localization system.
        const state = store.getState();
        let sphereIds = Object.keys(state.spheres);
        sphereIds.forEach((sphereId) => {
          let sphereIBeaconUUID = state.spheres[sphereId].config.iBeaconUUID;

          // track the sphere beacon UUID
          Bluenet.trackIBeacon(sphereIBeaconUUID, sphereId);

          LOG("-------------- SETUP TRACKING FOR ", sphereIBeaconUUID);

          let locations = state.spheres[sphereId].locations;
          let locationIds = Object.keys(locations);
          locationIds.forEach((locationId) => {
            if (locations[locationId].config.fingerprintRaw) {
              Bluenet.loadFingerprint(sphereId, locationId, locations[locationId].config.fingerprintRaw)
            }
          });
        });
      })
  },


};

