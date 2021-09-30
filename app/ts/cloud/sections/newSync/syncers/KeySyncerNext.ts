import { DataUtil } from "../../../../util/DataUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { Get } from "../../../../util/GetUtil";
import { xUtil } from "../../../../util/StandAloneUtil";
import { core } from "../../../../Core";
import { KEY_TYPES } from "../../../../Enums";
import { SyncViewInterface } from "./base/SyncViewInterface";



export class KeySyncerNext extends SyncViewInterface<UserKeySet> {

  /**
   * This syncer does not use the actions from the syncer because if the syncer fails, we want the keys to be set regardless.
   * @param data
   */
  handleData(data: UserKeySet) {
    let keysUpdated = false;
    let keyActions = [];


    let state = core.store.getState();
    data.forEach((keySet) => {
      let localSphereId = this.globalCloudIdMap.spheres[keySet.sphereId];

      let sphere : SphereData = state.spheres[localSphereId];

      // the sphere authorization token is added/updated each sync operation. Add will update if the keyId is the same, which in this case, it is.
      this.actions.push({type:'ADD_SPHERE_KEY', sphereId: localSphereId, keyId: KEY_TYPES.SPHERE_AUTHORIZATION_TOKEN, data: {
          key:       keySet.sphereAuthorizationToken,
          keyType:   KEY_TYPES.SPHERE_AUTHORIZATION_TOKEN,
          createdAt: 0,
          ttl:       0
        }})


      // if the sphere does not exist yet, it will be added in this sync cycle, and these keys will be added afterwards.
      if (!sphere) {
        let cloud_sphere_keys = keySet.sphereKeys ?? [];
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
      let cloud_sphere_keys = keySet.sphereKeys ?? [];
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

