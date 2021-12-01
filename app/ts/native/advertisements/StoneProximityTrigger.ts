import {xUtil} from "../../util/StandAloneUtil";

export class StoneProximityTriggerClass {
  triggers : triggerFormat = {};


  reset() {
    this.triggers = {};
  }

  /**
    * Will execute Action when a stone with the provided ID is seen.
    * @param sphereId
    * @param stoneId
    * @param ownerId
    * @param action
    * @param rssi
  */
  setTrigger(sphereId, stoneId, ownerId, action: () => void, rssi= -100) {
    if (!this.triggers[sphereId])                   { this.triggers[sphereId] = {}; }
    if (!this.triggers[sphereId][stoneId])          { this.triggers[sphereId][stoneId] = {}; }
    if (!this.triggers[sphereId][stoneId][ownerId]) { this.triggers[sphereId][stoneId][ownerId] = {} }

    let uuid = xUtil.getShortUUID();
    this.triggers[sphereId][stoneId][ownerId][uuid] = {rssiRequirement: rssi, action: action, triggeredIds: {}, timesTriggered: 0, timesToTrigger: 1};
  }


  handleTriggers(sphereId, stoneId, rssi: number) {
    if (!this.triggers[sphereId])          { return; }
    if (!this.triggers[sphereId][stoneId]) { return; }
    if (rssi >= 0 || rssi <= -100)         { return; }

    // handle targeted triggers
    let stoneTriggers = this.triggers[sphereId][stoneId];

    let todos = [];
    for (let ownerId in stoneTriggers) {
      let ownerTriggers   = stoneTriggers[ownerId];
      let ownerTriggerIds = Object.keys(ownerTriggers);
      // inverse walk so we can delete the elements that we match
      for (let j = ownerTriggerIds.length - 1; j >= 0; j--) {
        let trigger = ownerTriggers[ownerTriggerIds[j]];
        if (trigger.rssiRequirement <= rssi) {
          todos.push(trigger);
          delete ownerTriggers[ownerTriggerIds[j]];
        }
      }
    }

    // we now have a collection of todos that we will execute.
    for (let i = 0; i < todos.length; i++) {
      todos[i].action();
    }
  }


}

export const StoneProximityTrigger = new StoneProximityTriggerClass();