import {LOGe} from "../../../logging/Log";
import {MapProvider} from "../../../backgroundProcesses/MapProvider";
import {getGlobalIdMap} from "./modelSyncs/SyncingBase";
import { PresenceSyncer } from "./modelSyncs/PresenceSyncer";

export const InviteSyncer = {

  /**
   * @param store
   */
  syncInvites: function() {
      // let state = store.getState();
      // let activeSphereId = state.app.activeSphere;
      //
      // if (!activeSphereId) {
      //   return;
      // }
      //
      // let sphere = state.spheres[activeSphereId];
      //
      // if (!sphere) {
      //   return;
      // }
      //
      // let actions = [];
      // let sphereUsers = sphere.users;
      //
      // // there's only you in the sphere, no need to check
      // if (Object.keys(sphereUsers).length <= 1) {
      //   return;
      // }
      //
      // let presenceSyncer = new PresenceSyncer(actions, [], activeSphereId, sphere.config.cloudId || activeSphereId, MapProvider.cloud2localMap, getGlobalIdMap());
      // presenceSyncer.sync(store)
      //   .then(() => {
      //     if (actions.length > 0) {
      //       store.batchDispatch(actions);
      //     }
      //   })
      //   .catch((err) => { LOGe.cloud("SyncUsersInSphere: Error during background user sync: ", err); })
    }
};