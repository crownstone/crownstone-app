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
    let keysUpdated = false;
    let keyActions = [];
    keysInCloud.forEach((keySet) => {
      let localSphereId = this.globalCloudIdMap.spheres[keySet.sphereId];

      let state = store.getState();
      let sphere = state.spheres[localSphereId];
      if (!sphere) {
        let cloud_sphere_keys = keySet.sphereKeys;
        cloud_sphere_keys.forEach((cloud_sphere_key) => {
          this.actions.push({type:'ADD_SPHERE_KEY', sphereId: localSphereId, keyId: cloud_sphere_key.id, data: {
              key:       cloud_sphere_key.key,
              keyType:   cloud_sphere_key.keyType,
              createdAt: new Date(cloud_sphere_key.createdAt).valueOf(),
              ttl:       cloud_sphere_key.ttl
            }})
        });
        return;
      }

      // now lets sync the keys if the sphere already exists!
      let localSphereKeys = sphere.keys;
      let cloud_sphere_keys = keySet.sphereKeys;
      let cloudKeyMap = {};
      cloud_sphere_keys.forEach((cloud_sphere_key) => {
        cloudKeyMap[cloud_sphere_key.id] = true;
        let localKey = localSphereKeys[cloud_sphere_key.id];

        if (localKey === undefined) {
          // add key
          keyActions.push({type:'ADD_SPHERE_KEY', sphereId: localSphereId, keyId: cloud_sphere_key.id, data: {
              key:       cloud_sphere_key.key,
              keyType:   cloud_sphere_key.keyType,
              createdAt: new Date(cloud_sphere_key.createdAt).valueOf(),
              ttl:       cloud_sphere_key.ttl
            }})
          keysUpdated = true;
        }
        else if (
          localKey.key       !== cloud_sphere_key.key     ||
          localKey.keyType   !== cloud_sphere_key.keyType ||
          localKey.ttl       !== cloud_sphere_key.ttl     ||
          localKey.createdAt !== new Date(cloud_sphere_key.createdAt).valueOf()) {
          // update key
          keyActions.push({type:'UPDATE_SPHERE_KEY', sphereId: localSphereId, keyId: cloud_sphere_key.id, data: {
              key:       cloud_sphere_key.key,
              keyType:   cloud_sphere_key.keyType,
              createdAt: new Date(cloud_sphere_key.createdAt).valueOf(),
              ttl:       cloud_sphere_key.ttl
            }})
          keysUpdated = true;
        }
        else {
          // do nothing.
        }
      })

      Object.keys(localSphereKeys).forEach((localKeyId) => {
        if (cloudKeyMap[localKeyId] === undefined) {
          // remove key
          keyActions.push({type:'REMOVE_SPHERE_KEY', sphereId: localSphereId, keyId: localKeyId})
          keysUpdated = true;
        }
      })
    })

    if (keysUpdated) {
      core.store.batchDispatch(keyActions);
      core.eventBus.emit("KEYS_UPDATED");
    }
  }

}
