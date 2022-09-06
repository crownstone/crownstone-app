import {Languages} from "../Languages";
// import {BatchCommandHandler} from "../logic/BatchCommandHandler";
import {LOG, LOGe} from "../logging/Log";
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
import {CLOUD} from "../cloud/cloudAPI";
import {SortingManager} from "../logic/SortingManager";
import {DataUtil} from "./DataUtil";
import {StoneAvailabilityTracker} from "../native/advertisements/StoneAvailabilityTracker";
import {HubHelper} from "../native/setup/HubHelper";
import {STONE_TYPES} from "../Enums";
import { Util } from "./Util";
import { MINIMUM_REQUIRED_FIRMWARE_VERSION } from "../ExternalConfig";

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

  canSwitch(stone) : boolean {
    let canSwitch      = true;

    switch (stone.config.type) {
      case STONE_TYPES.guidestone:
      case STONE_TYPES.crownstoneUSB:
      case STONE_TYPES.hub:
      case STONE_TYPES.prototypeNoSwitching:
        canSwitch = false;
        break;
    }

    return canSwitch;
  },

  canDim(stone) : boolean {
    let canDim = false;

    switch (stone.config.type) {
      case STONE_TYPES.plug:
      case STONE_TYPES.builtin:
      case STONE_TYPES.builtinOne:
      case STONE_TYPES.prototypeRelayDimmer:
        canDim = true;
    }

    return canDim;
  },

  canSwitchCraft(stone) : boolean {
    let canSwitchCraft = false;

    switch (stone.config.type) {
      case STONE_TYPES.builtinOne:
      case STONE_TYPES.prototypeRelay:
      case STONE_TYPES.prototypeRelayDimmer:
        canSwitchCraft = true;
        break;
    }

    return canSwitchCraft;
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


  async lookForCrownstone(stone: StoneData) : Promise<{found: boolean, mode?: 'setup' | 'operation'}> {
    try {
      let setupMode = await BleUtil.detectCrownstone(stone.config.handle);
      return {found: true, mode: setupMode ? "setup" : "operation"};
    }
    catch (err) {
      return {found: false};
    }
  },


  remove: {
    crownstone: {
      now: async function(sphereId: sphereId, stoneId: stoneId) : Promise<void> {
        let stone = Get.stone(sphereId, stoneId);
        if (!stone) { return; }

        core.eventBus.emit('showLoading', lang("Looking_for_the_Crownston"));
        let {found, mode} = await StoneUtil.lookForCrownstone(stone);
        if (!found) {
          Alert.alert(
            lang("_Cant_see_this_one___We_c_header"),
            lang("_Cant_see_this_one___We_c_body"),
            [
              {
                text:lang("_Cant_see_this_one___We_c_left"),
                style: 'destructive',
                onPress: async () => {
                  await StoneUtil.remove.crownstone.withoutReset(sphereId, stoneId);

                  core.eventBus.emit('hideLoading');
                  NavigationUtil.dismissModal();
                },
              },
              { text:lang("_Cant_see_this_one___We_c_right"),
                style: "cancel",
                onPress: () => {
                  core.eventBus.emit('hideLoading');
                }
              },
            ], {cancelable:false}
          );
          return;
        }

        if (mode === 'setup') {
          await StoneUtil.remove.crownstone.withoutReset(sphereId, stoneId);

          core.eventBus.emit('hideLoading');
          NavigationUtil.dismissModal();
          return;
        }

        try {
          await StoneUtil.remove.crownstone.factoryReset(stone);
        }
        catch (err) {
          Alert.alert(
            lang("_Encountered_a_problem____header"),
            lang("_Encountered_a_problem____body"),
            [{
              text:lang("_Encountered_a_problem____left"),
              style:'destructive',
              onPress: async () => {
                await StoneUtil.remove.crownstone.withoutReset(sphereId, stoneId);

                core.eventBus.emit('hideLoading');
                NavigationUtil.dismissModal();
              }},
              {
                text:lang("_Encountered_a_problem____right")
              }
            ], {cancelable:false});
          return;
        }

        // discovered Crownstone in operation mode
        try {
          await StoneUtil.remove.crownstone.fromCloud(sphereId, stoneId);
        }
        catch (err) {}

        core.eventBus.emit('hideLoading');
        StoneUtil.remove.shared.fromRedux(sphereId, stoneId,true);
      },


      withoutReset: async function(sphereId: sphereId, stoneId: stoneId) {
        try {
          await StoneUtil.remove.crownstone.fromCloud(sphereId, stoneId);
          StoneUtil.remove.shared.fromRedux(sphereId, stoneId, false);
        }
        catch(err) {}
      },


      fromCloud: async function(sphereId: sphereId, stoneId: stoneId)  {
        core.eventBus.emit('showLoading', lang("Removing_the_Crownstone_fr"));
        CLOUD.forSphere(sphereId).deleteStone(stoneId)
          .catch((err) => {
            return new Promise<void>((resolve, reject) => {
              if (err && err?.status === 404) {
                resolve();
              }
              else {
                LOGe.info("COULD NOT DELETE IN CLOUD", err?.message);
                reject();
              }
            })
          })
          .catch((err) => {
            LOG.info("error while asking the cloud to remove this crownstone", err?.message);
            core.eventBus.emit('hideLoading');
            Alert.alert(
              lang("_Encountered_Cloud_Issue__header"),
              lang("_Encountered_Cloud_Issue__body"),
              [{text:lang("_Encountered_Cloud_Issue__left")
              }]);
            throw err;
          })
      },


      factoryReset: async function(stone) {
        core.eventBus.emit('showLoading', lang("Factory_resetting_the_Cro"));
        try {
          await tell(stone).commandFactoryReset();
        }
        catch(err) {
          LOGe.info("DeviceEdit: error during removeCloudReset, commandFactoryReset phase.", err?.message);
          core.eventBus.emit('hideLoading');
          throw err;
        };
      },

    },
    hub: {
      now: async function(sphereId: sphereId, stoneId: stoneId) {
        if (StoneAvailabilityTracker.isDisabled(stoneId)) {
          Alert.alert(lang("Cant_see_this_one_"),
            lang("This_Crownstone_has_not_b"),
            [{
              text: lang("Delete_anyway"), onPress: () => {
                StoneUtil.remove.hub.fromCloud(sphereId, stoneId)
              }, style: 'destructive'
            },
              {
                text: lang("Cancel"), style: 'cancel', onPress: () => {
                }
              }]
          )
        }
        else {
          Alert.alert(
            lang("Are_you_sure_you_want_to_"),
            lang("This_cannot_be_undone_"),
            [{
              text: "Delete", onPress: async () => {
                core.eventBus.emit('showLoading', lang("Resetting_hub___"));
                let helper = new HubHelper();
                try {
                  await helper.factoryResetHub(sphereId, stoneId);
                  StoneUtil.remove.shared.fromRedux(sphereId, stoneId);
                }
                catch (err) {
                  core.eventBus.emit('hideLoading');
                  if (err?.message === "HUB_REPLY_TIMEOUT") {
                    Alert.alert(lang("The_hub_is_not_responding"),
                      lang("If_this_hub_is_broken__yo"),
                      [{
                        text: lang("Delete_anyway"), onPress: () => {
                          StoneUtil.remove.crownstone.now(sphereId, stoneId).catch((err) => {});
                        }, style: 'destructive'
                      }, {text: lang("Cancel"), style: 'cancel'}]);
                  }
                  else {
                    Alert.alert(
                      lang("_Something_went_wrong_____header"),
                      lang("_Something_went_wrong_____body"),
                      [{text: lang("_Something_went_wrong_____left")}]);
                  }
                }
              }, style: 'destructive'
            }, {text: lang("Cancel"), style: 'cancel'}])
        }
      },

      fromCloud: async function(sphereId: sphereId, stoneId: stoneId)  {
        core.eventBus.emit('showLoading', lang("Removing_the_Crownstone_fr"));
        let hub = DataUtil.getHubByStoneId(sphereId, stoneId);
        if (hub && hub.config.cloudId) {
          CLOUD.deleteHub(hub.config.cloudId)
            .catch((err) => {
              return new Promise<void>((resolve, reject) => {
                if (err && err?.status === 404) {
                  resolve();
                }
              })
            })
        }
        StoneUtil.remove.crownstone.fromCloud(sphereId, stoneId);
      },
    },
    shared: {
      fromRedux(sphereId: sphereId, stoneId: stoneId, factoryReset = false) {
        let hub = DataUtil.getHubByStoneId(sphereId, stoneId);

        let labelText =  lang("I_have_removed_this_Crown");
        if (hub) {
          labelText =  lang("I_have_removed_this_Hub");
        }
        else {
          if (factoryReset === false) {
            labelText =  lang("I_have_removed_this_Crowns");
          }
        }

        Alert.alert(
          lang("_Success__arguments___OKn_header"),
          lang("_Success__arguments___OKn_body",labelText),
          [{text:lang("_Success__arguments___OKn_left"), onPress: () => {
              SortingManager.removeFromLists(stoneId);
              core.store.dispatch({type: "REMOVE_STONE", sphereId: sphereId, stoneId: stoneId});
              if (hub) {
                SortingManager.removeFromLists(hub.id);
                core.store.dispatch({type: "REMOVE_HUB", sphereId: sphereId, hubId: hub.id});
              }
            }}]
        )
      }
    }
  },

  shouldUpdateBeforeBeingUsed: function(stone: StoneData) : boolean {
    if (stone.config.firmwareVersion && xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION) === false) {
      return true;
    }
    return false
  }
};

async function setLockCrownstoneState(sphereId: string, stoneId: string, label: string, lockState: boolean) {
  let stone = Get.stone(sphereId, stoneId);

  core.eventBus.emit("showLoading", label);
  try {
    await tell(stone).lockSwitch(lockState);
    core.eventBus.emit("showLoading", lang('Success_'));
    await Scheduler.delay(500);
    core.eventBus.emit("hideLoading");
    core.store.dispatch({type:"UPDATE_STONE_CONFIG", sphereId: sphereId, stoneId: stoneId, data: {locked: lockState}});
  }
  catch (e) {
    core.eventBus.emit("hideLoading");
    throw e;
  }
}
