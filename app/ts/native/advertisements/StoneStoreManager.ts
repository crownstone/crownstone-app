import { Scheduler } from "../../logic/Scheduler";
import { core } from "../../Core";


const TRIGGER_ID = "STONE_STORE_MANAGER_TRIGGER";
/**
 * This manager will handle all of the store actions. It will tick on the scheduler and perform store actions for all crownstones as a batch.
 */
export class StoneStoreManager {
  actionsPerCrownstone = {}; // { crownstoneId: { type: action } }
  persistingIndex = 0;
  persistingInterval = 2;

  constructor() {
    Scheduler.setRepeatingTrigger(TRIGGER_ID,{ repeatEveryNSeconds:2 });
    Scheduler.loadCallback(TRIGGER_ID, () => { this._updateStore(); });
  }

  loadAction(stoneId, type, action) {
    if (!this.actionsPerCrownstone[stoneId]) {
      this.actionsPerCrownstone[stoneId] = {};
    }

    this.actionsPerCrownstone[stoneId][type] = action;
  }

  clearActions(stoneId) {
    this.actionsPerCrownstone[stoneId] = null;
    delete this.actionsPerCrownstone[stoneId]
  }

  _updateStore() {
    let actions = [];

    let stoneIds = Object.keys(this.actionsPerCrownstone);
    stoneIds.forEach((stoneId) => {
      if (this.actionsPerCrownstone[stoneId]) {
        let types = Object.keys(this.actionsPerCrownstone[stoneId]);
        types.forEach((type) => {
          actions.push(this.actionsPerCrownstone[stoneId][type]);
        });
      }
    });

    if (this.persistingIndex === 0) {
      for (let i = 0; i < actions.length; i++) {
        actions[i].__skipPersistence = true;
      }
    }

    this.persistingIndex = (this.persistingIndex + 1) % this.persistingInterval;

    if (actions.length > 0) {
      core.store.batchDispatch(actions);
    }
    this.actionsPerCrownstone = {};
  }


}
