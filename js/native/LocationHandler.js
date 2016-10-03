import { AdvertisementHandler } from './AdvertisementHandler';
import { Bluenet, BleActions, NativeBus } from './Proxy';
import { BLEutil } from './BLEutil';
import { Scheduler } from './../logic/Scheduler';
import { LOG } from '../logging/Log'
import { getUUID } from '../util/util'
import { ENCRYPTION_ENABLED } from '../ExternalConfig'


let TYPES = {
  TOUCH: 'touch',
  NEAR: 'onNear',
  AWAY: 'onAway',
};

let TOUCH_RSSI_THRESHOLD = -35;

class StoneTracker {
  constructor(store) {
    this.elements = {};
    this.store = store;
  }

  iBeaconUpdate(major, minor, rssi, referenceId) {
    if (rssi > -1)
      return;

    // check if we have the sphere
    let state = this.store.getState();
    let sphere = state.spheres[referenceId];
    if (!(sphere))
      return;


    // check if we have a stone with this major / minor
    let stoneId = this._getStoneFromIBeacon(sphere, major, minor);
    if (!(stoneId))
      return;

    let stone = sphere.stones[stoneId];
    // element is either an appliance or a stone. If we have an application, we use its behaviour, if not, we use the stone's behaviour
    let element = this._getElement(sphere, stone);

    // keep track of this item.
    if (this.elements[stoneId] === undefined) {
      this.elements[stoneId] = {lastTriggerType: undefined, lastTriggerTime: 0, rssiAverage: rssi, samples: 0, touchSamples:0, touchTime:0};
    }
    let ref = this.elements[stoneId];
    let now = new Date().valueOf();

    // implementation of touch-to-toggle feature. Once every 5 seconds, we require 2 close samples to toggle.
    if (rssi < TOUCH_RSSI_THRESHOLD) {
      ref.touchSamples += 1;
      if (ref.touchSamples >= 2 && now - ref.touchTime > 5) {
        let newState = stone.state.state > 0 ? 0 : 1;
        this._applySwitchState(newState, stone, stoneId, referenceId);
        ref.touchTime = now;
        ref.touchSamples = 0;
        return;
      }
    }
    else {
      ref.touchSamples = 0;
    }


    // to avoid flickering we do not trigger these events in less than 3 seconds.
    if (now - ref.lastTriggerTime < 3)
      return;


    // update local tracking of data
    ref.rssiAverage = 0.7 * ref.rssiAverage + 0.3 * rssi;
    ref.samples += ref.samples < 5 ? 1 : 0;

    // we need a decent sample set.
    if (ref.samples < 5)
      return;

    // these event are only used for when there are no room-level options possible
    let amountOfStonesForLocation = getAmountOfCrownstonesInSphereForLocalization(state, referenceId.sphereId);
    if (amountOfStonesForLocation < 4) {
      if (ref.rssiAverage < stone.config.nearThreshold && ref.lastTriggerType !== TYPES.NEAR) {
        this._handleTrigger(element, ref, TYPES.NEAR, stoneId, referenceId);
      }
      else if (ref.rssiAverage > stone.config.nearThreshold && ref.lastTriggerType !== TYPES.AWAY) {
        this._handleTrigger(element, ref, TYPES.AWAY, stoneId, referenceId);
      }
    }
  }

  _applySwitchState(newState, stone, stoneId, sphereId) {
    let data = {state: newState};
    if (newState === 0) {
      data.currentUsage = 0;
    }
    let proxy = BLEutil.getProxy(stone.config.handle);
    proxy.perform(BleActions.setSwitchState, newState)
      .then(() => {
        this.props.store.dispatch({
          type: 'UPDATE_STONE_STATE',
          sphereId: sphereId,
          stoneId: stoneId,
          data: data
        });
      })
      .catch((err) => {
        LOGError("COULD NOT SET STATE FROM TOUCH", err);
      })
  }

  _handleTrigger(element, ref, type, stoneId, sphereId) {
    ref.lastTriggerType = type;
    ref.lastTriggerTime = new Date().valueOf();

    let behaviour = element.behaviour[type];
    if (behaviour.active === true) {
      let changeCallback = () => {
        let state = this.store.getState();
        let stone = state.spheres[sphereId].stones[stoneId];

        // if we need to switch:
        if (behaviour.state !== stone.state.state) {
          this._applySwitchState(behaviour.state, stone, stoneId, sphereId);
        }
      };

      if (behaviour.delay > 0) {
        // use scheduler
        Scheduler.scheduleCallback(changeCallback, behaviour.delay*1000);
      }
      else {
        changeCallback();
      }
    }
  }

  _getElement(sphere, stone) {
    if (stone.config.applianceId) {
      return sphere.appliances[stone.config.applianceId];
    }
    else {
      return stone;
    }
  }


  /**
   * Todo: get smart map for this.
   * @param sphere
   * @param major
   * @param minor
   * @returns {*}
   */
  _getStoneFromIBeacon(sphere, major, minor) {
    let stoneIds = Object.keys(sphere.stones);
    for (let i = 0; i < stoneIds.length; i++) {
      let stone = sphere.stones[stoneIds[i]].config;
      if (stone.ibeaconMajor === major && stone.ibeaconMinor === minor) {
        return stoneIds[i];
      }
    }
  }



}

class LocationHandlerClass {
  constructor() {
    this.initialized = false;

    this.subscriptions = {};
    this.store = undefined;
    this.tracker = undefined;

    this.id = getUUID();
  }

  loadStore(store) {
    LOG('LOADED STORE LocationHandler', this.initialized);
    if (this.initialized === false) {
      this.initialized = true;
      this.store = store;
      this.tracker = new StoneTracker(store);


      NativeBus.on(NativeBus.topics.enterSphere, this._enterSphere.bind(this));
      NativeBus.on(NativeBus.topics.exitSphere,  this._exitSphere.bind(this) );
      NativeBus.on(NativeBus.topics.enterRoom,   this._enterRoom.bind(this)  );
      NativeBus.on(NativeBus.topics.exitRoom,    this._exitRoom.bind(this)   );
      NativeBus.on(NativeBus.topics.iBeaconAdvertisement, this._iBeaconAdvertisement.bind(this));
    }
  }

  _iBeaconAdvertisement(data) {
    this.tracker.iBeaconUpdate(data.major, data.minor, data.rssi, data.referenceId);
  }

  _enterSphere(sphereId) {
    let state = this.store.getState();
    LOG("ENTER SPHERE", sphereId);
    if (state.spheres[sphereId] !== undefined) {

      BLEutil.startHighFrequencyScanning(this.id, 5000);
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
          LOG("Setting Active Sphere");
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

