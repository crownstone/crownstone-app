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
import { BEHAVIOUR_TYPES } from "../router/store/reducers/stoneSubReducers/rules";
import { AicoreBehaviour } from "../views/deviceViews/smartBehaviour/supportCode/AicoreBehaviour";
import { act } from "react-test-renderer";
import { xUtil } from "./StandAloneUtil";

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
        core.eventBus.emit("hideLoading");
        Alert.alert(lang("Failed_to_reset_error___"), lang("You_can_move_closer_and_t"),[{text:'OK'}]);
      });

    BatchCommandHandler.executePriority()
  },


  /**
   * This method does NOT warn against overwriting existing rules.
   * @param sphereId
   * @param fromStoneId
   * @param toStoneId
   * @param ruleIds
   */
  copyRulesBetweenStones: function(sphereId, fromStoneId, toStoneId, ruleIds? : string[]) : Promise<boolean> {
    // this will check if the ruleIds require dimming, and alert the user if he should enable dimming too
    let state = core.store.getState();
    let sphere = state.spheres[sphereId];
    if (!sphere)      { return Promise.resolve(false); }
    let targetStone = sphere.stones[toStoneId];
    if (!targetStone) { return Promise.resolve(false); }
    let sourceStone = sphere.stones[fromStoneId];
    if (!sourceStone) { return Promise.resolve(false); }

    if (!ruleIds || Array.isArray(ruleIds) && ruleIds.length === 0) {
      ruleIds = Object.keys(sourceStone.rules);
    }

    if (ruleIds.length === 0) {
      return Promise.resolve(false);
    }

    let rulesRequireDimming = StoneUtil.doRulesRequireDimming(sphereId, fromStoneId, ruleIds);

    let stoneCanDim = targetStone.abilities.dimming.enabledTarget;

    let copyRules = () => {
      let actionProps = {sphereId, stoneId: toStoneId};
      let newRules = sourceStone.rules;
      let oldRules = targetStone.rules;
      let actions = [];

      // clear the old rules.
      Object.keys(oldRules).forEach((ruleId) => {
        if (oldRules[ruleId].idOnCrownstone === null) {
          actions.push({type: 'REMOVE_STONE_RULE', ...actionProps, ruleId: ruleId})
        }
        else {
          actions.push({type: 'MARK_STONE_RULE_FOR_DELETION', ...actionProps, ruleId: ruleId})
        }
      })

      // add the new rules
      ruleIds.forEach((ruleId) => {
        let newId = xUtil.getUUID(); // new unique id for the copied rule
        let rule = {...newRules[ruleId]}; // duplicate the source rule
        delete rule.cloudId;              // remove cloud id so it will be synced as a unique rule
        delete rule.updatedAt;            // remove timestamp since this is essentially a new rule.
        rule.idOnCrownstone     = null;   // new rules do not already have a ruleId on the Crownstone.
        actions.push({type: "ADD_STONE_RULE", ...actionProps, ruleId: newId, data: rule})
      })

      return actions;
    }

    if (rulesRequireDimming && !stoneCanDim) {
      return new Promise((resolve, reject) => {
        Alert.alert(
          "These behaviours require that dimming is enabled on the Crownstone",
          "Would you like to enable dimming now?",
          [
            {text:'Neve rmind', onPress: () => { resolve(false)}},
            {text:"Yes",       onPress:() => {
              let actions = copyRules();
              actions.push({type:'UPDATE_DIMMER', sphereId: sphereId, stoneId: toStoneId, data: {enabledState: true}});
              core.store.batchDispatch(actions);
              resolve(true);
            }}],
          {onDismiss: () => { resolve(false); }}
        );
      })
    }
    else {
      let actions = copyRules();
      core.store.batchDispatch(actions);
      return Promise.resolve(true);
    }

    return Promise.resolve(false);
  },


  doRulesRequireDimming(sphereId, stoneId, ruleIds) {
    let state = core.store.getState();
    let sphere = state.spheres[sphereId];
    if (!sphere)      { return false; }
    let stone = sphere.stones[stoneId];
    if (!stone) { false; }
    let rules = stone.rules;

    for (let i = 0; i < ruleIds.length; i++) {
      if (rules[ruleIds[i]].type === BEHAVIOUR_TYPES.twilight) {
        return true;
      }
      else {
        let rule = new AicoreBehaviour(rules[ruleIds[i]].data);
        if (rule.willDim()) {
          return true;
        }
      }
    }

  }
};