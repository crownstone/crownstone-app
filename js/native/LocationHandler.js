import { Bluenet, BleActions, NativeBus } from './Proxy';
import { BLEutil } from './BLEutil';
import { StoneStateHandler } from './StoneStateHandler'
import { Scheduler } from './../logic/Scheduler';
import { LOG, LOGDebug, LOGError } from '../logging/Log'
import { getUUID } from '../util/util'
import { enoughCrownstonesForIndoorLocalization } from '../util/dataUtil'
import { ENCRYPTION_ENABLED } from '../ExternalConfig'
import { Vibration } from 'react-native'

let TYPES = {
  TOUCH: 'touch',
  NEAR: 'onNear',
  AWAY: 'onAway',
};

let TOUCH_RSSI_THRESHOLD = -50;
let TOUCH_TIME_BETWEEN_SWITCHING = 4000; // ms
let TOUCH_CONSECUTIVE_SAMPLES = 1;
let TRIGGER_TIME_BETWEEN_SWITCHING = 2000; // ms

class StoneTracker {
  constructor(store) {
    this.elements = {};
    this.store = store;
  }

  iBeaconUpdate(major, minor, rssi, referenceId) {
    // LOG("major, minor, rssi, ref",major, minor, rssi, referenceId)
    // only use valid rssi measurements, 0 or 128 are not valid measurements
    if (rssi === undefined || rssi > -1)
      return;

    if (referenceId === undefined || major  === undefined || minor === undefined)
      return;

    // check if we have the sphere
    let state = this.store.getState();
    let sphere = state.spheres[referenceId];
    if (!(sphere)) {
      return;
    }

    // check if we have a stone with this major / minor
    let stoneId = this._getStoneFromIBeacon(sphere, major, minor);
    if (!(stoneId)) {
      return;
    }

    // tell the handler that this stone/beacon is still in range.
    StoneStateHandler.receivedIBeaconUpdate(referenceId, stoneId);

    let stone = sphere.stones[stoneId];
    // element is either an appliance or a stone. If we have an application, we use its behaviour, if not, we use the stone's behaviour
    let element = this._getElement(sphere, stone);

    // currentTime
    let now = new Date().valueOf();

    // keep track of this item.
    if (this.elements[stoneId] === undefined) {
      this.elements[stoneId] = {
        lastTriggerType: undefined,
        lastTriggerTime: 0,
        rssiAverage: rssi,
        samples: 0,
        touchSamples:0,
        touchTime: now,
        cancelScheduledAwayAction: false,
        cancelScheduledNearAction: false
      };
    }

    // local reference of the device/stone
    let ref = this.elements[stoneId];

    // not all stones have touch to toggle enabled
    if (stone.config.touchToToggle === true) {
      // implementation of touch-to-toggle feature. Once every 5 seconds, we require 2 close samples to toggle.
      // the sign > is because the rssi is negative!
      if (rssi > TOUCH_RSSI_THRESHOLD && (now - ref.touchTime) > TOUCH_TIME_BETWEEN_SWITCHING) {
        ref.touchSamples += 1;
        if (ref.touchSamples >= TOUCH_CONSECUTIVE_SAMPLES) {
          Vibration.vibrate(400, false);
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
    }


    // to avoid flickering we do not trigger these events in less than 5 seconds.
    if ((now - ref.lastTriggerTime) < TRIGGER_TIME_BETWEEN_SWITCHING)
      return;


    // update local tracking of data
    ref.rssiAverage = 0.7 * ref.rssiAverage + 0.3 * rssi;
    ref.samples += ref.samples < 5 ? 1 : 0;

    // we need a decent sample set.
    if (ref.samples < 5)
      return;

    // these event are only used for when there are no room-level options possible
    if (enoughCrownstonesForIndoorLocalization(state, referenceId)) {
      if (ref.rssiAverage > stone.config.nearThreshold && ref.lastTriggerType !== TYPES.NEAR) {
        this._handleTrigger(element, ref, TYPES.NEAR, stoneId, referenceId);
      }
      else if (ref.rssiAverage < stone.config.nearThreshold && ref.lastTriggerType !== TYPES.AWAY) {
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
        this.store.dispatch({
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
      if (type == TYPES.NEAR && ref.cancelScheduledAwayAction !== false) {
        ref.cancelScheduledAwayAction();
        ref.cancelScheduledAwayAction = false;
      }
      else if (ref.cancelScheduledNearAction !== false) {
        ref.cancelScheduledNearAction();
        ref.cancelScheduledNearAction = false;
      }

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
        if (type == TYPES.NEAR) {
          ref.cancelScheduledNearAction = Scheduler.scheduleCallback(changeCallback, behaviour.delay*1000);
        }
        else {
          ref.cancelScheduledAwayAction = Scheduler.scheduleCallback(changeCallback, behaviour.delay*1000);
        }
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
      if (stone.iBeaconMajor == major && stone.iBeaconMinor == minor) {
        return stoneIds[i];
      }
    }
  }
}

class LocationHandlerClass {
  constructor() {
    this.initialized = false;
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


      // NativeBus.on(NativeBus.topics.currentRoom, (data) => {LOGDebug('CURRENT ROOM', data)});
      NativeBus.on(NativeBus.topics.enterSphere, this._enterSphere.bind(this));
      NativeBus.on(NativeBus.topics.exitSphere,  this._exitSphere.bind(this) );
      NativeBus.on(NativeBus.topics.enterRoom,   this._enterRoom.bind(this)  );
      NativeBus.on(NativeBus.topics.exitRoom,    this._exitRoom.bind(this)   );
      NativeBus.on(NativeBus.topics.iBeaconAdvertisement, this._iBeaconAdvertisement.bind(this));
    }
  }

  _iBeaconAdvertisement(data) {
    data.forEach((iBeaconPackage) => {
      // LOGDebug("iBeaconPackage",iBeaconPackage);
      this.tracker.iBeaconUpdate(iBeaconPackage.major, iBeaconPackage.minor, iBeaconPackage.rssi, iBeaconPackage.referenceId);
    })
  }

  _enterSphere(sphereId) {
    let state = this.store.getState();
    LOG("ENTER SPHERE", sphereId);
    if (state.spheres[sphereId] !== undefined) {
      // start high frequency scan when entering a sphere.
      BLEutil.startHighFrequencyScanning(this.id, 5000);

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


      LOG("Set Settings.", bluenetSettings, state.spheres[sphereId]);
      return BleActions.setSettings(bluenetSettings)
        .then(() => {
          LOG("Setting Active Sphere");
          let sphereActions = [];
          let stoneIds = Object.keys(state.spheres[sphereId].stones);
          stoneIds.forEach((stoneId) => {
            sphereActions.push({type: 'UPDATE_STONE_DISABILITY', stoneId: stoneId, data:{ disabled: true }});
          });

          sphereActions.push({type: 'SET_ACTIVE_SPHERE', data: {activeSphere: sphereId}});
          sphereActions.push({type: 'SET_SPHERE_STATE', sphereId: sphereId, data:{reachable: true, present: true}});
          this.store.batchDispatch(sphereActions);
        }).catch()
    }
  }

  _exitSphere(sphereId) {
    this.store.dispatch({type: 'SET_SPHERE_STATE', sphereId: sphereId, data:{reachable: false, present: false}});
  }

  _enterRoom(locationId) {
    console.log("USER_ENTER_LOCATION. Todo: get sphere id from lib");
    let state = this.store.getState();
    if (state.app.activeSphere && locationId) {
      this.store.dispatch({type: 'USER_ENTER_LOCATION', sphereId: state.app.activeSphere, locationId: locationId, data: {userId: state.user.userId}});
    }
  }

  _exitRoom(locationId) {
    console.log("USER_EXIT_LOCATION. Todo: get sphere id from lib");
    let state = this.store.getState();
    if (state.app.activeSphere && locationId) {
      this.store.dispatch({type: 'USER_EXIT_LOCATION', sphereId: state.app.activeSphere, locationId: locationId, data: {userId: state.user.userId}});
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
              LOG("-------------- LOADING FINGERPRINT FOR ", locationId, " IN SPHERE ", sphereId);
              Bluenet.loadFingerprint(sphereId, locationId, locations[locationId].config.fingerprintRaw)
            }
          });
        });
      })
  },
};


export const sphereRequiresFingerprints = function (state, sphereId) {
  let locationIds = Object.keys(state.spheres[sphereId].locations);
  let requiresFingerprints = false;
  locationIds.forEach((locationId) => {
    if (state.spheres[sphereId].locations[locationId].config.fingerprintRaw === null) {
      requiresFingerprints = true;
    }
  });
  return requiresFingerprints;
};
