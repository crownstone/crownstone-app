import { Bluenet, BleActions, NativeBus } from './Proxy';
import { BleUtil } from './BleUtil';
import { StoneStateHandler } from './StoneDisabilityHandler'
import { eventBus } from './../util/eventBus';
import { Scheduler } from './../logic/Scheduler';
import { LOG, LOGDebug, LOGError } from '../logging/Log'
import { enoughCrownstonesForIndoorLocalization } from '../util/dataUtil'
import { Vibration } from 'react-native'
import { TYPES } from '../router/store/reducers/stones'

let MINIMUM_AMOUNT_OF_SAMPLES = 3;
let SLIDING_WINDOW_FACTOR = 0.5; // [0.1 .. 1] higher is more responsive
let TOUCH_RSSI_THRESHOLD = -50;
let TOUCH_TIME_BETWEEN_SWITCHING = 4000; // ms
let TOUCH_CONSECUTIVE_SAMPLES = 1;
let TRIGGER_TIME_BETWEEN_SWITCHING = 2000; // ms

export class StoneTracker {
  constructor(store) {
    this.elements = {};
    this.store = store;
    this.temporaryIgnore = false;
    this.temporaryIgnoreTimeout = undefined;

    eventBus.on("ignoreTriggers", () => {
      this.temporaryIgnore = true;
      this.temporaryIgnoreTimeout = setTimeout(() => {
        if (this.temporaryIgnore === true) {
          LOGError("temporary ignore of triggers has been on for more than 20 seconds!!");
        }
      }, 20000 );
    });
    eventBus.on("useTriggers", () => { this.temporaryIgnore = false; clearTimeout(this.temporaryIgnoreTimeout); });
  }


  /**
   * FALL BACK TO ENSURE THE ENTER HOME EVENT / IN RANGE EVENT FIRES
   * @param stone
   * @param sphereId
   * @param stoneId
   * @param element
   */
  handleHomeEnterEvent(stone, sphereId, stoneId, element) {
    // TODO: put this check back when the mesh works
    // // if we have enough stones for indoor localization we will use the presence toggle of the sphere to do this.
    // if (enoughCrownstonesForIndoorLocalization(state, referenceId)) {
    //   return;
    // }

    // when we are out of range for 30 seconds, the crownstone is disabled. when we see it again, fire the onHomeEnter
    if (stone.config.disabled === true) {
      this._handleTrigger(element, {}, TYPES.HOME_ENTER, stoneId, sphereId);
    }
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

    let stone = sphere.stones[stoneId];
    // element is either an appliance or a stone. If we have an application, we use its behaviour, if not, we use the stone's behaviour
    let element = this._getElement(sphere, stone);

    // handle the case for in range, home enter event is different and requires mesh
    this.handleHomeEnterEvent(stone, referenceId, stoneId, element);

    // tell the handler that this stone/beacon is still in range.
    StoneStateHandler.receivedIBeaconUpdate(referenceId, stoneId);

    // currentTime
    let now = new Date().valueOf();

    // keep track of this item.
    if (this.elements[stoneId] === undefined) {
      this.elements[stoneId] = {
        lastTriggerType: TYPES.AWAY, // we start with the away as default so the app will not initialize and then turn something off you're not near to already.
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

    // sometimes we need to ignore any distance based toggling.
    if (this.temporaryIgnore === true) {
      return;
    }

    // not all stones have touch to toggle enabled
    if (stone.config.touchToToggle === true) {
      // implementation of touch-to-toggle feature. Once every 5 seconds, we require 2 close samples to toggle.
      // the sign > is because the rssi is negative!
      if (rssi > TOUCH_RSSI_THRESHOLD && (now - ref.touchTime) > TOUCH_TIME_BETWEEN_SWITCHING) {
        ref.touchSamples += 1;
        if (ref.touchSamples >= TOUCH_CONSECUTIVE_SAMPLES) {

          // notify the user by vibration that the crownstone will be switched.
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
    ref.rssiAverage = (1 - SLIDING_WINDOW_FACTOR) * ref.rssiAverage + SLIDING_WINDOW_FACTOR * rssi;
    ref.samples += ref.samples < MINIMUM_AMOUNT_OF_SAMPLES ? 1 : 0;

    // we need a decent sample set.
    if (ref.samples < MINIMUM_AMOUNT_OF_SAMPLES)
      return;

    // these event are only used for when there are no room-level options possible
    if (!enoughCrownstonesForIndoorLocalization(state, referenceId)) {
      if (ref.rssiAverage > stone.config.nearThreshold) {
        // if near, cleanup far pending callback
        this._cleanupPendingOutdatedCallback(element, ref, TYPES.NEAR);
        this._handleTrigger(element, ref, TYPES.NEAR, stoneId, referenceId);
      }
      // we add the -5 so there is not a single threshold line.
      else if (ref.rssiAverage < (stone.config.nearThreshold - 5)) {
        // if near, cleanup far pending callback
        this._cleanupPendingOutdatedCallback(element, ref, TYPES.AWAY);
        this._handleTrigger(element, ref, TYPES.AWAY, stoneId, referenceId);
      }
      // in case we are between near and far, only delete pending callbacks.
      else if (ref.rssiAverage > stone.config.nearThreshold && ref.rssiAverage < (stone.config.nearThreshold - 5)) {
        this._cleanupPendingOutdatedCallback(element, ref, TYPES.NEAR);
      }
    }
  }


  _cleanupPendingOutdatedCallback(element, ref, type) {
    let behaviour = element.behaviour[type];
    if (behaviour.active === true) {
      // intercept pending timeouts because they are no longer relevant.
      if (type == TYPES.NEAR && ref.cancelScheduledAwayAction !== false) {
        ref.cancelScheduledAwayAction();
        ref.cancelScheduledAwayAction = false;
      }
      else if (ref.cancelScheduledNearAction !== false) {
        ref.cancelScheduledNearAction();
        ref.cancelScheduledNearAction = false;
      }
    }
  }

  _handleTrigger(element, ref, type, stoneId, sphereId) {
    let behaviour = element.behaviour[type];
    if (behaviour.active === true) {

      LOG("STARTING TO TRIGGER A ", type, "EVENT, BEHAVIOUR OF TYPE", type, " IS ACTIVE continue:", !(ref.lastTriggerType === type));
      if (ref.lastTriggerType === type) {
        return;
      }

      let changeCallback = () => {
        let state = this.store.getState();
        let stone = state.spheres[sphereId].stones[stoneId];

        if (type == TYPES.NEAR || type == TYPES.AWAY) {
          ref.lastTriggerType = type;
          ref.lastTriggerTime = new Date().valueOf();
        }

        LOG("TRIGGERING CALLBACK FOR ", type)
        // if we need to switch:
        if (behaviour.state !== stone.state.state) {
          this._applySwitchState(behaviour.state, stone, stoneId, sphereId);
        }
      };

      if (behaviour.delay > 0) {
        // use scheduler
        if (type == TYPES.NEAR && ref.cancelScheduledNearAction === false) {
          ref.cancelScheduledNearAction = Scheduler.scheduleCallback(changeCallback, behaviour.delay * 1000);
        }
        else if (type == TYPES.AWAY && ref.cancelScheduledAwayAction === false) {
          ref.cancelScheduledAwayAction = Scheduler.scheduleCallback(changeCallback, behaviour.delay * 1000);
        }
      }
      else {
        changeCallback();
      }
    }
  }


  _applySwitchState(newState, stone, stoneId, sphereId) {
    let data = {state: newState};
    if (newState === 0) {
      data.currentUsage = 0;
    }
    let proxy = BleUtil.getProxy(stone.config.handle);
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
        LOGError("COULD NOT SET STATE", err);
      })
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
