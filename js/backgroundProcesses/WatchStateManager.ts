import { Platform } from 'react-native'
import { Bluenet } from "../native/libInterface/Bluenet";
import { core } from "../core";

class WatchStateManagerClass {
  initialized = false;

  init() {
    if (this.initialized === false) {
      if (Platform.OS === 'ios') {
        // listen to events that might change the name of the stones, or added and removed stones.
        core.eventBus.on("databaseChange", (data) => {
          let change = data.change;
          if (change.changeStones || change.updateStoneCoreConfig || change.changeAppliances || change.updateApplianceConfig) {
            this._updateNames();
          }
        });

        this._updateNames();
      }
      this.initialized = true;
    }
  }

  _updateNames() {
    let state = core.store.getState();
    let nameObject = {};

    Object.keys(state.spheres).forEach((sphereId) => {
      let sphere = state.spheres[sphereId];
      nameObject[sphereId] = {};
      Object.keys(sphere.stones).forEach((stoneId) => {
        let stone = sphere.stones[stoneId];
        let name = stone.config.name;
        if (stone.config.applianceId) {
          let appliance = sphere.appliances[stone.config.applianceId];
          if (appliance) {
            name = appliance.config.name;
          }
        }

        nameObject[sphereId][stone.config.crownstoneId] = name;
      });
    });

    Bluenet.setCrownstoneNames(nameObject);
  }


}

export const WatchStateManager = new WatchStateManagerClass();