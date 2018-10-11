import { Languages } from "../Languages";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("StoneUtil", key)(a,b,c,d,e);
}

import {BatchCommandHandler} from "../logic/BatchCommandHandler";
import {INTENTS} from "../native/libInterface/Constants";
import {LOG, LOGe} from "../logging/Log";
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
      options : batchCommandEntryOptions = {},
      finalize = (err, result?: any) => {},
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
      options,
      attempts,
      label
    )
      .then((result) => {
        store.dispatch({
          type: 'UPDATE_STONE_SWITCH_STATE',
          sphereId: sphereId,
          stoneId: stoneId,
          data: data
        });
        finalize(null, result);
      })
      .catch((err) => {
        finalize(err);
      });

    BatchCommandHandler.executePriority(options);
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

  checkFirmwareVersion: function(sphereId, stoneId, stone) : Promise<bchReturnType>  {
    let promise = BatchCommandHandler.load(stone, stoneId, sphereId, {commandName: 'getFirmwareVersion'},{},1, 'from checkFirmware');
    BatchCommandHandler.executePriority();
    return promise;
  },

  refreshFirmwareAndHardwareVersion: function(sphereId, stoneId, stone) {
    let results = {hardwareVersion: null, firmwareVersion: null};
    let promiseFW = BatchCommandHandler.load(stone, stoneId, sphereId, {commandName: 'getFirmwareVersion'},{},2, 'from checkFirmware').then((result : {data: string}) => { results.hardwareVersion = result.data; });
    let promiseHW = BatchCommandHandler.load(stone, stoneId, sphereId, {commandName: 'getHardwareVersion'},{},2, 'from checkFirmware').then((result : {data: string}) => { results.firmwareVersion = result.data; });
    BatchCommandHandler.executePriority();
    return Promise.all([promiseFW, promiseHW])
      .then(() => {
        return results;
      });
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

    eventBus.emit("showLoading", lang("Attempting_to_Reset_Error"));
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
        eventBus.emit("showLoading", lang("Success_"));
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
        Alert.alert(lang("Success_"), lang("The_Error_has_been_reset_"),[{text:'OK'}]);
      })
      .catch((err) => {
        LOGe.info("ErrorOverlay: Could not reset errors of Crownstone", err);
        let defaultAction = () => { eventBus.emit("hideLoading"); };
        Alert.alert(lang("Failed_to_reset_error___"), lang("You_can_move_closer_and_t"),[{text:'OK', onPress: defaultAction}], { onDismiss: defaultAction});
      });

    BatchCommandHandler.executePriority()
  }

};