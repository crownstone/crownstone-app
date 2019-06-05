/**
 *
 * Sync the user from the cloud to the database.
 *
 */


import { CLOUD}               from "../../../cloudAPI";
import { SyncingBase }        from "./SyncingBase";
import { core } from "../../../../core";

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

      let state = store.getState();
      let sphere = state.spheres[localSphereId];
      let localSphereKeys = sphere.keys;

      let cloud_sphere_keys = keySet.sphereKeys;
      let cloudKeyMap = {};
      cloud_sphere_keys.forEach((cloud_sphere_key) => {
        cloudKeyMap[cloud_sphere_key.id] = true;
        let localKey = localSphereKeys[cloud_sphere_key.id];

        if (localKey === undefined) {
          // add key
          this.actions.push({type:'ADD_SPHERE_KEY', sphereId: localSphereId, keyId: cloud_sphere_key.id, data: {
            key:       cloud_sphere_key.key,
            keyType:   cloud_sphere_key.keyType,
            createdAt: new Date(cloud_sphere_key.createdAt).valueOf(),
            ttl:       cloud_sphere_key.ttl
          }})
          core.eventBus.emit("KEYS_UPDATED");
        }
        else if (
          localKey.key       !== cloud_sphere_key.key     ||
          localKey.keyType   !== cloud_sphere_key.keyType ||
          localKey.ttl       !== cloud_sphere_key.ttl     ||
          localKey.createdAt !== cloud_sphere_key.createdAt) {
            // update key
          this.actions.push({type:'UPDATE_SPHERE_KEY', sphereId: localSphereId, keyId: cloud_sphere_key.id, data: {
            key:       cloud_sphere_key.key,
            keyType:   cloud_sphere_key.keyType,
            createdAt: new Date(cloud_sphere_key.createdAt).valueOf(),
            ttl:       cloud_sphere_key.ttl
          }})

          core.eventBus.emit("KEYS_UPDATED");
        }
        else {
          // do nothing.
        }
      })



      localSphereKeys.forEach((localKeyId) => {
        if (cloudKeyMap[localKeyId] === undefined) {
          // remove key
          this.actions.push({type:'REMOVE_SPHERE_KEY', sphereId: localSphereId, keyId: localKeyId})
          core.eventBus.emit("KEYS_UPDATED");
        }
      })
    })
  }

}
