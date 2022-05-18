import {Languages} from "../Languages";
// import {BatchCommandHandler} from "../logic/BatchCommandHandler";
import {LOGe} from "../logging/Log";
import {Scheduler} from "../logic/Scheduler";
import {Alert,} from 'react-native';
import {core} from "../Core";
import {BEHAVIOUR_TYPES} from "../database/reducers/stoneSubReducers/behaviours";
import {AicoreBehaviour} from "../views/deviceViews/smartBehaviour/supportCode/AicoreBehaviour";
import {xUtil} from "./StandAloneUtil";
import {AicoreUtil} from "../views/deviceViews/smartBehaviour/supportCode/AicoreUtil";
import {from, tell} from "../logic/constellation/Tellers";
import {Get} from "./GetUtil";
import {NavigationUtil} from "./navigation/NavigationUtil";
import {BleUtil} from "./BleUtil";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("StoneUtil", key)(a,b,c,d,e);
}

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


  checkFirmwareVersion: async function(sphereId, stoneId, stone?) : Promise<string>  {
    if (!stone) { stone = Get.stone(sphereId, stoneId) }
    if (!stone) { throw new Error("NO_STONE") }

    return await from(stone).getFirmwareVersion()
  },

  checkBootloaderVersion: async function(sphereId, stoneId, stone?) : Promise<string>  {
    if (!stone) { stone = Get.stone(sphereId, stoneId) }
    if (!stone) { throw new Error("NO_STONE") }

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
      LOGe.info("ErrorOverlay: Could not reset errors of Crownstone", err?.message);
      core.eventBus.emit("hideLoading");
      Alert.alert(lang("Failed_to_reset_error___"), lang("You_can_move_closer_and_t"),[{text:'OK'}]);
    }
  },


  /**
   * This method does NOT warn against overwriting existing behaviours.
   * @param sphereId
   * @param fromStoneId
   * @param toStoneId
   * @param behaviourIds
   */
  copyBehavioursBetweenStones: function(sphereId, fromStoneId, toStoneId, behaviourIds? : string[]) : Promise<boolean> {
    // this will check if the behaviourIds require dimming, and alert the user if he should enable dimming too
    let state = core.store.getState();
    let sphere = state.spheres[sphereId];
    if (!sphere)      { return Promise.resolve(false); }
    let targetStone = sphere.stones[toStoneId];
    if (!targetStone) { return Promise.resolve(false); }
    let sourceStone = sphere.stones[fromStoneId];
    if (!sourceStone) { return Promise.resolve(false); }

    if (!behaviourIds || Array.isArray(behaviourIds) && behaviourIds.length === 0) {
      behaviourIds = Object.keys(sourceStone.behaviours);
    }

    if (behaviourIds.length === 0) {
      return Promise.resolve(false);
    }

    let behavioursRequireDimming = StoneUtil.doBehavioursRequireDimming(sphereId, fromStoneId, behaviourIds);

    let stoneCanDim = targetStone.abilities.dimming.enabledTarget;

    let copyBehaviours = () => {
      let actionProps = {sphereId, stoneId: toStoneId};
      let newBehaviours = sourceStone.behaviours;
      let oldBehaviours = targetStone.behaviours;
      let actions = [];

      // clear the old behaviours.
      Object.keys(oldBehaviours).forEach((behaviourId) => {
        if (oldBehaviours[behaviourId].idOnCrownstone === null) {
          actions.push({type: 'REMOVE_STONE_BEHAVIOUR', ...actionProps, behaviourId: behaviourId})
        }
        else {
          actions.push({type: 'MARK_STONE_BEHAVIOUR_FOR_DELETION', ...actionProps, behaviourId: behaviourId})
        }
      })

      // add the new behaviours
      behaviourIds.forEach((behaviourId) => {
        let newId = xUtil.getUUID(); // new unique id for the copied behaviour
        let behaviour = {...newBehaviours[behaviourId]}; // duplicate the source behaviour
        delete behaviour.cloudId;              // remove cloud id so it will be synced as a unique behaviour
        delete behaviour.updatedAt;            // remove timestamp since this is essentially a new behaviour.
        behaviour.idOnCrownstone = null;       // new behaviours do not already have a behaviourId on the Crownstone.
        behaviour.syncedToCrownstone = false;  // new behaviours are not synced.
        actions.push({type: "ADD_STONE_BEHAVIOUR", ...actionProps, behaviourId: newId, data: behaviour})
      })

      return actions;
    }

    if (behavioursRequireDimming && !stoneCanDim) {
      return new Promise((resolve, reject) => {
        Alert.alert(
          "These behaviours require that dimming is enabled on the Crownstone",
          "Would you like to enable dimming now?",
          [
            {text:'Never mind', onPress: () => { resolve(false)}},
            {text:"Yes",        onPress:() => {
              let actions = copyBehaviours();
              actions.push({type:'UPDATE_DIMMER', sphereId: sphereId, stoneId: toStoneId, data: {enabledTarget: true}});
              core.store.batchDispatch(actions);
              resolve(true);
            }}],
          {onDismiss: () => { resolve(false); }}
        );
      })
    }
    else {
      let actions = copyBehaviours();
      core.store.batchDispatch(actions);
      return Promise.resolve(true);
    }

    return Promise.resolve(false);
  },


  doBehavioursRequireDimming(sphereId, stoneId, behaviourIds) {
    let state = core.store.getState();
    let sphere = state.spheres[sphereId];
    if (!sphere)      { return false; }
    let stone = sphere.stones[stoneId];
    if (!stone) { false; }
    let behaviours = stone.behaviours;

    for (let i = 0; i < behaviourIds.length; i++) {
      if (behaviours[behaviourIds[i]].type === BEHAVIOUR_TYPES.twilight) {
        return true;
      }
      else {
        let behaviour = new AicoreBehaviour(behaviours[behaviourIds[i]].data);
        if (behaviour.willDim()) {
          return true;
        }
      }
    }
  },


  /**
   * this will store the switchstate if it is not already done. Used for dimmers which use the "TRANSIENT" action.
   */
  safeStoreUpdate(sphereId, stoneId, storedSwitchState) {
    const state = core.store.getState();
    const sphere = state.spheres[sphereId];
    if (!sphere) { return storedSwitchState; }

    const stone = sphere.stones[stoneId];
    if (!stone) { return storedSwitchState; }

    if (stone.state.state !== storedSwitchState) {
      let data = {state: stone.state.state};
      if (stone.state.state === 0) {
        data['currentUsage'] = 0;
      }
      core.store.dispatch({
        type: 'UPDATE_STONE_SWITCH_STATE',
        sphereId: sphereId,
        stoneId: stoneId,
        data: data
      });

      return stone.state.state;
    }

    return storedSwitchState;
  },


  async lockCrownstone(sphereId, stoneId) {
    try {
      setLockCrownstoneState(sphereId, stoneId, lang("Locking_Crownstone___"), true);
    }
    catch (e) {
      Alert.alert(
        lang("_Im_sorry____Something_we_header"),
        lang("_Im_sorry____Something_we_body"),
        [{text:lang("_Im_sorry____Something_we_left")}]);
    }
  },

  async unlockCrownstone(sphereId, stoneId) {
    try {
      setLockCrownstoneState(sphereId, stoneId, lang("Unlocking_Crownstone___"), false);
    }
    catch (e) {
      Alert.alert(
        lang("_Im_sorry____Something_we_header"),
        lang("_Im_sorry____Something_we_body"),
        [{text:lang("_Im_sorry____Something_we_left")}]);
    }
  },


  async discoverCrownstone(stone: StoneData) : Promise<{discovered: boolean, mode?: 'setup' | 'operation'}> {
    try {
      let setupMode = await BleUtil.detectCrownstone(stone.config.handle);
      return {discovered: true, mode: setupMode ? "setup" : "operation"};
    }
    catch (err) {
      return {discovered: false};
    }
  }
};

async function setLockCrownstoneState(sphereId: string, stoneId: string, label: string, lockState: boolean) {
  let stone = Get.stone(sphereId, stoneId);

  core.eventBus.emit("showLoading", label);
  try {
    await tell(stone).lockSwitch(lockState);
    core.eventBus.emit("showLoading", lang("Done!"));
    await Scheduler.delay(500);
    core.eventBus.emit("hideLoading");
    core.store.dispatch({type:"UPDATE_STONE_CONFIG", sphereId: sphereId, stoneId: stoneId, data: {locked: lockState}});
  }
  catch (e) {
    core.eventBus.emit("hideLoading");
    throw e;
  }
}