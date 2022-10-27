import { core } from "../Core";
import {EnergyDataCache} from "../logic/EnergyDataCache";


class EnergyUsageCacherClass {

  initialized = false;
  unsubscribeEvent = () => {};
  started = false;

  containers : {[sphereId: string]: EnergyDataCache} = {};

  constructor() {}

  init() {
    if (this.initialized === false) {
      this.initialized = true;
      this.start();
    }
  }

  start() {
    if (this.started === false) {
      this.started = true;
      this.unsubscribeEvent = core.eventBus.on("databaseChange", (data) => {
        if (data.change.changeSpheres) {
          this.updateContainers();
        }
      });

      this.updateContainers();
    }
  }

  stop() {
    this.started = false;
    this.unsubscribeEvent();
  }

  updateContainers() {
    let sphereIds = Object.keys(core.store.getState().spheres);

    for (let sphereId of sphereIds) {
      if (this.containers[sphereId] === undefined) {
        this.containers[sphereId] = new EnergyDataCache(sphereId);
      }
    }

    let containerIds = Object.keys(this.containers);
    for (let containerId of containerIds) {
      if (!sphereIds.includes(containerId)) {
        delete this.containers[containerId];
      }
    }
  }

  getContainer(sphereId : string) {
    return this.containers[sphereId];
  }

}


export const EnergyUsageCacher = new EnergyUsageCacherClass();
