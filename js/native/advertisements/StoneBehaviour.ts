import { Alert }                    from "react-native"
import { LOG, LOGd }                from "../../logging/Log";
import { eventBus }                 from "../../util/EventBus";
import { FirmwareHandler }          from "../firmware/FirmwareHandler";
import { BEHAVIOUR_TYPES }          from "../../router/store/reducers/stones";
import { BleUtil }                  from "../../util/BleUtil";
import { canUseIndoorLocalizationInSphere } from "../../util/DataUtil";
import { TIME_BETWEEN_TAP_TO_TOGGLES, TRIGGER_TIME_BETWEEN_SWITCHING_NEAR_AWAY } from "../../ExternalConfig";
import { addDistanceToRssi, Util }  from "../../util/Util";
import { LocalNotifications }       from "../../notifications/LocalNotifications";
import { BehaviourUtil }            from "../../util/BehaviourUtil";
import {BatchCommandHandler} from "../../logic/BatchCommandHandler";
import {INTENTS} from "../libInterface/Constants";


let MINIMUM_AMOUNT_OF_SAMPLES_FOR_NEAR_AWAY_TRIGGER = 2;
let SLIDING_WINDOW_FACTOR = 0.2; // [0.1 .. 1] higher is more responsive


/**
 * Each Stone Entity will have a StoneBehaviour which only job is to respond to triggers to enact its behaviour.
 **/
export class StoneBehaviour {

  store;
  sphereId;
  stoneId;

  subscriptions = [];

  temporaryIgnore = false;
  temporaryIgnoreTimeout;
  tapToToggleDisabledTemporarily = false;

  lastTriggerType = null;
  lastTriggerTime = 0;
  rssiAverage = undefined;
  samples = 0;
  touchTemporarilyDisabled = false;
  touchTime = 0;

  constructor(store, sphereId, stoneId) {
    this.store = store;
    this.sphereId = sphereId;
    this.stoneId = stoneId;

    this.subscribe();
  }


  subscribe() {
    this.subscriptions.push(eventBus.on("ignoreTriggers", () => {
      this.temporaryIgnore = true;
      this.temporaryIgnoreTimeout = setTimeout(() => {
        if (this.temporaryIgnore === true) {
          LOG.warn("temporary ignore of triggers has been on for more than 30 seconds!!");
        }
      }, 30000 );
    }));
    this.subscriptions.push(eventBus.on("useTriggers", () => {
      this.temporaryIgnore = false; clearTimeout(this.temporaryIgnoreTimeout);
    }));

    // if we detect a setup stone, we disable tap to toggle temporarily
    this.subscriptions.push(eventBus.on("setupStoneChange", (setupCrownstonesAvailable) => {
      this.tapToToggleDisabledTemporarily = setupCrownstonesAvailable;
    }));
  }


  destroy() {
    this.subscriptions.forEach((unsubscribe) => { unsubscribe(); });
    clearTimeout(this.temporaryIgnoreTimeout)
  }


  update(state, stone, rssi) {
    // sometimes we need to ignore any distance based toggling.
    if (this.temporaryIgnore === true) {
      LOGd.info("StoneBehaviour: IGNORE: temporary ignore enabled.");
      return;
    }

    if (stone.config.locked === true) {
      LOGd.info("StoneBehaviour: IGNORE: stone is locked.");
      return;
    }

    let toggled = this._handleTapToToggle(state, stone, rssi);

    // update local tracking of data
    if (this.rssiAverage === undefined) {
      this.rssiAverage = rssi
    }
    this.rssiAverage = (1 - SLIDING_WINDOW_FACTOR) * this.rssiAverage + SLIDING_WINDOW_FACTOR * rssi;
    this.samples += (this.samples < MINIMUM_AMOUNT_OF_SAMPLES_FOR_NEAR_AWAY_TRIGGER) ? 1 : 0;


    if (!toggled) {
      this._handleNearFar(state, stone);
    }
  }


  _handleTapToToggle(state, stone, rssi) {
    if (!state.app.tapToToggleEnabled)     { return false; }
    if (!stone.config.tapToToggle)         { return false; }
    if (FirmwareHandler.isDfuInProgress()) { return false; }

    let tapToToggleCalibration = Util.data.getTapToToggleCalibration(state);
    if (!tapToToggleCalibration)           { return false; }

    let now = new Date().valueOf();

    // implementation of touch-to-toggle feature. Once every 5 seconds, we require 1 close sample to toggle.
    // the sign > is because the rssi is negative!
    if (this.touchTemporarilyDisabled === true) {
      // to avoid flipping tap to toggle events: we move out of range (rssi smaller than a threshold) to re-enable it.
      // rssi measured must be smaller (-80) < (-49 + -4)
      let enableDistance = addDistanceToRssi(tapToToggleCalibration, 0.35); // the + 0.35 meter makes sure a stationary phone will not continuously tap-to-toggle
      if (rssi < enableDistance) {
        this.touchTemporarilyDisabled = false;
      }

      return false;
    }

    if (rssi > tapToToggleCalibration && (now - this.touchTime) > TIME_BETWEEN_TAP_TO_TOGGLES) {
      if (this.tapToToggleDisabledTemporarily === false) {
        LOG.info("StoneTracker: Tap to Toggle fired. measured RSSI:", rssi, ' required:', tapToToggleCalibration);
        // notify the user by vibration that the crownstone will be switched.
        let element = Util.data.getElement(this.store, this.sphereId, this.stoneId, stone);
        LocalNotifications.sendLocalPopup('Toggling ' + element.config.name + '!', false);

        if (state.user.seenTapToToggle !== true) {
          this.store.dispatch({type: 'USER_SEEN_TAP_TO_TOGGLE_ALERT', data: {seenTapToToggle: true}});
          Alert.alert("That's tap to toggle!", "You had your phone very very close to the Crownstone so I switched it for you!", [{text: "OK"}])
        }

        BatchCommandHandler.loadPriority(stone, this.stoneId, this.sphereId, {commandName:'toggle', stateForOn: stone.config.dimmingEnabled ? 0.99 : 1.00}, {}, 2, 'Tap To Toggle!')
          .then((newSwitchState) => {
            eventBus.emit("NEW_ACTIVITY_LOG", {
              command:     "tap2toggle",
              commandUuid: Util.getUUID(),
              connectedTo: this.stoneId,
              target:      this.stoneId,
              timeout:     0,
              intent:      INTENTS.manual,
              state:       newSwitchState,
              sphereId:    this.sphereId
            });


            let data = {state: newSwitchState};
            if (newSwitchState === 0) {
              data["currentUsage"] = 0;
            }
            this.store.dispatch({
              type: 'UPDATE_STONE_SWITCH_STATE',
              sphereId: this.sphereId,
              stoneId: this.stoneId,
              data: data
            });
          })
          .catch((err) => {});

        BatchCommandHandler.executePriority();

        this.touchTime = now;
        this.touchTemporarilyDisabled = true;

        return true;
      }
      else {
        LOG.info("StoneTracker: Tap to Toggle is disabled.");
        if (state.user.seenTapToToggleDisabledDuringSetup !== true) {
          this.store.dispatch({type: 'USER_SEEN_TAP_TO_TOGGLE_DISABLED_ALERT', data: {seenTapToToggleDisabledDuringSetup: true}});
          Alert.alert("Can't tap to toggle...", "I've disabled tap to toggle while you see a Crownstone in setup mode.", [{text: "OK"}]);
        }

        return false;
      }
    }
  }


  _handleNearFar(state, stone) {
    let now = new Date().valueOf();

    // to avoid flickering we do not trigger these events in less than 5 seconds.
    if ((now - this.lastTriggerTime) < TRIGGER_TIME_BETWEEN_SWITCHING_NEAR_AWAY) {
      return;
    }

    // we need a decent sample set.
    if (this.samples < MINIMUM_AMOUNT_OF_SAMPLES_FOR_NEAR_AWAY_TRIGGER)
      return;

    // if the threshold is not defined yet, don't switch on near or far
    if (stone.config.nearThreshold === null) {
      return;
    }

    let farThreshold = addDistanceToRssi(stone.config.nearThreshold, 1.5); // the + 0.5 meter makes sure the user is not defining a place where he will sit: on the threshold.

    // these event are only used for when there are no room-level options possible
    if (!canUseIndoorLocalizationInSphere(state, this.sphereId)) {
      if (this.rssiAverage >= stone.config.nearThreshold) {
        // only trigger if the last type of event this module triggered was NOT a near event.
        if (this.lastTriggerType !== BEHAVIOUR_TYPES.NEAR) {
          // these callbacks will store the cancelable action when there is a delay and store the type of trigger that was fires last.
          let callbacks = {
            // identify that we triggered the event.
            onTrigger: (sphereId, stoneId) => {
              this.lastTriggerType = BEHAVIOUR_TYPES.NEAR;
              this.lastTriggerTime = new Date().valueOf();
            },
            onCancelled: (sphereId, stoneId) => {
              // in the event that only an away event is configured, reset the trigger after being in the near for RESET_TIMER_FOR_NEAR_AWAY_EVENTS seconds
              // by placing this in the cancelScheduledAwayAction, it will be cleared upon the next time the user enters AWAY.
              this.lastTriggerType = BEHAVIOUR_TYPES.NEAR;
              this.lastTriggerTime = new Date().valueOf();
            }
          };
          BehaviourUtil.enactBehaviour(this.store, this.sphereId, this.stoneId, BEHAVIOUR_TYPES.NEAR, callbacks);
        }
      }
      // far threshold is 0.5m more than the near one so there is not a single line
      else if (this.rssiAverage < farThreshold) {
        // only trigger if the last type of event this module triggered was NOT an AWAY event.
        if (this.lastTriggerType !== BEHAVIOUR_TYPES.AWAY) {
          let callbacks = {
            // store the cancellation if we need to use it.
            onTrigger: (sphereId, stoneId) => {
              // identify that we triggered the event
              this.lastTriggerType = BEHAVIOUR_TYPES.AWAY;
              this.lastTriggerTime = new Date().valueOf();
            },
            onCancelled: (sphereId, stoneId) => {
              // in the event that only an away event is configured, reset the trigger after being in the near for RESET_TIMER_FOR_NEAR_AWAY_EVENTS seconds
              // by placing this in the cancelScheduledAwayAction, it will be cleared upon the next time the user enters NEAR.
              this.lastTriggerType = BEHAVIOUR_TYPES.AWAY;
              this.lastTriggerTime = new Date().valueOf();
            }
          };
          BehaviourUtil.enactBehaviour(this.store, this.sphereId, this.stoneId, BEHAVIOUR_TYPES.AWAY, callbacks);
        }
      }
      // in case we are between near and far, only clear pending timeouts. They will be placed back on the next event.
      else if (this.rssiAverage > stone.config.nearThreshold && this.rssiAverage < farThreshold) {
        // this._cleanupPendingActions(ref);
      }
    }
  }

}