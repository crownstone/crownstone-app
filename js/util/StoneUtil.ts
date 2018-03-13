
import {BatchCommandHandler} from "../logic/BatchCommandHandler";
import {INTENTS} from "../native/libInterface/Constants";
import {LOG} from "../logging/Log";
import {Scheduler} from "../logic/Scheduler";
import {eventBus} from "./EventBus";
import {
  Alert,
} from 'react-native';

export const StoneUtil = {
  switchBHC: function (
      sphereId : string,
      stoneId : string,
      stone : any,
      newState : number,
      store : any,
      options = {},
      finalize = (err) => {},
      intent = INTENTS.manual,
      attempts : number = 1,
      label : string = 'from StoneUtil'
    ) {
    let data = {state: newState};
    if (newState === 0) {
      data['currentUsage'] = 0;
    }

    BatchCommandHandler.loadPriority(
      stone,
      stoneId,
      sphereId,
      {commandName:'multiSwitch', state: newState, intent: intent, timeout: 0},
      {},
      attempts,
      label
    )
      .then(() => {
        store.dispatch({
          type: 'UPDATE_STONE_SWITCH_STATE',
          sphereId: sphereId,
          stoneId: stoneId,
          data: data
        });
        finalize(null);
      })
      .catch((err) => {
        finalize(err);
      });

    BatchCommandHandler.executePriority();
  },


  crownstoneTimeToTimestamp: function(csTimestamp) : number {
    let now = new Date().valueOf();
    if ((now / csTimestamp) < 10) {
      csTimestamp = csTimestamp / 1000;
    }
    let jsTimestamp = 1000*csTimestamp;
    let timezoneOffsetMinutes = new Date(jsTimestamp).getTimezoneOffset();

    return jsTimestamp + timezoneOffsetMinutes*60000;
  },

  timestampToCrownstoneTime: function(utcTimestamp) : number {
    // for holland in summer, timezoneOffsetMinutes is -120, winter will be -60
    let timezoneOffsetMinutes = new Date(utcTimestamp).getTimezoneOffset();

    return (utcTimestamp - timezoneOffsetMinutes*60000)/1000;
  },

  nowToCrownstoneTime: function() : number {
    return StoneUtil.timestampToCrownstoneTime(new Date().valueOf())
  },

  checkFirmwareVersion: function(sphereId, stoneId, stone) {
    let promise = BatchCommandHandler.load(stone, stoneId, sphereId, {commandName: 'getFirmwareVersion'},{},1, 'from checkFirmware')
    BatchCommandHandler.executePriority();
    return promise;
  },

  clearErrors: function(sphereId, stoneId, stone, store) {
    let clearTheseErrors = {
      dimmerOnFailure:    true,
      dimmerOffFailure:   true,
      temperatureDimmer:  true,
      temperatureChip:    true,
      overCurrentDimmer:  true,
      overCurrent:        true,
    };

    eventBus.emit("showLoading", "Attempting to Reset Error...");
    BatchCommandHandler.loadPriority(
      stone,
      stoneId,
      sphereId,
      {commandName:'clearErrors', clearErrorJSON: clearTheseErrors},
      {},
      1000,
      'from _getButton in ErrorOverlay'
    )
      .then(() => {
        eventBus.emit("showLoading", "Success!");
        store.dispatch({type: 'RESET_STONE_ERRORS', sphereId: sphereId, stoneId: stoneId, data: {
            dimmerOnFailure:    false,
            dimmerOffFailure:   false,
            temperatureDimmer:  false,
            temperatureChip:    false,
            overCurrentDimmer:  false,
            overCurrent:        false,
        }});
        return Scheduler.delay(500);
      })
      .then(() => {
        eventBus.emit("hideLoading");
        Alert.alert("Success!","The Error has been reset. Normal functionality is re-enabled.",[{text:'OK'}]);
      })
      .catch((err) => {
        LOG.error("ErrorOverlay: Could not reset errors of Crownstone", err);
        let defaultAction = () => { eventBus.emit("hideLoading"); };
        Alert.alert("Failed to reset error :(","You can move closer and try again or ignore the error for now.",[{text:'OK', onPress: defaultAction}], { onDismiss: defaultAction});
      });

    BatchCommandHandler.executePriority()
  }

};