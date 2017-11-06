/**
 *
 * Sync the user from the cloud to the database.
 *
 */


import { CLOUD}               from "../../../cloudAPI";
import { SyncingBase }        from "./SyncingBase";

export class KeySyncer extends SyncingBase {
  userId : string;

  download() {
    return CLOUD.getKeys();
  }

  sync() {
    return this.download()
      .then((keysInCloud) => {
        this.syncDown(keysInCloud);
        return Promise.all(this.transferPromises);
      })
      .then(() => { return this.actions });
  }


  syncDown(keysInCloud) {
    keysInCloud.forEach((keySet) => {
      let localSphereId = this.globalCloudIdMap.spheres[keySet.sphereId];

      this.actions.push({type:'SET_SPHERE_KEYS', sphereId: localSphereId, data:{
        adminKey:  keySet.keys.owner  || keySet.keys.admin || null,
        memberKey: keySet.keys.member || null,
        guestKey:  keySet.keys.guest  || null
      }})
    })
  }

}
