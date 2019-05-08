import {LOGe} from "../../../logging/Log";
import {MapProvider} from "../../../backgroundProcesses/MapProvider";
import {getGlobalIdMap} from "./modelSyncs/SyncingBase";
import { PresenceSyncer } from "./modelSyncs/PresenceSyncer";
import { core } from "../../../core";

let syncingUsersInSpheres = {};

export const syncUsersInSphere = {
  /**
   * This method will check if there are any users in rooms in the active sphere. If so, actions will be dispatched to the store.
   * @param store
   */
  syncUsers: function(sphereId = null) {
    return new Promise((resolve, reject) => {
      let state = core.store.getState();
      if (!sphereId) {
        let sphereId = state.app.activeSphere;
        if (!sphereId) {
          return resolve();
        }
      }
      // avoid duplicates
      if (syncingUsersInSpheres[sphereId]) { return resolve(); }

      let sphere = state.spheres[sphereId];
      if (!sphere) {
        return resolve();
      }

      let sphereUsers = sphere.users;
      // there's only you in the sphere, no need to check
      if (Object.keys(sphereUsers).length <= 1) {
        return resolve();
      }

      let actions = [];
      syncingUsersInSpheres[sphereId] = true;
      let presenceSyncer = new PresenceSyncer(actions, [], sphereId, sphere.config.cloudId || sphereId, MapProvider.cloud2localMap, getGlobalIdMap());
      presenceSyncer.sync(core.store)
        .then(() => {
          if (actions.length > 0) {
            core.store.batchDispatch(actions);
          }
        })
        .catch((err) => {
          LOGe.cloud("SyncUsersInSphere: Error during background user sync: ", err);
        })
        .then(() => {
          syncingUsersInSpheres[sphereId] = false;
          delete syncingUsersInSpheres[sphereId];
          resolve();
        })
        .catch((err) => {
          resolve();
        })
    })
  }
};