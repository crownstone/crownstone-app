import { core } from "../core";


class StoneDataSyncerClass {
  initialized = false;

  queueMap = {}; // stoneId --> { amount: number }

  constructor() {}

  init() {
    if (this.initialized === false) {
      this.initialized = true;

      core.eventBus.on("databaseChange", (data) => {
        let change = data.change;
        if (change.stoneChangeRules || change.stoneChangeAbilities) {
          this.update();
        }
      });

      this.update();
    }
  }


  update() {
    this.refreshQueueMap();

    // this should delete all rules with the willBeDeleted flag true, when done remove from database and cloud.
    // this should sync all rules marked with synced = false to the crownstones and flag the synced = true

    // it will ensure that all abilities will be synced to the Crownstone.

  }


  refreshQueueMap() {
    // this will return a queue of outstanding tasks
  }


}

export const StoneDataSyncer = new StoneDataSyncerClass();