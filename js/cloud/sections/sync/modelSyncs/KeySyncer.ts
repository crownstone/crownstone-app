/**
 *
 * Sync the user from the cloud to the database.
 *
 */


import { CLOUD}               from "../../../cloudAPI";
import { SyncingBase }        from "./SyncingBase";
import {eventBus} from "../../../../util/EventBus";

export class KeySyncer extends SyncingBase {
  userId : string;

  download() {
    return CLOUD.getKeys();
  }

  sync(store) {
    return this.download()
      .then((keysInCloud) => {
        this.syncDown(keysInCloud, store);
        return Promise.all(this.transferPromises);
      })
      .then(() => { return this.actions });
  }


  syncDown(keysInCloud, store) {
    keysInCloud.forEach((keySet) => {
      let localSphereId = this.globalCloudIdMap.spheres[keySet.sphereId];

      let keys = {
        adminKey:  keySet.keys.owner  || keySet.keys.admin || null,
        memberKey: keySet.keys.member || null,
        guestKey:  keySet.keys.guest  || null
      };

      let state = store.getState();
      let sphere = state.spheres[localSphereId];
      // if we are present in this sphere, we need to update the keys asap.
      if (sphere && sphere.config.present) {
        if (sphere.config.adminKey  !== keys.adminKey  ||
            sphere.config.memberKey !== keys.memberKey ||
            sphere.config.guestKey  !== keys.guestKey) {
          eventBus.emit("KEYS_UPDATED", { sphereId: localSphereId, keys: keys, presentInSphere: sphere.config.present });
        }
      }

      this.actions.push({type:'SET_SPHERE_KEYS', sphereId: localSphereId, data: keys});
    })
  }

}
