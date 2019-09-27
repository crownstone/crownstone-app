import { core } from "../core";
import { StoneAvailabilityTracker } from "../native/advertisements/StoneAvailabilityTracker";
import { BatchCommandHandler } from "../logic/BatchCommandHandler";
import { DataUtil } from "../util/DataUtil";


const ABILITY_SYNCER_OWNER_ID = "ABILITY_SYNCER_OWNER_ID";
const RULE_SYNCER_OWNER_ID    = "RULE_SYNCER_OWNER_ID";

class StoneDataSyncerClass {
  initialized = false;

  constructor() {}

  init() {
    if (this.initialized === false) {
      this.initialized = true;
      core.nativeBus.on(core.nativeBus.topics.enterRoom,() => {
        this.update();
      });

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
      let sphere = state.spheres[sphereIds[i]];
      if (sphere.state.present) {
        let stoneIds = Object.keys(sphere.stones);
        for (let j = 0; j < stoneIds.length; j++) {
          let stone = sphere.stones[stoneIds[j]];;

          // clear the triggers since this method can be fired repeatedly
          StoneAvailabilityTracker.clearMySetTriggers(sphereIds[i], stoneIds[j], ABILITY_SYNCER_OWNER_ID)
          StoneAvailabilityTracker.clearMySetTriggers(sphereIds[i], stoneIds[j], RULE_SYNCER_OWNER_ID)

          // handle abilities
          this._syncAbility(sphereIds[i], stoneIds[j], stone.abilities.dimming,     'dimming');
          this._syncAbility(sphereIds[i], stoneIds[j], stone.abilities.switchcraft, 'switchcraft');
          this._syncAbility(sphereIds[i], stoneIds[j], stone.abilities.tapToToggle, 'tapToToggle');

          // handle rules
          let ruleIds = Object.keys(stone.rules);
          for (let k = 0; k < ruleIds.length; k++) {
            let rule = stone.rules[ruleIds[k]];
            if (!rule.syncedToCrownstone) {
              this._syncRule(sphereIds[i], stoneIds[j], ruleIds[k], rule)
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
          this._syncGenericAbility(
            sphereId, stoneId, "tapToToggle",
            (ability) => { return {commandName:'setTapToToggle', value: ability.enabledTarget, rssiOffset: ability.rssiOffsetTarget}},
            (ability) => {
              let actions = [];
              actions.push({type: "UPDATE_ABILITY_TAP_TO_TOGGLE",         sphereId: sphereId, stoneId: stoneId, data:{ enabled: ability.enabledTarget, rssiOffset: ability.rssiOffset}});
              actions.push({type: "MARK_ABILITY_TAP_TO_TOGGLE_AS_SYNCED", sphereId: sphereId, stoneId: stoneId});
              core.store.batchDispatch(actions);
            }
          );
          break;
      }
    }
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
        .catch(() => {
          /** if the syncing fails, we set another watcher **/
          this.update();
        });
      BatchCommandHandler.executePriority();
    })
  }


  _syncRule(sphereId, stoneId, ruleId, rule) {
    // TODO
  }



}

export const StoneDataSyncer = new StoneDataSyncerClass();