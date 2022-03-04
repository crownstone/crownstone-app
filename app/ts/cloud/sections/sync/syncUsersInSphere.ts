import {LOGe} from "../../../logging/Log";
import {MapProvider} from "../../../backgroundProcesses/MapProvider";
import {PresenceSyncer} from "./modelSyncs/PresenceSyncer";
import {core} from "../../../Core";

let syncingUsersInSpheres = {};

export const syncUsersInSphere = {
  /**
   * This method will check if there are any users in rooms in the active sphere. If so, actions will be dispatched to the store.
   * @param sphereId
   */
  syncUsers: function(cloudSphereId = null, parentActions : null | any[] = null) : Promise<void> {
    return new Promise((resolve, reject) => {
      let state = core.store.getState();
      let localSphereId = MapProvider.cloud2localMap.spheres[cloudSphereId] || cloudSphereId;
      if (!localSphereId) {
        let sphereId = state.app.activeSphere;
        if (!sphereId) {
          return resolve();
        }
      }
      let resolvedCloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || cloudSphereId || localSphereId;

      // avoid duplicates
      if (syncingUsersInSpheres[localSphereId]) { return resolve(); }

      let sphere = state.spheres[localSphereId];
      if (!sphere) {
        return resolve();
      }

      let sphereUsers = sphere.users;
      // there's only you in the sphere, no need to check
      if (Object.keys(sphereUsers).length <= 1) {
        return resolve();
      }


      let actions = [];
      syncingUsersInSpheres[localSphereId] = true;
      let presenceSyncer = new PresenceSyncer(actions, [], localSphereId, sphere.config.cloudId || resolvedCloudSphereId, MapProvider.cloud2localMap);
      presenceSyncer.sync(core.store)
        .then(() => {
          if (actions.length > 0) {
            core.store.batchDispatch(actions);
          }
        })
        .catch((err) => {
          LOGe.cloud("SyncUsersInSphere: Error during background user sync: ", err?.message);
        })
        .then(() => {
          syncingUsersInSpheres[localSphereId] = false;
          delete syncingUsersInSpheres[localSphereId];
          resolve();
        })
        .catch((err) => {
          delete syncingUsersInSpheres[localSphereId];
          resolve();
        })
    })
  }
};