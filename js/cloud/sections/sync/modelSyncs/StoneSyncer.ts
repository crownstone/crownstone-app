/**
 * Sync the stones from the cloud to the database.
 */

import {shouldUpdateInCloud, shouldUpdateLocally} from "../shared/syncUtil";
import {transferStones} from "../../../transferData/transferStones";
import {CLOUD} from "../../../cloudAPI";
import {SyncingSphereItemBase} from "./SyncingBase";
import {ScheduleSyncer} from "./ScheduleSyncer";
import {LOGe, LOGw} from "../../../../logging/Log";
import {Permissions} from "../../../../backgroundProcesses/PermissionManager";
import {ActivityLogSyncer} from "./ActivityLogSyncer";
import {ActivityRangeSyncer} from "./ActivityRangeSyncer";
import { xUtil } from "../../../../util/StandAloneUtil";

export class StoneSyncer extends SyncingSphereItemBase {

  download() {
    return CLOUD.forSphere(this.cloudSphereId).getStonesInSphere()
  }

  _getLocalData(store) {
    let state = store.getState();
    if (state && state.spheres[this.localSphereId]) {
      return state.spheres[this.localSphereId].stones;
    }
    return {};
  }

  sync(store) {
    let stonesInState;
    let stonesInCloud;
    return this.download()
      .then((result) => {
        stonesInCloud = result;
        this._constructLocalIdMap();

        stonesInState = this._getLocalData(store);
        return this.syncDown(store, stonesInState, stonesInCloud);
      })
      .then((localStoneIdsSynced) => {

        this.syncUp(stonesInState, localStoneIdsSynced);

        // this.uploadDiagnostics(store, stonesInState, stonesInCloud);

        return Promise.all(this.transferPromises)
      })
      .then(() => { return this.actions });
  }

  syncDown(store, stonesInState, stonesInCloud) : object {
    let localStoneIdsSynced = {};
    let cloudIdMap = this._getCloudIdMap(stonesInState);

    // go through all stones in the cloud.
    return xUtil.promiseBatchPerformer(stonesInCloud, (stone_from_cloud) => { // underscores so its visually different from stoneInState
      this.transferPromises = [];

      let localId = cloudIdMap[stone_from_cloud.id];

      // determine the linked location id
      let locationLinkId = stone_from_cloud.locationId || null;

      // if we do not have a stone with exactly this cloudId, verify that we do not have the same stone on our device already.
      if (localId === undefined) {
        localId = this._searchForLocalMatch(stonesInState, stone_from_cloud);
      }

      if (localId) {
        localStoneIdsSynced[localId] = true;
        this.syncLocalStoneDown(localId, stonesInState[localId], stone_from_cloud, locationLinkId);
      }
      else {
        // the stone does not exist locally but it does exist in the cloud.
        // we create it locally.
        localId = xUtil.getUUID();

        let cloudDataForLocal = {...stone_from_cloud};
        cloudDataForLocal['localApplianceId'] = this._getLocalApplianceId(stone_from_cloud.applianceId);
        cloudDataForLocal['localLocationId']  = this._getLocalLocationId(locationLinkId);
        transferStones.createLocal(this.actions, {
          localSphereId: this.localSphereId,
          localId: localId,
          cloudId: stone_from_cloud.id,
          cloudData: cloudDataForLocal
        });
        this._copyBehaviourFromCloud(localId, stone_from_cloud );
      }

      cloudIdMap[stone_from_cloud.id] = localId;

      this.syncChildren(localId, store, stone_from_cloud);

      return Promise.all(this.transferPromises);
    })
      .then(() => {
        this.globalSphereMap.stones = {...this.globalSphereMap.stones, ...cloudIdMap};
        this.globalCloudIdMap.stones = {...this.globalCloudIdMap.stones, ...cloudIdMap};
        return localStoneIdsSynced;
      })
  }


  syncChildren(localId, store, stone_from_cloud) {
    let scheduleSyncing      = new ScheduleSyncer(     this.actions, [], this.localSphereId, this.cloudSphereId, localId, stone_from_cloud.id, this.globalCloudIdMap);
    let activityLogSyncing   = new ActivityLogSyncer(  this.actions, [], this.localSphereId, this.cloudSphereId, localId, stone_from_cloud.id, this.globalCloudIdMap);
    let activityRangeSyncing = new ActivityRangeSyncer(this.actions, [], this.localSphereId, this.cloudSphereId, localId, stone_from_cloud.id, this.globalCloudIdMap);

    this.transferPromises.push(
      scheduleSyncing.sync(store, stone_from_cloud.schedules)
        .then(() => {
          return activityLogSyncing.sync(store)
        })
        .then(() => {
          return activityRangeSyncing.sync(store)
        })
    );
  }


  syncUp(stonesInState, localStoneIdsSynced) {
    let localStoneIds = Object.keys(stonesInState);

    localStoneIds.forEach((stoneId) => {
      let stone = stonesInState[stoneId];
      this.syncLocalStoneUp(
        stone,
        stoneId,
        localStoneIdsSynced[stoneId] === true
      )
    });
  }



  _getCloudIdMap(stonesInState) {
    let cloudIdMap = {};
    let stoneIds = Object.keys(stonesInState);
    stoneIds.forEach((stoneId) => {
      let stone = stonesInState[stoneId];
      if (stone.config.cloudId) {
        cloudIdMap[stone.config.cloudId] = stoneId;
      }
    });

    return cloudIdMap;
  }

  _searchForLocalMatch(stonesInState, stone_in_cloud) {
    let stoneIds = Object.keys(stonesInState);
    for (let i = 0; i < stoneIds.length; i++) {
      let stone = stonesInState[stoneIds[i]];
      if (stone.config.macAddress === stone_in_cloud.address) {
        return stoneIds[i];
      }
    }

    return null;
  }

  syncLocalStoneUp(localStone, localStoneId, hasSyncedDown = false) {
    // if the object does not have a cloudId, it does not exist in the cloud but we have it locally.
    if (!hasSyncedDown) {
      if (localStone.config.cloudId) {
        this.actions.push({ type: 'REMOVE_STONE', sphereId: this.localSphereId, stoneId: localStoneId });
      }
      else {
        if (!Permissions.inSphere(this.localSphereId).canCreateStones) { return }

        let localDataForCloud = {...localStone};
        localDataForCloud.config['cloudApplianceId'] = this._getCloudApplianceId(localStone.applianceId);
        localDataForCloud.config['cloudLocationId']  = this._getCloudLocationId( localStone.locationId);
        this.transferPromises.push(
          transferStones.createOnCloud(
            this.actions, {
              localId: localStoneId,
              localData: localDataForCloud,
              localSphereId: this.localSphereId,
              cloudSphereId: this.cloudSphereId
            }));
      }
    }
  }


  _getLocalApplianceId(cloudId) {
    if (!cloudId) { return null; }
    return this.globalCloudIdMap.appliances[cloudId] || null;
  }

  _getLocalLocationId(cloudId) {
    if (!cloudId) { return null; }
    return this.globalCloudIdMap.locations[cloudId] || null;
  }

  _getCloudApplianceId(localId) {
    if (!localId) { return; }
    return this.globalLocalIdMap.appliances[localId];
  }

  _getCloudLocationId(localId) {
    if (!localId) { return; }
    return this.globalLocalIdMap.locations[localId];
  }

  syncLocalStoneDown(localId, stoneInState, stone_from_cloud, locationLinkId) {
    // somehow sometimes ibeacon major and minor go missing. If this happens, redownload from cloud
    let corruptData = !stoneInState.config.iBeaconMajor || !stoneInState.config.iBeaconMinor;

    let localApplianceId = this._getLocalApplianceId(stone_from_cloud.applianceId);
    let localLocationId  = this._getLocalLocationId(locationLinkId);

    let syncLocal = () => {
      let cloudDataForLocal = {...stone_from_cloud};
      cloudDataForLocal['localApplianceId'] = localApplianceId;
      cloudDataForLocal['localLocationId']  = localLocationId;
      transferStones.updateLocal(this.actions, {
        localSphereId: this.localSphereId,
        localId: localId,
        cloudId: stone_from_cloud.id,
        cloudData: cloudDataForLocal
      })
    };

    if (shouldUpdateInCloud(stoneInState.config, stone_from_cloud) && !corruptData) {
      if (!Permissions.inSphere(this.localSphereId).canUploadStones) { return }

      let localDataForCloud = {...stoneInState};
      localDataForCloud.config['cloudApplianceId'] = this._getCloudApplianceId(stoneInState.applianceId);
      localDataForCloud.config['cloudLocationId']  = this._getCloudLocationId(stoneInState.locationId);
      this.transferPromises.push(
        transferStones.updateOnCloud({
          localId: localId,
          localData: localDataForCloud,
          localSphereId: this.localSphereId,
          cloudSphereId: this.cloudSphereId,
          cloudId: stone_from_cloud.id,
        })
        .catch(() => {})
      );
    }
    else if (shouldUpdateLocally(stoneInState.config, stone_from_cloud) || corruptData) {
      syncLocal()
    }
    else if (!stoneInState.config.uid) { // self repair
      LOGw.cloud("StoneSyncer: Repairing Stone due to non-existing uid.");
      syncLocal();
    }
    else if (stoneInState.config.applianceId && localApplianceId === null) { // self repair
      LOGw.cloud("StoneSyncer: Repairing Stone due to non-existing applianceId.");
      syncLocal();
    }
    else if (stoneInState.config.locationId && localLocationId === null) {   // self repair
      LOGw.cloud("StoneSyncer: Repairing Stone due to non-existing locationId.");
      syncLocal();
    }
    else if (localLocationId && stoneInState.config.locationId === null) {   // self repair
      LOGw.cloud("StoneSyncer: Repairing Stone due to non-existing locationId.");
      syncLocal();
    }

    if (!stoneInState.config.cloudId) {
      this.actions.push({type:'UPDATE_STONE_CLOUD_ID', sphereId: this.localSphereId, stoneId: localId, data:{cloudId: stone_from_cloud.id}})
    }
  };


  _copyBehaviourFromCloud(localId, stone_from_cloud) {
    // we only download the behaviour the first time we add the stone.
    if (stone_from_cloud.json !== undefined) {
      let behaviour = JSON.parse(stone_from_cloud.json);

      if (behaviour.onHomeEnter)
        this.actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeEnter', sphereId: this.localSphereId, stoneId: localId, data: behaviour.onHomeEnter });
      if (behaviour.onHomeExit)
        this.actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeExit',  sphereId: this.localSphereId, stoneId: localId, data: behaviour.onHomeExit });
      if (behaviour.onRoomEnter)
        this.actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomEnter', sphereId: this.localSphereId, stoneId: localId, data: behaviour.onRoomEnter });
      if (behaviour.onRoomExit)
        this.actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomExit',  sphereId: this.localSphereId, stoneId: localId, data: behaviour.onRoomExit });
      if (behaviour.onNear)
        this.actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onNear', sphereId: this.localSphereId, stoneId: localId, data: behaviour.onNear });
      if (behaviour.onAway)
        this.actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onAway', sphereId: this.localSphereId, stoneId: localId, data: behaviour.onAway });
    }
  };


  // uploadDiagnostics(store, stonesInState, stonesInCloud) {
    // let userInState = store.getState().user;
    //
    // if (!userInState.uploadDiagnostics) {
    //   return;
    // }
    //
    // if (!Permissions.inSphere(this.localSphereId).canUploadDiagnostics) {
    //   return;
    // }
    //
    // let cloudIdMap = this._getCloudIdMap(stonesInState);
    //
    // stonesInCloud.forEach((stone_from_cloud) => { // underscores so its visually different from stoneInState
    //   let localId = cloudIdMap[stone_from_cloud.id];
    //
    //   if (localId) {
    //     let stoneInState = stonesInState[localId];
    //
    //     let cloudId = stone_from_cloud.id;
    //     let uploaded = false;
    //     if (stoneInState.reachability.lastSeen) {
    //       uploaded = true;
    //       this.transferPromises.push(
    //         CLOUD.forStone(cloudId).sendStoneDiagnosticInfo({
    //           timestamp: new Date().valueOf(),
    //           type: 'lastSeen',
    //           value: stoneInState.reachability.lastSeen
    //         }).catch((err) => { LOGe.cloud("StoneSyncer: Could not upload lastSeen Diagnostic", err); })
    //       );
    //     }
    //
    //
    //     // if (uploaded) {
    //     //   // TODO: Needs a special sync time for the last seen field. It is also used for location purposes. We cant just set it to 0.
    //     //   this.actions.push({
    //     //     type: 'UPDATE_STONE_REACHABILITY',
    //     //     sphereId: this.localSphereId,
    //     //     stoneId: localId,
    //     //     data: {lastSeen: null}
    //     //   });
    //     // }
    //   }
    // });
  // }
}
