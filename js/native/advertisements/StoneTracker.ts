import { Alert, Vibration } from 'react-native';

import { BleUtil }                            from '../../util/BleUtil'
import { BluenetPromiseWrapper }              from '../libInterface/BluenetPromise'
import { StoneStateHandler }                  from './StoneStateHandler'
import { eventBus }                           from '../../util/EventBus';
import {
  TIME_BETWEEN_TAP_TO_TOGGLES,
  TRIGGER_TIME_BETWEEN_SWITCHING_NEAR_AWAY
} from '../../ExternalConfig';
import { addDistanceToRssi, Util }            from '../../util/Util';
import { BehaviourUtil }                      from '../../util/BehaviourUtil';
import { LOG }                                from '../../logging/Log'
import { canUseIndoorLocalizationInSphere }   from '../../util/DataUtil'
import { BEHAVIOUR_TYPES }                    from '../../router/store/reducers/stones'
import { FirmwareHandler }                    from "../firmware/FirmwareHandler";

let MINIMUM_AMOUNT_OF_SAMPLES_FOR_NEAR_AWAY_TRIGGER = 2;
let SLIDING_WINDOW_FACTOR = 0.5; // [0.1 .. 1] higher is more responsive


export class StoneTracker {
 elements : any;
 store : any;
 temporaryIgnore : boolean;
 temporaryIgnoreTimeout : any;
 tapToToggleDisabledTemporarily : boolean;

  constructor(store) {
    this.elements = {};
    this.store = store;
    this.temporaryIgnore = false;
    this.temporaryIgnoreTimeout = undefined;
    this.tapToToggleDisabledTemporarily = false;

    eventBus.on("ignoreTriggers", () => {
      this.temporaryIgnore = true;
      this.temporaryIgnoreTimeout = setTimeout(() => {
        if (this.temporaryIgnore === true) {
          LOG.warn("temporary ignore of triggers has been on for more than 30 seconds!!");
        }
      }, 30000 );
    });
    eventBus.on("useTriggers", () => { this.temporaryIgnore = false; clearTimeout(this.temporaryIgnoreTimeout); });

    // if we detect a setup stone, we disable tap to toggle temporarily
    eventBus.on("setupStoneChange", (setupCrownstonesAvailable) => {
      this.tapToToggleDisabledTemporarily = setupCrownstonesAvailable;
    });
  }


  iBeaconUpdate(major, minor, rssi, referenceId) {
    let sphereId = referenceId;

    // only use valid rssi measurements, 0 or 128 are not valid measurements
    if (rssi === undefined || rssi > -1) {
      LOG.debug("StoneTracker: IGNORE: no rssi.");
      return;
    }

    if (sphereId === undefined || major  === undefined || minor === undefined) {
      LOG.debug("StoneTracker: IGNORE: no sphereId or no major or no minor.");
      return;
    }

    // check if we have the sphere
    let state = this.store.getState();
    let sphere = state.spheres[sphereId];
    if (!(sphere)) {
      LOG.debug("StoneTracker: IGNORE: unknown sphere.");
      return;
    }

    // check if we have a stone with this major / minor
    let stoneId = this._getStoneFromIBeacon(sphere, major, minor);
    if (!(stoneId)) {
      LOG.debug("StoneTracker: IGNORE: unknown stone.");
      return;
    }

    let stone = sphere.stones[stoneId];

    // handle the case of a failed DFU that requires a reset. If it boots in normal mode, we can not use it until the
    // reset is complete.
    if (stone.config.dfuResetRequired === true) {
      LOG.debug("AdvertisementHandler: IGNORE: DFU reset is required for this Crownstone.");
      return;
    }

    // tell the handler that this stone/beacon is still in range.
    StoneStateHandler.receivedIBeaconUpdate(sphereId, stone, stoneId, rssi);

    // currentTime
    let now = new Date().valueOf();

    // keep track of this item.
    if (this.elements[stoneId] === undefined) {
      this.elements[stoneId] = {
        lastTriggerType: null,
        lastTriggerTime: 0,
        rssiAverage: rssi,
        samples: 0,
        touchTemporarilyDisabled: false,
        touchTime: now,
        cancelScheduledAwayAction: false,
        cancelScheduledNearAction: false
      };
    }

    // local reference of the device/stone
    let ref = this.elements[stoneId];

    // sometimes we need to ignore any distance based toggling.
    if (this.temporaryIgnore === true) {
      LOG.debug("StoneTracker: IGNORE: temporary ignore enabled.");
      return;
    }


    // --------------------- Process the Tap-to-Toggle --------------------------- //

    if (state.app.tapToToggleEnabled !== false) {
      let tapToToggleCalibration = Util.data.getTapToToggleCalibration(state);
      // not all stones have touch to toggle enabled
      if (stone.config.touchToToggle === true && tapToToggleCalibration !== null && FirmwareHandler.isDfuInProgress() === false) {
        // implementation of touch-to-toggle feature. Once every 5 seconds, we require 2 close samples to toggle.
        // the sign > is because the rssi is negative!
        if (ref.touchTemporarilyDisabled === true) {
          // to avoid flipping tap to toggle events: we move out of range (rssi smaller than a threshold) to re-enable it.
          // rssi measured must be smaller (-80) < (-49 + -4)
          let enableDistance = addDistanceToRssi(tapToToggleCalibration, 0.35); // the + 0.35 meter makes sure a stationary phone will not continuously tap-to-toggle
          if (rssi < enableDistance) {
            ref.touchTemporarilyDisabled = false;
          }
        }
        else {
          // LOG.info("Tap to toggle is on", rssi, TOUCH_RSSI_THRESHOLD, (now - ref.touchTime), TIME_BETWEEN_TAP_TO_TOGGLES);
          if (rssi > tapToToggleCalibration && (now - ref.touchTime) > TIME_BETWEEN_TAP_TO_TOGGLES) {
            if (this.tapToToggleDisabledTemporarily === false) {
              LOG.info("StoneTracker: Tap to Toggle fired. measured RSSI:", rssi, ' required:', tapToToggleCalibration);
              // notify the user by vibration that the crownstone will be switched.
              Vibration.vibrate(400, false);

              if (state.user.seenTapToToggle !== true) {
                this.store.dispatch({type: 'USER_SEEN_TAP_TO_TOGGLE_ALERT', data: {seenTapToToggle: true}});
                Alert.alert("That's tap to toggle!", "You had your phone very very close to the Crownstone so I switched it for you!", [{text: "OK"}])
              }

              let proxy = BleUtil.getProxy(stone.config.handle, sphereId, stoneId);
              proxy.performPriority(BluenetPromiseWrapper.toggleSwitchState)
                .then((newState) => {
                  let data = {state: newState};
                  if (newState === 0) {
                    data["currentUsage"] = 0;
                  }
                  this.store.dispatch({
                    type: 'UPDATE_STONE_SWITCH_STATE',
                    sphereId: sphereId,
                    stoneId: stoneId,
                    data: data
                  });
                })
                .catch((err) => {});

              ref.touchTime = now;
              ref.touchTemporarilyDisabled = true;
              return;
            }
            else {
              LOG.info("StoneTracker: Tap to Toggle is disabled.");
              if (state.user.seenTapToToggleDisabledDuringSetup !== true) {
                this.store.dispatch({type: 'USER_SEEN_TAP_TO_TOGGLE_DISABLED_ALERT', data: {seenTapToToggleDisabledDuringSetup: true}});
                Alert.alert("Can't tap to toggle...", "I've disabled tap to toggle while you see a Crownstone in setup mode.", [{text: "OK"}]);
              }
            }
          }
        }
      }
    }



    // --------------------- Finished Tap-to-Toggle --------------------------- //

    // to avoid flickering we do not trigger these events in less than 5 seconds.
    if ((now - ref.lastTriggerTime) < TRIGGER_TIME_BETWEEN_SWITCHING_NEAR_AWAY) {
      return;
    }


    // update local tracking of data
    ref.rssiAverage = (1 - SLIDING_WINDOW_FACTOR) * ref.rssiAverage + SLIDING_WINDOW_FACTOR * rssi;
    ref.samples += ref.samples < MINIMUM_AMOUNT_OF_SAMPLES_FOR_NEAR_AWAY_TRIGGER ? 1 : 0;

    // we need a decent sample set.
    if (ref.samples < MINIMUM_AMOUNT_OF_SAMPLES_FOR_NEAR_AWAY_TRIGGER)
      return;

    // if the threshold is not defined yet, don't switch on near or far
    if (stone.config.nearThreshold === null) {
      return;
    }



    // --------------------- Process the NEAR / AWAY events --------------------------- //

    let farThreshold = addDistanceToRssi(stone.config.nearThreshold, 0.5); // the + 0.5 meter makes sure the user is not defining a place where he will sit: on the threshold.

    // these event are only used for when there are no room-level options possible
    if (!canUseIndoorLocalizationInSphere(state, sphereId)) {
      if (ref.rssiAverage >= stone.config.nearThreshold) {
        // only trigger if the last type of event this module triggered was NOT a near event.
        if (ref.lastTriggerType !== BEHAVIOUR_TYPES.NEAR) {
          // these callbacks will store the cancelable action when there is a delay and store the type of trigger that was fires last.
          let callbacks = {
            // identify that we triggered the event.
            onTrigger: (sphereId, stoneId) => {
              ref.lastTriggerType = BEHAVIOUR_TYPES.NEAR;
              ref.lastTriggerTime = new Date().valueOf();
            },
            onCancelled: (sphereId, stoneId) => {
              // in the event that only an away event is configured, reset the trigger after being in the near for RESET_TIMER_FOR_NEAR_AWAY_EVENTS seconds
              // by placing this in the cancelScheduledAwayAction, it will be cleared upon the next time the user enters AWAY.
              ref.lastTriggerType = BEHAVIOUR_TYPES.NEAR;
              ref.lastTriggerTime = new Date().valueOf();
            }
          };
          BehaviourUtil.enactBehaviour(this.store, sphereId, stoneId, BEHAVIOUR_TYPES.NEAR, callbacks);
        }
      }
      // far threshold is 0.5m more than the near one so there is not a single line
      else if (ref.rssiAverage < farThreshold) {
        // only trigger if the last type of event this module triggered was NOT an AWAY event.
        if (ref.lastTriggerType !== BEHAVIOUR_TYPES.AWAY) {
          let callbacks = {
            // store the cancellation if we need to use it.
            onTrigger: (sphereId, stoneId) => {
              // identify that we triggered the event
              ref.lastTriggerType = BEHAVIOUR_TYPES.AWAY;
              ref.lastTriggerTime = new Date().valueOf();
            },
            onCancelled: (sphereId, stoneId) => {
              // in the event that only an away event is configured, reset the trigger after being in the near for RESET_TIMER_FOR_NEAR_AWAY_EVENTS seconds
              // by placing this in the cancelScheduledAwayAction, it will be cleared upon the next time the user enters NEAR.
              ref.lastTriggerType = BEHAVIOUR_TYPES.AWAY;
              ref.lastTriggerTime = new Date().valueOf();
            }
          };
          BehaviourUtil.enactBehaviour(this.store, sphereId, stoneId, BEHAVIOUR_TYPES.AWAY, callbacks);
        }
      }
      // in case we are between near and far, only clear pending timeouts. They will be placed back on the next event.
      else if (ref.rssiAverage > stone.config.nearThreshold && ref.rssiAverage < farThreshold) {
        // this._cleanupPendingActions(ref);
      }
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