import { core } from "../core";
import { StoneAvailabilityTracker } from "../native/advertisements/StoneAvailabilityTracker";
import { BatchCommandHandler } from "../logic/BatchCommandHandler";
import { DataUtil } from "../util/DataUtil";
import { xUtil } from "../util/StandAloneUtil";
import { BCH_ERROR_CODES } from "../Enums";
import { Permissions } from "./PermissionManager";
import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { LOGi } from "../logging/Log";
import { CLOUD } from "../cloud/cloudAPI";
import { StoneBehaviourSyncer } from "../cloud/sections/sync/modelSyncs/StoneBehaviourSyncer";
import { MapProvider } from "./MapProvider";
import { getGlobalIdMap } from "../cloud/sections/sync/modelSyncs/SyncingBase";


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


  update(ruleSyncRequired = false) {
    let state = core.store.getState();
    let sphereIds = Object.keys(state.spheres);

    for (let i = 0; i < sphereIds.length; i++) {
      let sphereId = sphereIds[i];
      // update the list with this sphere.
      if (this.masterHashTracker[sphereId] === undefined) { this.masterHashTracker[sphereId] = {}; }

      let sphere = state.spheres[sphereId];
      if (sphere.state.present) {
        let stoneIds = Object.keys(sphere.stones);
        for (let j = 0; j < stoneIds.length; j++) {
          let stoneId = stoneIds[j];
          let stone = sphere.stones[stoneId];

          // update the list with this stone.
          if (this.masterHashTracker[sphereId][stoneId] === undefined) { this.masterHashTracker[sphereId][stoneId] = null; }

          // clear the triggers since this method can be fired repeatedly
          StoneAvailabilityTracker.clearMySetTriggers(sphereId, stoneId, ABILITY_SYNCER_OWNER_ID);
          StoneAvailabilityTracker.clearMySetTriggers(sphereId, stoneId, RULE_SYNCER_OWNER_ID);

          // handle abilities
          if (Permissions.inSphere(sphereId).canChangeAbilities) {
            this._syncAbility(sphereId, stoneId, stone.abilities.dimming, 'dimming');
            this._syncAbility(sphereId, stoneId, stone.abilities.switchcraft, 'switchcraft');
            this._syncAbility(sphereId, stoneId, stone.abilities.tapToToggle, 'tapToToggle');
          }

          // handle rules
          if (Permissions.inSphere(sphereId).canChangeBehaviours) {
            let ruleIds = Object.keys(stone.rules);
            let rulePromises = [];
            let rulesHaveChanged = false;
            for (let k = 0; k < ruleIds.length; k++) {
              let ruleId = ruleIds[k];
              let rule = stone.rules[ruleId];
              if (!rule.syncedToCrownstone) {
                rulePromises.push(this._syncRule(sphereId, stoneId, ruleId, stone, rule));
                rulesHaveChanged = true;
              }
            }

            if (rulesHaveChanged || ruleSyncRequired) {
              BatchCommandHandler.executePriority();
              Promise.all(rulePromises)
                .then(() => {
                  return this.checkAndSyncBehaviour(sphereId, stoneId);
                })
                .catch((err) => {
                  console.log("SOMETHING FAILED", err)
                  if (err && err.code && err.code === BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
                    // we ignore the duplicate error
                  }
                  else {
                    /** if the syncing fails, we set another watcher **/
                    console.log("TODO: RETRY the update")
                    // this.update(ruleSyncRequired = true);
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


  _getTransferRulesFromStone(sphereId,stoneId) : behaviourTransfer[] {
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
    return transferRules;
  }


  checkAndSyncBehaviour(sphereId, stoneId) : Promise<void> {
    let stone = DataUtil.getStone(sphereId,stoneId);
    let transferRules = this._getTransferRulesFromStone(sphereId, stoneId);
    console.log("IN THE CHECK AND SYNC BEHAVIOUR", transferRules, stone )

    if (transferRules.length === 0) { return Promise.resolve(); }

    let rulesAccordingToCrownstone = transferRules;
    let syncActions = [];
    return BluenetPromiseWrapper.getBehaviourMasterHash(transferRules)
      .then((masterHash) => {
        console.log("GOT THE MASTER HASH", masterHash, this.masterHashTracker[sphereId][stoneId])
        BatchCommandHandler.closeKeptOpenConnection();
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
      .then((result) => {
        rulesAccordingToCrownstone = result.data;
        // since there appearently was a change, we first sync with the cloud to ensure that we're really up to date and can do all
        // the behaviour comparing locally.
        if (stone.config.cloudId) {
          return CLOUD.forStone(stoneId).getBehaviours()
            .then((cloudBehaviours) => {
              let behaviourCloudSyncer = new StoneBehaviourSyncer(
                syncActions,
                [],
                stoneId,
                stone.config.cloudId,
                sphereId,
                MapProvider.local2cloudMap.spheres[sphereId],
                getGlobalIdMap(),
                getGlobalIdMap()
              );

              return behaviourCloudSyncer.sync(stone.rules, cloudBehaviours)
            })
            .then(() => {
              if (syncActions.length > 0) {
                core.store.batchDispatch(syncActions);
              }
            })
            .catch((err) => {
              console.log("THERE WAS AN ERROR SYNCING THE behaviours for this stone.", err)
            })
        }
        else {
          return Promise.resolve()
        }
      })
      .then(() => {
        // get the rules from the db again since the cloudsync may have added a few.
        transferRules = this._getTransferRulesFromStone(sphereId, stoneId);

        if (rulesAccordingToCrownstone) {
          // From this, we get all behaviours that SHOULD be on our phone.
          // (the ones not synced yet (which should be already synced by here, but still) are also in this list).

          // We first double check the differences between OUR behaviours and those on the Crownstone
          rulesAccordingToCrownstone.forEach((stoneBehaviour: behaviourTransfer) => {
            let foundMatch = false;
            for (let i = 0; i < transferRules.length; i++) {
              if (xUtil.deepCompare(stoneBehaviour, transferRules[i])) {
                foundMatch = true;
                // great! this is already in the list. We do not have to do anything here.
                break
              }
            }

            if (!foundMatch) {
              // TODO: this needs to be added to the local list of rules.
            }
          })

          transferRules.forEach((transferRule: behaviourTransfer) => {
            let foundMatch = false;
            for (let i = 0; i < rulesAccordingToCrownstone.length; i++) {
              if (xUtil.deepCompare(transferRule, rulesAccordingToCrownstone[i])) {
                foundMatch = true;
                // great! this is already in the list. We do not have to do anything here.
                break
              }
            }

            if (!foundMatch) {
              // TODO: we have to delete this item.
            }
          })

        }
        else {
         // TODO: there is nothing on the crownstone. We have to delete all our local behaviours to match.
        }
        return;
      })
      .catch((err) => {
        if (err == "NO_SYNC_REQUIRED") {
          LOGi.behaviour("DONE Syncing! NOT REQUIRED!");
          BatchCommandHandler.closeKeptOpenConnection();
          return;
        }

        console.log("Error during rule sync", err);
        throw err;
      })

  }

}













export const StoneDataSyncer = new StoneDataSyncerClass();