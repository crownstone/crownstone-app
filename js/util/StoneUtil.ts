import { Languages } from "../Languages";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("StoneUtil", key)(a,b,c,d,e);
}

import {BatchCommandHandler} from "../logic/BatchCommandHandler";
import {INTENTS} from "../native/libInterface/Constants";
import {LOGe} from "../logging/Log";
import {Scheduler} from "../logic/Scheduler";
import {
  Alert,
} from 'react-native';
import { core } from "../core";
import { BleUtil } from "./BleUtil";
import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";

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

  setupPulse: function (handle, sphereId) {
    let proxy = BleUtil.getProxy(handle, sphereId);
    return proxy.performPriority(BluenetPromiseWrapper.setupPulse);
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

  getStoneObject: function(sphereId, stoneId) {
    let state = core.store.getState();
    let sphere = state.spheres[sphereId];
    if (!sphere) { return null; }
    let stone = sphere.stones[stoneId] || null;
    return stone;
  },

  checkFirmwareVersion: function(sphereId, stoneId, stone?) : Promise<bchReturnType>  {
    if (!stone) { stone = StoneUtil.getStoneObject(sphereId, stoneId) }
    if (!stone) { Promise.reject("NO_STONE") }

    let promise = BatchCommandHandler.load(stone, stoneId, sphereId, {commandName: 'getFirmwareVersion'},{},1, 'from StoneUtil checkFirmware');
    BatchCommandHandler.executePriority();
    return promise;
  },
  checkBootloaderVersion: function(sphereId, stoneId, stone?) : Promise<bchReturnType>  {
    if (!stone) { stone = StoneUtil.getStoneObject(sphereId, stoneId) }
    if (!stone) { Promise.reject("NO_STONE") }

    let promise = BatchCommandHandler.load(stone, stoneId, sphereId, {commandName: 'getBootloaderVersion'},{},1, 'from StoneUtil checkBootloaderVersion');
    BatchCommandHandler.executePriority();
    return promise;
  },

  refreshFirmwareAndHardwareVersion: function(sphereId, stoneId, stone) {
    let results = {hardwareVersion: null, firmwareVersion: null};
    let promiseFW = BatchCommandHandler.load(stone, stoneId, sphereId, {commandName: 'getFirmwareVersion'},{},2, 'from StoneUtil refreshFirmwareAndHardwareVersion').then((result : {data: string}) => { results.hardwareVersion = result.data; });
    let promiseHW = BatchCommandHandler.load(stone, stoneId, sphereId, {commandName: 'getHardwareVersion'},{},2, 'from StoneUtil refreshFirmwareAndHardwareVersion').then((result : {data: string}) => { results.firmwareVersion = result.data; });
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

    core.eventBus.emit("showLoading", lang("Attempting_to_Reset_Error"));
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
        core.eventBus.emit("showLoading", lang("Success_"));
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
        core.eventBus.emit("hideLoading");
        Alert.alert(lang("Success_"), lang("The_Error_has_been_reset_"),[{text:'OK'}]);
      })
      .catch((err) => {
        LOGe.info("ErrorOverlay: Could not reset errors of Crownstone", err);
        let defaultAction = () => { core.eventBus.emit("hideLoading"); };
        Alert.alert(lang("Failed_to_reset_error___"), lang("You_can_move_closer_and_t"),[{text:'OK', onPress: defaultAction}], { onDismiss: defaultAction});
      });

    BatchCommandHandler.executePriority()
  }

};