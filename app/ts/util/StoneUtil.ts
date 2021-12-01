import { Languages } from "../Languages";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("StoneUtil", key)(a,b,c,d,e);
}

// import {BatchCommandHandler} from "../logic/BatchCommandHandler";
import {INTENTS} from "../native/libInterface/Constants";
import {LOGe} from "../logging/Log";
import {Scheduler} from "../logic/Scheduler";
import {
  Alert,
} from 'react-native';
import { core } from "../Core";
import { BleUtil } from "./BleUtil";
import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { BEHAVIOUR_TYPES } from "../database/reducers/stoneSubReducers/behaviours";
import { AicoreBehaviour } from "../views/deviceViews/smartBehaviour/supportCode/AicoreBehaviour";
import { xUtil } from "./StandAloneUtil";
import { AicoreUtil } from "../views/deviceViews/smartBehaviour/supportCode/AicoreUtil";
import { from, tell } from "../logic/constellation/Tellers";
import { MapProvider } from "../backgroundProcesses/MapProvider";
import { Get } from "./GetUtil";

export const StoneUtil = {

  multiSwitch: async function (stone : any, newState : number, allowMeshRelay: boolean = true, transient = false) : Promise<void> {
    let data = {state: newState};
    if (newState === 0) {
      data['currentUsage'] = 0;
    }

    let sphereId = Get.sphereId(stone.id);
    if (!sphereId) { throw new Error("NO_SPHERE_ID"); }
    await tell(stone).multiSwitch(newState, allowMeshRelay);

    core.store.dispatch({
      type: transient ? 'UPDATE_STONE_SWITCH_STATE_TRANSIENT' : 'UPDATE_STONE_SWITCH_STATE',
      sphereId: sphereId,
      stoneId: stone.id,
      data: data
    });
  },

  turnOn: async function (stone : any, allowMeshRelay: boolean = true) {
    let sphereId = Get.sphereId(stone.id);
    if (!sphereId) { throw new Error("NO_SPHERE_ID"); }
    await tell(stone).turnOn(allowMeshRelay);

    let expectedState = AicoreUtil.getActiveTurnOnPercentage(sphereId, stone)
    core.store.dispatch({
      type: 'UPDATE_STONE_SWITCH_STATE',
      sphereId: sphereId,
      stoneId: stone.id,
      data: {state: expectedState}
    });
    return expectedState;
  },

  turnOff: async function (stone : any, allowMeshRelay: boolean = true) {
    return StoneUtil.multiSwitch(stone, 0, allowMeshRelay);
  },

  //
  // setupPulse: function (handle, sphereId) {
  //   let proxy = BleUtil.getProxy(handle, sphereId);
  //   return proxy.performPriority(BluenetPromiseWrapper.setupPulse);
  // },


  getStoneObject: function(sphereId, stoneId) {
    let state = core.store.getState();
    let sphere = state.spheres[sphereId];
    if (!sphere) { return null; }
    let stone = sphere.stones[stoneId] || null;
    return stone;
  },

  checkFirmwareVersion: async function(sphereId, stoneId, stone?) : Promise<string>  {
    if (!stone) { stone = StoneUtil.getStoneObject(sphereId, stoneId) }
    if (!stone) { Promise.reject(new Error("NO_STONE")) }

    return await from(stone).getFirmwareVersion()
  },

  checkBootloaderVersion: async function(sphereId, stoneId, stone?) : Promise<string>  {
    if (!stone) { stone = StoneUtil.getStoneObject(sphereId, stoneId) }
    if (!stone) { Promise.reject(new Error("NO_STONE")) }

    return await from(stone).getBootloaderVersion()
  },


  clearErrors: async function(sphereId, stoneId, stone, store) {
    let clearTheseErrors = {
      dimmerOnFailure:    true,
      dimmerOffFailure:   true,
      temperatureDimmer:  true,
      temperatureChip:    true,
      overCurrentDimmer:  true,
      overCurrent:        true,
    };

    core.eventBus.emit("showLoading", lang("Attempting_to_Reset_Error"));
    try {
      await tell(stone).clearErrors(clearTheseErrors)
      core.eventBus.emit("showLoading", lang("Success_"));
      store.dispatch({type: 'RESET_STONE_ERRORS', sphereId: sphereId, stoneId: stoneId, data: {
        dimmerOnFailure:    false,
        dimmerOffFailure:   false,
        temperatureDimmer:  false,
        temperatureChip:    false,
        overCurrentDimmer:  false,
        overCurrent:        false,
      }});
      await Scheduler.delay(500);
      core.eventBus.emit("hideLoading");
      Alert.alert(lang("Success_"), lang("The_Error_has_been_reset_"),[{text:'OK'}]);
    }
    catch (err) {
      LOGe.info("ErrorOverlay: Could not reset errors of Crownstone", err);
      core.eventBus.emit("hideLoading");
      Alert.alert(lang("Failed_to_reset_error___"), lang("You_can_move_closer_and_t"),[{text:'OK'}]);
    }
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
          actions.push({type: 'REMOVE_STONE_BEHAVIOUR', ...actionProps, ruleId: ruleId})
        }
        else {
          actions.push({type: 'MARK_STONE_BEHAVIOUR_FOR_DELETION', ...actionProps, ruleId: ruleId})
        }
      })

      // add the new rules
      ruleIds.forEach((ruleId) => {
        let newId = xUtil.getUUID(); // new unique id for the copied rule
        let rule = {...newRules[ruleId]}; // duplicate the source rule
        delete rule.cloudId;              // remove cloud id so it will be synced as a unique rule
        delete rule.updatedAt;            // remove timestamp since this is essentially a new rule.
        rule.idOnCrownstone = null;       // new rules do not already have a ruleId on the Crownstone.
        rule.syncedToCrownstone = false;  // new rules are not synced.
        actions.push({type: "ADD_STONE_BEHAVIOUR", ...actionProps, ruleId: newId, data: rule})
      })

      return actions;
    }

    if (rulesRequireDimming && !stoneCanDim) {
      return new Promise((resolve, reject) => {
        Alert.alert(
          "These behaviours require that dimming is enabled on the Crownstone",
          "Would you like to enable dimming now?",
          [
            {text:'Never mind', onPress: () => { resolve(false)}},
            {text:"Yes",        onPress:() => {
              let actions = copyRules();
              actions.push({type:'UPDATE_DIMMER', sphereId: sphereId, stoneId: toStoneId, data: {enabledTarget: true}});
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