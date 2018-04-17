import { LOG } from "../../../logging/Log";
import {LocationSyncer} from "./modelSyncs/LocationSyncer";
import {MapProvider} from "../../../backgroundProcesses/MapProvider";
import {getGlobalIdMap} from "./modelSyncs/SyncingBase";

export const syncUsersInSphere = {

  /**
   * This method will check if there are any users in rooms in the active sphere. If so, actions will be dispatched to the store.
   * @param store
   */
  syncUsers: function(store) {
      let state = store.getState();
      let activeSphereId = state.app.activeSphere;

      if (!activeSphereId) {
        return;
      }

      let sphere = state.spheres[activeSphereId];

      if (!sphere) {
        return;
      }

      let actions = [];
      let sphereUsers = sphere.users;

      // there's only you in the sphere, no need to check
      if (Object.keys(sphereUsers).length <= 1) {
        return;
      }

      let locationSyncer = new LocationSyncer(actions, [], activeSphereId, sphere.config.cloudId || activeSphereId, MapProvider.cloud2localMap, getGlobalIdMap());
      locationSyncer.sync(store)
        .then(() => {
          if (actions.length > 0) {
            store.batchDispatch(actions);
          }
        })
        .catch((err) => { LOG.error("SyncUsersInSphere: Error during background user sync: ", err); })
    }
};