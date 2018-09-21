/**
 *
 * Sync the appliances from the cloud to the database.
 *
 */

import {shouldUpdateLocally} from "../../shared/syncUtil";
import {CLOUD} from "../../../../cloudAPI";
import {SyncingSphereItemBase} from "../SyncingBase";
import {Permissions} from "../../../../../backgroundProcesses/PermissionManager";
import {transferToons} from "../../../../transferData/thirdParty/transferToons";

export class ToonSyncer extends SyncingSphereItemBase {
  userId: string;

  download() {
    return CLOUD.forSphere(this.cloudSphereId).getToons();
  }

  _getLocalData(store) {
    let state = store.getState();
    if (state && state.spheres[this.localSphereId]
      && state.spheres[this.localSphereId].thirdParty.toons) {
      return state.spheres[this.localSphereId].thirdParty.toons;
    }
    return {};
  }

  sync(store) {
    return this.download()
      .then((toons_in_cloud) => {
        let toonsInState = this._getLocalData(store);
        let localToonsSynced = this.syncDown(toonsInState, toons_in_cloud);
        this.syncUp(store, toonsInState, localToonsSynced);

        return Promise.all(this.transferPromises);
      })
      .then(() => { return this.actions; });
  }

  syncDown(toonsInState, toons_in_cloud) : object {
    let localToonIdsSynced = {};
    let cloudIdMap = this._getCloudIdMap(toonsInState);

    // go through all toons in the cloud.
    toons_in_cloud.forEach((toon_in_cloud) => { // underscores so its visually different from applianceInState
      let localId = cloudIdMap[toon_in_cloud.id];

      // if we do not have a toon with exactly this cloudId, verify that we do not have the same appliance on our device already.
      if (localId === undefined) {
        localId = this._searchForLocalMatch(toonsInState, toon_in_cloud);
      }

      // item exists locally.
      if (localId) {
        localToonIdsSynced[localId] = true;
        this.syncToonDown(localId, toonsInState[localId], toon_in_cloud);
      }
      else {
        // the appliance does not exist locally but it does exist in the cloud.
        // we create it locally.
        localId = toon_in_cloud.toonAgreementId;
        transferToons.createLocal(this.actions, {
          localId: localId,
          localSphereId: this.localSphereId,
          cloudData: toon_in_cloud
        })
      }

      cloudIdMap[toon_in_cloud.id] = localId;
    });

    this.globalSphereMap.toons = {...this.globalSphereMap.toons, ...cloudIdMap};
    this.globalCloudIdMap.toons = {...this.globalCloudIdMap.toons, ...cloudIdMap};
    return localToonIdsSynced;
  }

  syncUp(store, toonsInState, localToonIdsSynced) {
    let localToonIds = Object.keys(toonsInState);

    localToonIds.forEach((toonId) => {
      let toon = toonsInState[toonId];
      this.syncLocalToonUp(
        store,
        toon,
        toonId,
        localToonIdsSynced[toonId] === true
      )
    });
  }


  syncLocalToonUp(store, localToon, localToonId, hasSyncedDown = false) {
    // if the object does not have a cloudId, it does not exist in the cloud but we have it locally.
    if (!hasSyncedDown) {
      if (localToon.config.cloudId) {
        this.actions.push({ type: 'REMOVE_TOON', sphereId: this.localSphereId, toonId: localToonId });
      }
      else {
        if (!Permissions.inSphere(this.localSphereId).setToonInCloud) { return; }

        this.transferPromises.push(
          transferToons.createOnCloud(this.actions, {
            localId: localToonId,
            localSphereId: this.localSphereId,
            cloudSphereId: this.cloudSphereId,
            localData: localToon
          })
          .then((cloudId) => {
            this.globalCloudIdMap.toons[cloudId] = localToonId;
          })
        );
      }
    }
  }


  syncToonDown(localId, toonInState, toon_from_cloud) {
    if (toonInState.schedule !== toon_from_cloud.schedule) {
      transferToons.updateLocal(this.actions, {
        localSphereId:  this.localSphereId,
        localId:        localId,
        cloudId:        toon_from_cloud.id,
        cloudData:      toon_from_cloud
      })
    }

    if (!toonInState.cloudId) {
      this.actions.push({type:'UPDATE_TOON_CLOUD_ID', sphereId: this.localSphereId, toonId: localId, data:{cloudId: toon_from_cloud.id}})
    }
  };

  _getCloudIdMap(toonsInState) {
    let cloudIdMap = {};
    let toonIds = Object.keys(toonsInState);
    toonIds.forEach((toonId) => {
      let toon = toonsInState[toonId];
      if (toon.cloudId) {
        cloudIdMap[toon.cloudId] = toonId;
      }
    });

    return cloudIdMap;
  }

  _searchForLocalMatch(toonsInState, toon_in_cloud) {
    let toonIds = Object.keys(toonsInState);
    for (let i = 0; i < toonIds.length; i++) {
      if (toonIds[i] === toon_in_cloud.toonAgreementId) {
        return toonIds[i];
      }
    }

    return null;
  }

}
