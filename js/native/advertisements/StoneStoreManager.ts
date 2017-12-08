import {Scheduler} from "../../logic/Scheduler";

/**
 * This manager will handle all of the store actions. It will tick on the scheduler and perform store actions for all crownstones as a batch.
 */
class StoneStoreManager {
  store;
  actionsPerCrownstone = {}; // { crownstoneId: { type: action } }

  constructor() {
    Scheduler.setRepeatingTrigger(TRIGGER_ID,{repeatEveryNSeconds:2});
  }
}

