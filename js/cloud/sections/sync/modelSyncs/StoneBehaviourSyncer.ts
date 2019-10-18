/**
 *
 * Sync the messages from the cloud to the database.
 *
 */

import {shouldUpdateInCloud, shouldUpdateLocally} from "../shared/syncUtil";
import {CLOUD} from "../../../cloudAPI";
import { SyncingSphereItemBase, SyncingStoneItemBase } from "./SyncingBase";
import { xUtil } from "../../../../util/StandAloneUtil";
import { transferStones } from "../../../transferData/transferStones";
import { Permissions } from "../../../../backgroundProcesses/PermissionManager";
import { LOGw } from "../../../../logging/Log";
import { transferBehaviours } from "../../../transferData/transferBehaviours";

export class StoneBehaviourSyncer extends SyncingStoneItemBase {
  sync(behavioursInState, cloud_behaviours) {
    return this.syncDown(behavioursInState, cloud_behaviours)
      .then(() => {
        return this.syncUp();
      })
      .then(() => {
        return Promise.all(this.transferPromises);
      })
  }

  syncDown(behavioursInState, cloud_behaviours) {
    let localBehaviourIdsSynced = {};
    let cloudIdMap = this._getCloudIdMap(behavioursInState);

    // go through all stones in the cloud.
    return xUtil.promiseBatchPerformer(behavioursInState, (cloud_behaviour) => { // underscores so its visually different from stoneInState
      this.transferPromises = [];

      let localId = cloudIdMap[cloud_behaviour.id];

      // if we do not have a stone with exactly this cloudId, verify that we do not have the same stone on our device already.
      if (localId === undefined) {
        localId = this._searchForLocalMatch(behavioursInState, cloud_behaviour);
      }

      if (localId) {
        localBehaviourIdsSynced[localId] = true;
        this.syncLocalBehaviourDown(localId, behavioursInState[localId], cloud_behaviour);
      }
      else {
        // the stone does not exist locally but it does exist in the cloud.
        // we create it locally.
        localId = xUtil.getUUID();

        let cloudDataForLocal = {...cloud_behaviour};
        transferBehaviours.createLocal(this.actions, {
          localSphereId: this.localSphereId,
          localStoneId: this.localStoneId,
          localId: localId,
          cloudData: cloudDataForLocal
        });
      }

      cloudIdMap[cloud_behaviour.id] = localId;

      return Promise.all(this.transferPromises);
    })
      .then(() => {
        this.globalSphereMap.behaviours = {...this.globalSphereMap.behaviours, ...cloudIdMap};
        this.globalCloudIdMap.behaviours = {...this.globalCloudIdMap.behaviours, ...cloudIdMap};
        return localBehaviourIdsSynced;
      })
  }
  //
  //
  // syncUp(stonesInState, localStoneIdsSynced) {
  //   let localStoneIds = Object.keys(stonesInState);
  //
  //   localStoneIds.forEach((stoneId) => {
  //     let stone = stonesInState[stoneId];
  //     this.syncLocalStoneUp(
  //       stone,
  //       stoneId,
  //       localStoneIdsSynced[stoneId] === true
  //     )
  //   });
  // }
  //
  //
  //
  _getCloudIdMap(behavioursInState) {
    let cloudIdMap = {};
    let stoneIds = Object.keys(behavioursInState);
    stoneIds.forEach((stoneId) => {
      let stone = behavioursInState[stoneId];
      if (stone.config.cloudId) {
        cloudIdMap[stone.config.cloudId] = stoneId;
      }
    });

    return cloudIdMap;
  }

  _searchForLocalMatch(behavioursInState, behaviour_in_cloud) {

    //
    // let stoneIds = Object.keys(stonesInState);
    // for (let i = 0; i < stoneIds.length; i++) {
    //   let stone = stonesInState[stoneIds[i]];
    //   if (stone.config.macAddress === stone_in_cloud.address) {
    //     return stoneIds[i];
    //   }
    // }

    return null;
  }
  //
  // syncLocalStoneUp(localStone, localStoneId, hasSyncedDown = false) {
  //   // if the object does not have a cloudId, it does not exist in the cloud but we have it locally.
  //   if (!hasSyncedDown) {
  //     if (localStone.config.cloudId) {
  //       this.actions.push({ type: 'REMOVE_STONE', sphereId: this.localSphereId, stoneId: localStoneId });
  //     }
  //     else {
  //       if (!Permissions.inSphere(this.localSphereId).canCreateStones) { return }
  //
  //       let localDataForCloud = {...localStone};
  //       localDataForCloud.config['cloudLocationId']  = this._getCloudLocationId( localStone.locationId);
  //       this.transferPromises.push(
  //         transferStones.createOnCloud(
  //           this.actions, {
  //             localId: localStoneId,
  //             localData: localDataForCloud,
  //             localSphereId: this.localSphereId,
  //             cloudSphereId: this.cloudSphereId
  //           }));
  //     }
  //   }
  // }
  //
  //
  // _getLocalLocationId(cloudId) {
  //   if (!cloudId) { return null; }
  //   return this.globalCloudIdMap.locations[cloudId] || null;
  // }
  //
  // _getCloudLocationId(localId) {
  //   if (!localId) { return; }
  //   return this.globalLocalIdMap.locations[localId];
  // }
  //
  syncLocalBehaviourDown(localId, behaviourInState, behaviour_in_cloud) {
    // // somehow sometimes ibeacon major and minor go missing. If this happens, redownload from cloud
    // let syncLocal = () => {
    //   let cloudDataForLocal = {...stone_from_cloud};
    //   transferStones.updateLocal(this.actions, {
    //     localSphereId: this.localSphereId,
    //     localId: localId,
    //     cloudId: stone_from_cloud.id,
    //     cloudData: cloudDataForLocal
    //   })
    // };
    //
    // if (shouldUpdateInCloud(stoneInState.config, stone_from_cloud) && !corruptData) {
    //   if (!Permissions.inSphere(this.localSphereId).canUploadStones) { return }
    //
    //   let localDataForCloud = {...stoneInState};
    //   localDataForCloud.config['cloudLocationId']  = this._getCloudLocationId(stoneInState.locationId);
    //   this.transferPromises.push(
    //     transferStones.updateOnCloud({
    //       localId: localId,
    //       localData: localDataForCloud,
    //       localSphereId: this.localSphereId,
    //       cloudSphereId: this.cloudSphereId,
    //       cloudId: stone_from_cloud.id,
    //     })
    //       .catch(() => {})
    //   );
    // }
    // else if (shouldUpdateLocally(stoneInState.config, stone_from_cloud) || corruptData) {
    //   syncLocal()
    // }
    // else if (!stoneInState.config.uid) { // self repair
    //   LOGw.cloud("StoneSyncer: Repairing Stone due to non-existing uid.");
    //   syncLocal();
    // }
    // else if (stoneInState.config.locationId && localLocationId === null) {   // self repair
    //   LOGw.cloud("StoneSyncer: Repairing Stone due to non-existing locationId.");
    //   syncLocal();
    // }
    // else if (localLocationId && stoneInState.config.locationId === null) {   // self repair
    //   LOGw.cloud("StoneSyncer: Repairing Stone due to non-existing locationId.");
    //   syncLocal();
    // }
    //
    // if (!stoneInState.config.cloudId) {
    //   this.actions.push({type:'UPDATE_STONE_CLOUD_ID', sphereId: this.localSphereId, stoneId: localId, data:{cloudId: stone_from_cloud.id}})
    // }
  };

}
