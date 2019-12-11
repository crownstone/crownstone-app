import { core } from "../core";
import { StoneAvailabilityTracker } from "../native/advertisements/StoneAvailabilityTracker";
import { BatchCommandHandler } from "../logic/BatchCommandHandler";
import { DataUtil } from "../util/DataUtil";
import { xUtil } from "../util/StandAloneUtil";
import { AicoreBehaviour } from "../views/deviceViews/smartBehaviour/supportCode/AicoreBehaviour";
import { BCH_ERROR_CODES, BEHAVIOUR_TYPES } from "../Enums";
import { Permissions } from "./PermissionManager";
import { BluenetPromise, BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { LOGi } from "../logging/Log";
import { sync } from "../cloud/sections/sync/sync";


const ABILITY_SYNCER_OWNER_ID = "ABILITY_SYNCER_OWNER_ID";
const RULE_SYNCER_OWNER_ID    = "RULE_SYNCER_OWNER_ID";

class StoneDataSyncerClass {
  initialized = false;

  masterHashTracker = {}

  constructor() {}

  init() {
    if (this.initialized === false) {
      this.initialized = true;

      core.eventBus.on("databaseChange", (data) => {
        let change = data.change;
        if (
          change.changeSphereState ||
          change.stoneChangeRules  ||
          change.stoneChangeAbilities
        ) {
          this.update();
        }
      });

      this.update();
    }
  }


  update() {
    let state = core.store.getState();
    let sphereIds = Object.keys(state.spheres);

    for (let i = 0; i < sphereIds.length; i++) {

      // update the list with this sphere.
      if (this.masterHashTracker[sphereIds[i]] === undefined) { this.masterHashTracker[sphereIds[i]] = {}; }

      let sphere = state.spheres[sphereIds[i]];
      if (sphere.state.present) {
        let stoneIds = Object.keys(sphere.stones);
        for (let j = 0; j < stoneIds.length; j++) {
          let stone = sphere.stones[stoneIds[j]];

          // update the list with this stone.
          if (this.masterHashTracker[sphereIds[i]][stoneIds[j]] === undefined) { this.masterHashTracker[sphereIds[i]][stoneIds[j]] = null; }

          // clear the triggers since this method can be fired repeatedly
          StoneAvailabilityTracker.clearMySetTriggers(sphereIds[i], stoneIds[j], ABILITY_SYNCER_OWNER_ID);
          StoneAvailabilityTracker.clearMySetTriggers(sphereIds[i], stoneIds[j], RULE_SYNCER_OWNER_ID);

          // handle abilities
          if (Permissions.inSphere(sphereIds[i]).canChangeAbilities) {
            this._syncAbility(sphereIds[i], stoneIds[j], stone.abilities.dimming, 'dimming');
            this._syncAbility(sphereIds[i], stoneIds[j], stone.abilities.switchcraft, 'switchcraft');
            this._syncAbility(sphereIds[i], stoneIds[j], stone.abilities.tapToToggle, 'tapToToggle');
          }

          // handle rules
          if (Permissions.inSphere(sphereIds[i]).canChangeBehaviours) {
            let ruleIds = Object.keys(stone.rules);
            let rulePromises = [];
            let syncRequired = false;
            for (let k = 0; k < ruleIds.length; k++) {
              let rule = stone.rules[ruleIds[k]];
              if (!rule.syncedToCrownstone) {
                rulePromises.push(this._syncRule(sphereIds[i], stoneIds[j], ruleIds[k], stone, rule));
                syncRequired = true;
              }
            }

            if (syncRequired) {
              BatchCommandHandler.executePriority();
              Promise.all(rulePromises)
                .then(() => {
                  return this.checkAndSyncBehaviour(sphereIds[i], stoneIds[i]);
                })
                .catch((err) => {
                  if (err && err.code && err.code !== BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
                    /** if the syncing fails, we set another watcher **/
                    this.update();
                  }
                })
            }
          }
        }
      }
    }
  }


  _syncAbility(sphereId, stoneId, initialAbility, abilityType) {
    if (!initialAbility.syncedToCrownstone) {
      switch (abilityType) {
        case "dimming":
          this._syncGenericAbility(
            sphereId, stoneId, "dimming",
            (ability) => { return {commandName:'allowDimming', value: ability.enabledTarget}},
            (ability) => {
              let actions = [];
              actions.push({type: "UPDATE_ABILITY_DIMMER",         sphereId: sphereId, stoneId: stoneId, data: { enabled: ability.enabledTarget}});
              actions.push({type: "MARK_ABILITY_DIMMER_AS_SYNCED", sphereId: sphereId, stoneId: stoneId});
              core.store.batchDispatch(actions);
            }
          );
          break;
        case "switchcraft":
          this._syncGenericAbility(
            sphereId, stoneId, "switchcraft",
            (ability) => { return {commandName:'setSwitchCraft', value: ability.enabledTarget}},
            (ability) => {
              let actions = [];
              actions.push({type: "UPDATE_ABILITY_SWITCHCRAFT",         sphereId: sphereId, stoneId: stoneId, data:{ enabled: ability.enabledTarget}});
              actions.push({type: "MARK_ABILITY_SWITCHCRAFT_AS_SYNCED", sphereId: sphereId, stoneId: stoneId});
              core.store.batchDispatch(actions);
            }
          );
          break;
        case "tapToToggle":
          this._syncTapToToggle(sphereId, stoneId);
          break;
      }
    }
  }

  _syncTapToToggle(sphereId : string, stoneId : string) {
    StoneAvailabilityTracker.setTrigger(sphereId, stoneId, ABILITY_SYNCER_OWNER_ID, () => {
      // we get it again and check synced again to ensure that we are sending the latest data and that we're not doing duplicates.
      let stone = DataUtil.getStone(sphereId, stoneId);
      if (!stone) { return };
      let ability = stone.abilities.tapToToggle;
      if (ability.syncedToCrownstone) { return; }

      BatchCommandHandler.load(stone, stoneId, sphereId,{commandName:'setTapToToggle', value: ability.enabledTarget}, {}, 2)
        .then(() => {
          let actions = [];
          actions.push({type: "UPDATE_ABILITY_TAP_TO_TOGGLE",         sphereId: sphereId, stoneId: stoneId, data:{ enabled: ability.enabledTarget}});
          actions.push({type: "MARK_ABILITY_TAP_TO_TOGGLE_AS_SYNCED", sphereId: sphereId, stoneId: stoneId});
          core.store.batchDispatch(actions);
        })
        .catch((err) => {
          if (err && err.code && err.code !== BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
            console.log("FAILED SET TAP TO TOGGLE", err)
            /** if the syncing fails, we set another watcher **/
            this.update();
          }
        });

      BatchCommandHandler.load(stone, stoneId, sphereId,{commandName:'setTapToToggleThresholdOffset', rssiOffset: ability.rssiOffset}, {}, 2)
        .then(() => {
          let actions = [];
          actions.push({type: "UPDATE_ABILITY_TAP_TO_TOGGLE",         sphereId: sphereId, stoneId: stoneId, data: { rssiOffset: ability.rssiOffset}});
          actions.push({type: "MARK_ABILITY_TAP_TO_TOGGLE_AS_SYNCED", sphereId: sphereId, stoneId: stoneId});
          core.store.batchDispatch(actions);
        })
        .catch((err) => {
          if (err && err.code && err.code !== BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
            console.log("FAILED SET TAP TO TOGGLE OFFSET", err)
            /** if the syncing fails, we set another watcher **/
            this.update();
          }
        });
      BatchCommandHandler.executePriority();
    })
  }

  _syncGenericAbility(sphereId : string, stoneId : string, abilityField : string, actionGetter: (ability) => commandInterface, callback : (ability) => void) {
    StoneAvailabilityTracker.setTrigger(sphereId, stoneId, ABILITY_SYNCER_OWNER_ID, () => {
      // we get it again and check synced again to ensure that we are sending the latest data and that we're not doing duplicates.
      let stone = DataUtil.getStone(sphereId, stoneId);
      if (!stone) { return };
      let ability = stone.abilities[abilityField];
      if (ability.syncedToCrownstone) { return; }

      BatchCommandHandler.load(stone, stoneId, sphereId, actionGetter(ability), {}, 2)
        .then(() => { callback(ability); })
        .catch((err) => {
          if (err && err.code && err.code !== BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
            /** if the syncing fails, we set another watcher **/
            this.update();
          }
        });
      BatchCommandHandler.executePriority();
    })
  }


  _syncRule(sphereId, stoneId, ruleId, stone, rule : behaviourWrapper) : Promise<void> {
    if (rule.deleted) {
      if (rule.idOnCrownstone !== null) {
        return BatchCommandHandler.loadPriority(stone, stoneId, sphereId, { commandName: "removeBehaviour", index: rule.idOnCrownstone},{ keepConnectionOpen: true, keepConnectionOpenTimeout: 100})
          .then((returnData) => {
            core.store.dispatch({type: "REMOVE_STONE_RULE", sphereId: sphereId, stoneId: stoneId, ruleId: ruleId});
            let masterHash = returnData.data && returnData.data.masterHash || null;
            this.masterHashTracker[sphereId][stoneId] = masterHash;
          })
          .catch((err) => {
            console.log("Error while removing", err);
            throw err;
          })
      }
      else {
        core.store.dispatch({type: "REMOVE_STONE_RULE", sphereId: sphereId, stoneId: stoneId, ruleId: ruleId});
        return Promise.resolve(null)
      }
    }
    else {
      let behaviour = xUtil.deepCopy(rule);
      if (typeof behaviour.data === 'string') {
        behaviour.data = JSON.parse(behaviour.data);
      }

      if (rule.idOnCrownstone !== null) {
        return BatchCommandHandler.loadPriority(stone, stoneId, sphereId, { commandName: "updateBehaviour", behaviour: behaviour}, { keepConnectionOpen: true, keepConnectionOpenTimeout: 100})
          .then((returnData) => {
            core.store.dispatch({type: "UPDATE_STONE_RULE", sphereId: sphereId, stoneId: stoneId, ruleId: ruleId, data:{syncedToCrownstone: true}});
            let masterHash = returnData.data && returnData.data.masterHash || null;
            this.masterHashTracker[sphereId][stoneId] = masterHash;
          })
          .catch((err) => {
            console.log("Error during rule update", err);
            throw err;
          })
      }
      else {
        return BatchCommandHandler.loadPriority(stone, stoneId, sphereId, { commandName: "addBehaviour", behaviour: behaviour}, { keepConnectionOpen: true, keepConnectionOpenTimeout: 100})
          .then((returnData) => {
            let index = returnData.data.index;
            let masterHash = returnData.data && returnData.data.masterHash || null;
            this.masterHashTracker[sphereId][stoneId] = masterHash;

            // handle duplicates!
            let stone = DataUtil.getStone(sphereId, stoneId);
            if (stone) {
              let rules = stone.rules;
              let ruleIds = Object.keys(rules);
              for (let i = 0; i < ruleIds.length; i++) {
                let rule = rules[ruleIds[i]];
                if (rule.idOnCrownstone === index && ruleId !== ruleIds[i]) {
                  // this rule is a duplicate &&
                  core.store.dispatch({type: "REMOVE_STONE_RULE", sphereId: sphereId, stoneId: stoneId, ruleId: ruleId});
                  return
                }
              }
            }

            core.store.dispatch({type: "UPDATE_STONE_RULE", sphereId: sphereId, stoneId: stoneId, ruleId: ruleId, data:{syncedToCrownstone: true, idOnCrownstone: index}});
          })
          .catch((err) => {
            console.log("Error during rule create", err);
            throw err;
          })
      }
    }
  }



  checkAndSyncBehaviour(sphereId, stoneId) : Promise<behaviourTransfer[]> {
    let stone = DataUtil.getStone(sphereId,stoneId);

    let ruleIds = Object.keys(stone.rules);
    let transferRules = [];
    for (let k = 0; k < ruleIds.length; k++) {
      let rule = stone.rules[ruleIds[k]];
      let behaviour = xUtil.deepCopy(rule);
      if (typeof behaviour.data === 'string') {
        behaviour.data = JSON.parse(behaviour.data);
      }
      transferRules.push(behaviour);
    }

    if (transferRules.length === 0) { return Promise.resolve([]); }

    return BluenetPromiseWrapper.getBehaviourMasterHash(transferRules)
      .then((masterHash) => {
        console.log("HERE", masterHash, this.masterHashTracker[sphereId][stoneId])
        if (this.masterHashTracker[sphereId][stoneId] !== masterHash) {
          // SYNC!
          LOGi.behaviour("Syncing behaviours now... My Master Hash", masterHash, " vs Crownstone hash", this.masterHashTracker[sphereId][stoneId])
          console.log(" trying to sync ")
          let commandPromise = BatchCommandHandler.loadPriority(stone, stoneId, sphereId, { commandName: "syncBehaviour", behaviours: transferRules});
          BatchCommandHandler.executePriority();
          return commandPromise
        }
        throw "NO_SYNC_REQUIRED"
      })
      .then((behaviours) => {
        if (behaviours) {

        }
        LOGi.behaviour("DONE Syncing! \(behaviours)");

        BatchCommandHandler.closeKeptOpenConnection();
        // TODO: Check in cloud.
        return [];
      })
      .catch((err) => {
        if (err == "NO_SYNC_REQUIRED") {
          LOGi.behaviour("DONE Syncing! NOT REQUIRED!");
          BatchCommandHandler.closeKeptOpenConnection();
          return transferRules;
        }

        console.log("Error during rule sync", err);
        throw err;
      })

  }

}



export const StoneDataSyncer = new StoneDataSyncerClass();