import { LOG } from "../logging/Log";
import { core } from "../core";
import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";

const AFTER_INTENT_TIMEOUT = 30000;
const AFTER_CHANGE_TIMEMOUT = 10000;

class SphereStateManagerClass {
  _initialized: boolean = false;
  smartHomeDesiredStates = {};
  smartHomeChangedTime = 0;
  unsubscribeEvents = [];

  constructor() { }

  init() {
    LOG.info('Init UpdateCenter', this._initialized);
    if (this._initialized === false) {
      core.eventBus.on("databaseChange", (data) => {
        let change = data.change;
        if (change.removeSphere || change.addSphere || change.changeSphereSmartHomeState) {
          this.updateSpheres();
        }
      });
    }
    this._initialized = true;
  }

  updateSpheres() {
    let spheres = core.store.getState().spheres;
    let sphereIds = Object.keys(spheres);
    this.unsubscribeEvents.forEach((unsub) => { unsub(); });
    this.unsubscribeEvents = [];

    for (let i = 0; i < sphereIds.length; i++) {
      let sphereId = sphereIds[i];
      let sphere = spheres[sphereId];
      let smartHomeEnabled = sphere.state.smartHomeEnabled;

      this.unsubscribeEvents.push(core.eventBus.on(sphereId + "_smartHomeState", (incomingSmartHomeState) => {
        // We set the state to BEHAVIOUR OFF, we then notice that it is not off somewhere.
        // What do we do??
        if (this.smartHomeDesiredStates[sphereId] && this.smartHomeDesiredStates[sphereId].state !== incomingSmartHomeState && new Date().valueOf() - this.smartHomeDesiredStates[sphereId].timeSet > AFTER_INTENT_TIMEOUT) {

        }

        if (smartHomeEnabled !== incomingSmartHomeState && new Date().valueOf() - this.smartHomeChangedTime > AFTER_CHANGE_TIMEMOUT) {
          core.store.dispatch({
            type: "SET_SPHERE_SMART_HOME_STATE",
            sphereId: sphereId,
            data: { smartHomeEnabled: incomingSmartHomeState }
          })
          this.smartHomeChangedTime = new Date().valueOf();
        }
      }))
    }
  }

  userSetSmartHomeState(sphereId, newState) {
    this.smartHomeChangedTime = new Date().valueOf();
    this.smartHomeDesiredStates[sphereId] = { state: newState, timeSet: this.smartHomeChangedTime };

    core.store.dispatch({
      type: "SET_SPHERE_SMART_HOME_STATE",
      sphereId: sphereId,
      data: { smartHomeEnabled: newState }
    })

    BluenetPromiseWrapper.broadcastBehaviourSettings(sphereId, newState).catch(() => {});
  }
}

export const SphereStateManager = new SphereStateManagerClass();
