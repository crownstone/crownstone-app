import { core } from "../core";
import { StoneAvailabilityTracker } from "../native/advertisements/StoneAvailabilityTracker";
import { DataUtil } from "../util/DataUtil";
import { xUtil } from "../util/StandAloneUtil";
import { BCH_ERROR_CODES } from "../Enums";
import { Permissions } from "./PermissionManager";
import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { LOGd, LOGe, LOGi } from "../logging/Log";
import { CLOUD } from "../cloud/cloudAPI";
import { StoneBehaviourSyncer } from "../cloud/sections/sync/modelSyncs/StoneBehaviourSyncer";
import { MapProvider } from "./MapProvider";
import { getGlobalIdMap } from "../cloud/sections/sync/modelSyncs/SyncingBase";
import { Scheduler } from "../logic/Scheduler";
import { tell } from "../logic/constellation/Tellers";


const ABILITY_SYNCER_OWNER_ID = "ABILITY_SYNCER_OWNER_ID";
const RULE_SYNCER_OWNER_ID    = "RULE_SYNCER_OWNER_ID";

class StoneDataSyncerClass {
  initialized = false;

  masterHashTracker = {}

  scheduledRetries = {};
  pendingRuleTriggers = {};
  rescheduledRuleTriggers = {};

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
    LOGi.info("StoneDataSyncer: Update called.")
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
          let initialAbilities = sphere.stones[stoneId].abilities;

          // update the list with this stone.
          if (this.masterHashTracker[sphereId][stoneId] === undefined) { this.masterHashTracker[sphereId][stoneId] = null; }

          // handle abilities
          if (Permissions.inSphere(sphereId).canChangeAbilities) {
            this._syncAbility(sphereId, stoneId, initialAbilities.dimming,     'dimming');
            this._syncAbility(sphereId, stoneId, initialAbilities.switchcraft, 'switchcraft');
            this._syncAbility(sphereId, stoneId, initialAbilities.tapToToggle, 'tapToToggle');
          }

          // handle rules
          if (Permissions.inSphere(sphereId).canChangeBehaviours) {
            let stone = DataUtil.getStone(sphereId, stoneId);
            if (!stone) { return; }

            let ruleIds = Object.keys(stone.rules);
            let rulesHaveChanged = false;
            for (let k = 0; k < ruleIds.length; k++) {
              let ruleId = ruleIds[k];
              let rule = stone.rules[ruleId];
              if (this._shouldRuleBeSynced(rule)) {
                rulesHaveChanged = true;
              }
            }

            if (rulesHaveChanged) {
              this._setSyncRuleTrigger(sphereId, stoneId);
            }
          }
        }
      }
    }
  }

  _setSyncRuleTrigger(sphereId, stoneId) {
    let sessionId = xUtil.getShortUUID()
    LOGi.info("StoneDataSyncer: Setting rule syncing trigger for ", sphereId, stoneId, sessionId);
    let id = sphereId+stoneId;


    let stone = DataUtil.getStone(sphereId, stoneId);
    if (!stone) { return; }

    let ruleIds = Object.keys(stone.rules);
    let rulePromises = [];

    for (let k = 0; k < ruleIds.length; k++) {
      let ruleId = ruleIds[k];
      let rule = stone.rules[ruleId];
      if (this._shouldRuleBeSynced(rule)) {
        LOGi.info("StoneDataSyncer: Attempting to sync rule", sphereId, stoneId, ruleId, sessionId);
        rulePromises.push(
          this._syncRule(sphereId, stoneId, ruleId, stone, rule, sessionId)
        );
      }
    }

    if (rulePromises.length > 0) {
      LOGi.info("StoneDataSyncer: Executing rule syncing trigger for ", sphereId, stoneId, rulePromises.length, sessionId);
      Promise.all(rulePromises)
        .then(() => {
          LOGi.info("StoneDataSyncer: Syncing behaviour now...", sphereId, stoneId, sessionId);
          return this.checkAndSyncBehaviour(sphereId, stoneId);
        })
        .then(() => {
          // clear pending
          delete this.pendingRuleTriggers[id];
          if (this.rescheduledRuleTriggers[id]) {
            this._setSyncRuleTrigger(sphereId, stoneId)
          }
        })
        .catch((err) => {
          LOGe.info("StoneDataSyncer: Failed rule sync trigger", sphereId, stoneId, err, sessionId);
          if (err && err.code && err.code === BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
            // we ignore the duplicate error because a newer version of this rule is already being synced to this crownstone.
          }
          else {
            /** if the syncing fails, we set another watcher **/
            delete this.pendingRuleTriggers[id];
            if (this.rescheduledRuleTriggers[id]) {
              this._setSyncRuleTrigger(sphereId, stoneId)
            }
            else {
              LOGi.info("StoneDataSyncer: Rescheduling rule sync trigger after failure for", sphereId, stoneId);
              this.scheduledRetries[id] = {clearRetry: Scheduler.scheduleCallback(() => {
                  LOGi.info("StoneDataSyncer: Executing reschedule rule sync trigger", sphereId, stoneId);
                  this._setSyncRuleTrigger(sphereId, stoneId);
                }, 5000, "Retry rule sync for " + sphereId, stoneId)};
            }
          }
        })
    }
    else {
      delete this.pendingRuleTriggers[id];
      if (this.rescheduledRuleTriggers[id]) {
        this._setSyncRuleTrigger(sphereId, stoneId)
      }
    }
  }

  _syncAbility(sphereId, stoneId, initialAbility, abilityType) {
    if (!initialAbility.syncedToCrownstone) {
      switch (abilityType) {
        case "dimming":
          this._syncDimmingAbility( sphereId, stoneId );
          break;
        case "switchcraft":
          this._syncSwitchcraftAbility( sphereId, stoneId );
          break;
        case "tapToToggle":
          this._syncTapToToggle( sphereId, stoneId );
          break;
      }
    }
  }

  _shouldRuleBeSynced(rule) {
    return !rule.syncedToCrownstone || rule.deleted || rule.idOnCrownstone === null || rule.idOnCrownstone === undefined;
  }


  _syncDimmingAbility(sphereId : string, stoneId : string) {
    LOGi.info("StoneDataSyncer: Setting ability trigger for dimming", sphereId, stoneId);
    // we get it again and check synced again to ensure that we are sending the latest data and that we're not doing duplicates.
    let stone = DataUtil.getStone(sphereId, stoneId);
    if (!stone) { return };
    let ability = stone.abilities.dimming;
    if (ability.syncedToCrownstone) { return; }

    tell(stone).allowDimming(ability.enabledTarget)
      .then(() => {
        LOGi.info("StoneDataSyncer: Successfully synced ability trigger for dimming", sphereId, stoneId);
        let actions = [];
        actions.push({type: "UPDATE_ABILITY_DIMMER",         sphereId: sphereId, stoneId: stoneId, data:{ enabled: ability.enabledTarget}});
        actions.push({type: "MARK_ABILITY_DIMMER_AS_SYNCED", sphereId: sphereId, stoneId: stoneId});
        core.store.batchDispatch(actions);
      })
      .catch((err) => {
        if (err && err.code && err.code !== BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
          LOGe.info("StoneDataSyncer: ERROR Failed to sync ability trigger for dimming", err, sphereId, stoneId);
          /** if the syncing fails, we set another watcher **/
          this.update();
        }
      });

    tell(stone).setSoftOnSpeed(Number(ability.softOnSpeed))
      .then(() => {
        LOGi.info("StoneDataSyncer: Successfully synced ability trigger for dimming speed", sphereId, stoneId, ability.softOnSpeed);
        let actions = [];
        actions.push({type: "UPDATE_ABILITY_DIMMER",         sphereId: sphereId, stoneId: stoneId, data: { softOnSpeed: Number(ability.softOnSpeed)}});
        actions.push({type: "MARK_ABILITY_DIMMER_AS_SYNCED", sphereId: sphereId, stoneId: stoneId});
        core.store.batchDispatch(actions);
      })
      .catch((err) => {
        if (err && err.code && err.code !== BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
          LOGe.info("StoneDataSyncer: ERROR Failed to sync ability trigger for dimming speed", sphereId, stoneId, err);
          /** if the syncing fails, we set another watcher **/
          this.update();
        }
      });
  }


  _syncSwitchcraftAbility(sphereId : string, stoneId : string) {
    LOGi.info("StoneDataSyncer: Setting ability trigger for switchcraft", sphereId, stoneId);
    // we get it again and check synced again to ensure that we are sending the latest data and that we're not doing duplicates.
    let stone = DataUtil.getStone(sphereId, stoneId);
    if (!stone) { return };
    let ability = stone.abilities.switchcraft;
    if (ability.syncedToCrownstone) { return; }
    tell(stone).setSwitchCraft(ability.enabledTarget)
      .then(() => {
        LOGi.info("StoneDataSyncer: Successfully synced ability trigger for switchcraft", sphereId, stoneId);
        let actions = [];
        actions.push({type: "UPDATE_ABILITY_SWITCHCRAFT",         sphereId: sphereId, stoneId: stoneId, data:{ enabled: ability.enabledTarget}});
        actions.push({type: "MARK_ABILITY_SWITCHCRAFT_AS_SYNCED", sphereId: sphereId, stoneId: stoneId});
        core.store.batchDispatch(actions);
      })
      .catch((err) => {
        if (err && err.code && err.code !== BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
          /** if the syncing fails, we set another watcher **/
          LOGe.info("StoneDataSyncer: ERROR Failed to sync ability trigger for switchcraft", sphereId, stoneId, err);
          this.update();
        }
      });
  }


  _syncTapToToggle(sphereId : string, stoneId : string) {
    LOGi.info("StoneDataSyncer: Setting ability trigger for tap2toggle", sphereId, stoneId);
    // we get it again and check synced again to ensure that we are sending the latest data and that we're not doing duplicates.
    let stone = DataUtil.getStone(sphereId, stoneId);
    if (!stone) { return };
    let ability = stone.abilities.tapToToggle;
    if (ability.syncedToCrownstone) { return; }

    tell(stone).setTapToToggle(ability.enabledTarget)
      .then(() => {
        LOGi.info("StoneDataSyncer: Successfully synced ability trigger for tap2toggle", sphereId, stoneId);
        let actions = [];
        actions.push({type: "UPDATE_ABILITY_TAP_TO_TOGGLE",         sphereId: sphereId, stoneId: stoneId, data:{ enabled: ability.enabledTarget}});
        actions.push({type: "MARK_ABILITY_TAP_TO_TOGGLE_AS_SYNCED", sphereId: sphereId, stoneId: stoneId});
        core.store.batchDispatch(actions);
      })
      .catch((err) => {
        if (err && err.code && err.code !== BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
          LOGe.info("StoneDataSyncer: ERROR Failed to sync ability trigger for tap2toggle", err, sphereId, stoneId);
          /** if the syncing fails, we set another watcher **/
          this.update();
        }
      });

    tell(stone).setTapToToggleThresholdOffset(ability.rssiOffsetTarget)
      .then(() => {
        LOGi.info("StoneDataSyncer: Successfully synced ability trigger for tap2toggle offset", sphereId, stoneId, ability.rssiOffsetTarget);
        let actions = [];
        actions.push({type: "UPDATE_ABILITY_TAP_TO_TOGGLE",         sphereId: sphereId, stoneId: stoneId, data: { rssiOffset: ability.rssiOffsetTarget}});
        actions.push({type: "MARK_ABILITY_TAP_TO_TOGGLE_AS_SYNCED", sphereId: sphereId, stoneId: stoneId});
        core.store.batchDispatch(actions);
      })
      .catch((err) => {
        if (err && err.code && err.code !== BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
          LOGe.info("StoneDataSyncer: ERROR Failed to sync ability trigger for tap2toggle offset", sphereId, stoneId, err);
          /** if the syncing fails, we set another watcher **/
          this.update();
        }
      });
  }



  _syncRule(sphereId, stoneId, ruleId, stone, rule : behaviourWrapper, sessionId) : Promise<void> {
    LOGi.info("StoneDataSyncer: Executing trigger for rule", sphereId, stoneId, ruleId, sessionId);
    if (rule.deleted) {
      LOGi.info("StoneDataSyncer: Syncing deleted rule", sphereId, stoneId, ruleId, sessionId);
      if (rule.idOnCrownstone !== null) {
        LOGi.info("StoneDataSyncer: Syncing deleted rule which is already on Crownstone", sphereId, stoneId, ruleId);
        tell(stone).removeBehaviour(rule.idOnCrownstone)
          .then((returnData) => {
            LOGi.info("StoneDataSyncer: Successfully synced deleted rule by deleting it from the Crownstone", sphereId, stoneId, ruleId, sessionId);
            core.store.dispatch({type: "REMOVE_STONE_RULE", sphereId: sphereId, stoneId: stoneId, ruleId: ruleId});
            let masterHash = returnData.masterHash || null;
            this.masterHashTracker[sphereId][stoneId] = masterHash;
          })
          .catch((err) => {
            LOGe.info("StoneDataSyncer: ERROR failed synced deleted rule by deleting it from the Crownstone", sphereId, stoneId, ruleId, err, sessionId);
            throw err;
          })
      }
      else {
        LOGi.info("StoneDataSyncer: Syncing deleted rule by deleting it locally.", sphereId, stoneId, ruleId, sessionId);
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
        LOGi.info("StoneDataSyncer: Updating rule which is already on Crownstone", sphereId, stoneId, ruleId, sessionId);
        tell(stone).updateBehaviour(behaviour)
          .then((returnData) => {
            LOGi.info("StoneDataSyncer: Successfully updated rule which is already on Crownstone", sphereId, stoneId, ruleId, sessionId);
            core.store.dispatch({type: "UPDATE_STONE_RULE", sphereId: sphereId, stoneId: stoneId, ruleId: ruleId, data:{syncedToCrownstone: true}});
            let masterHash = returnData.masterHash || null;
            this.masterHashTracker[sphereId][stoneId] = masterHash;
          })
          .catch((err) => {
            LOGe.info("StoneDataSyncer: ERROR updating rule which is already on Crownstone", sphereId, stoneId, ruleId, err, sessionId);
            throw err;
          })
      }
      else {
        LOGi.info("StoneDataSyncer: Adding rule to Crownstone", sphereId, stoneId, ruleId, sessionId);
        tell(stone).addBehaviour(behaviour)
          .then((returnData) => {
            LOGi.info("StoneDataSyncer: Successfully Adding rule to Crownstone", sphereId, stoneId, ruleId, sessionId);
            let index = returnData.index;
            let masterHash = returnData.masterHash || null;
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
            LOGi.info("StoneDataSyncer: ERROR Adding rule to Crownstone ", sphereId, stoneId, ruleId, err, sessionId);
            throw err;
          })
      }
    }
  }


  _getTransferRulesFromStone(sphereId,stoneId) : {ruleId: string, behaviour: behaviourTransfer}[] {
    let stone = DataUtil.getStone(sphereId,stoneId);

    let ruleIds = Object.keys(stone.rules);
    let transferRules = [];
    for (let i = 0; i < ruleIds.length; i++) {
      let rule = stone.rules[ruleIds[i]];
      let behaviour = xUtil.deepCopy(rule);
      if (typeof behaviour.data === 'string') {
        behaviour.data = JSON.parse(behaviour.data);
      }

      delete behaviour.cloudId;
      delete behaviour.deleted;
      delete behaviour.syncedToCrownstone;
      delete behaviour.updatedAt;

      transferRules.push({ruleId: ruleIds[i], behaviour: behaviour});
    }
    return transferRules;
  }


  checkAndSyncBehaviour(sphereId, stoneId, force = false) : Promise<void> {
    let stone = DataUtil.getStone(sphereId,stoneId);
    let transferRules = this._getTransferRulesFromStone(sphereId, stoneId);

    let rulesAccordingToCrownstone = null;
    let syncActions = [];

    let ruleData = [];
    transferRules.forEach((data) => {
      ruleData.push(data.behaviour)
    })

    return BluenetPromiseWrapper.getBehaviourMasterHash(ruleData)
      .then((masterHash) => {
        if (this.masterHashTracker[sphereId][stoneId] !== masterHash || force) {
          // SYNC!
          LOGi.behaviour("Syncing behaviours now... My Master Hash", masterHash, " vs Crownstone hash", this.masterHashTracker[sphereId][stoneId]);
          return tell(stone).syncBehaviours(ruleData);
        }
        throw "NO_SYNC_REQUIRED"
      })
      .then((rulesAccordingToCrownstone) => {
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
              LOGe.info("StoneDataSyncer: checkAndSyncBehaviour Error downloading behaviours.", err)
            })
        }
        else {
          return Promise.resolve()
        }
      })
      .then(() => {
        LOGd.info("StoneDataSyncer: checkAndSyncBehaviour Starting the compare analysis.");
        // get the rules from the db again since the cloudsync may have added a few.
        transferRules = this._getTransferRulesFromStone(sphereId, stoneId);
        let actions = [];
        if (rulesAccordingToCrownstone) {
          // From this, we get all behaviours that SHOULD be on our phone.
          // (the ones not synced yet (which should be already synced by here, but still) are also in this list).

          // We first double check the differences between OUR behaviours and those on the Crownstone
          let indicesThatMatched = {};
          rulesAccordingToCrownstone.forEach((stoneBehaviour: behaviourTransfer) => {
            let foundMatch = false;
            for (let i = 0; i < transferRules.length; i++) {
              // once we have decided on a match, a behaviour cannot be used for matching again.
              if (indicesThatMatched[i]) { continue; }

              LOGd.info("StoneDataSyncer: checkAndSyncBehaviour Comparing", stoneBehaviour, transferRules[i].behaviour);
              if (xUtil.deepCompare(stoneBehaviour, transferRules[i].behaviour)) {
                indicesThatMatched[i] = true;
                foundMatch = true;
                LOGd.info("StoneDataSyncer: checkAndSyncBehaviour Compare is a MATCH.");
                // great! this is already in the list. We do not have to do anything here.
                break
              }
              else {
                LOGd.info("StoneDataSyncer: checkAndSyncBehaviour Compare was not a match.");
              }
            }

            if (!foundMatch) {
              LOGi.info("StoneDataSyncer: checkAndSyncBehaviour Found an unknown behaviour, we will add this.")
              // this is a new rule!
              let newRuleId = xUtil.getUUID();
              actions.push({
                type: "ADD_STONE_RULE",
                sphereId: sphereId,
                stoneId: stoneId,
                ruleId: newRuleId,
                data: {
                  type:           stoneBehaviour.type,
                  data:           JSON.stringify(stoneBehaviour.data),
                  activeDays:     stoneBehaviour.activeDays,
                  profileIndex:   stoneBehaviour.profileIndex,
                  idOnCrownstone: stoneBehaviour.idOnCrownstone,
                  syncedToCrownstone: true,
                }
              });
            }
          })

          indicesThatMatched = {};
          transferRules.forEach((transferRule: {ruleId: string, behaviour: behaviourTransfer}) => {
            let foundMatch = false;

            for (let i = 0; i < rulesAccordingToCrownstone.length; i++) {
              if (indicesThatMatched[i]) { continue; }

              if (xUtil.deepCompare(transferRule.behaviour, rulesAccordingToCrownstone[i])) {
                indicesThatMatched[i] = true;
                foundMatch = true;
                // great! this is already in the list. We do not have to do anything here.
                break
              }
            }

            if (!foundMatch) {
              LOGi.info("StoneDataSyncer: checkAndSyncBehaviour Behaviour should be deleted");
              actions.push({
                type: "REMOVE_STONE_RULE",
                sphereId: sphereId,
                stoneId: stoneId,
                ruleId: transferRule.ruleId,
              });
            }
          });

        }
        else {
            LOGi.info("StoneDataSyncer: checkAndSyncBehaviour All behaviour should be deleted.");
            actions.push({
              type: "REMOVE_ALL_RULES_OF_STONE",
              sphereId: sphereId,
              stoneId: stoneId,
            });
        }

        if (actions.length > 0) {
          LOGi.info("StoneDataSyncer: checkAndSyncBehaviour required sync actions!", actions);
          core.store.batchDispatch(actions);
        }
        else {
          LOGi.info("StoneDataSyncer: checkAndSyncBehaviour Crownstone and app are in sync!");
        }
      })
      .catch((err) => {
        if (err == "NO_SYNC_REQUIRED") {
          LOGi.behaviour("StoneDataSyncer: checkAndSyncBehaviour DONE Syncing! NOT REQUIRED!");
          return;
        }
        else {
          LOGe.behaviour("StoneDataSyncer: checkAndSyncBehaviour Error Syncing!", err);
        }

        throw err;
      })

  }

}













export const StoneDataSyncer = new StoneDataSyncerClass();