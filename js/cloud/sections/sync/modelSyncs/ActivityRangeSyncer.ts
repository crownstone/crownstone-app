/**
 * Sync schedules in this stone.
 * @param actions
 * @param transferPromises
 * @param state
 * @param cloudSpheresData
 * @param sphere
 * @param stone_from_cloud
 * @param cloudScheduleIds
 * @param sphereInState
 */

import {transferActivityRanges} from "../../../transferData/transferActivityRanges";
import {Util} from "../../../../util/Util";
import {SyncingSphereItemBase} from "./SyncingBase";
import {LOG, LOGe} from "../../../../logging/Log";
import {CLOUD} from "../../../cloudAPI";
import {Permissions} from "../../../../backgroundProcesses/PermissionManager";


export class ActivityRangeSyncer extends SyncingSphereItemBase {
  localStoneId: string;
  cloudStoneId: string;

  activityRangeUpdateBatch : transferNewToCloudStoneData[]
  activityRangeCreateBatch : transferNewToCloudStoneData[]
  maxBatchSize;

  constructor(
    actions: any[],
    transferPromises : any[],
    localSphereId : string,
    cloudSphereId : string,
    localStoneId : string,
    cloudStoneId : string,
    globalCloudIdMap? : globalIdMap,
    globalSphereMap? : globalIdMap
  ) {
    super(actions, transferPromises, localSphereId, cloudSphereId, globalCloudIdMap, globalSphereMap);

    this.localStoneId = localStoneId;
    this.cloudStoneId = cloudStoneId;

    this.activityRangeUpdateBatch = [];
    this.activityRangeCreateBatch = [];
    this.maxBatchSize = 100;
  }


  download(state) {
    if (Permissions.inSphere(this.localSphereId).seeActivityLogs === false) {
      return new Promise((resolve, reject) => { resolve([]); })
    }

    let lastSyncTime = null;
    if (state &&
      state.spheres[this.localSphereId] &&
      state.spheres[this.localSphereId].stones &&
      state.spheres[this.localSphereId].stones[this.localStoneId]) {
      lastSyncTime = state.spheres[this.localSphereId].stones[this.localStoneId].lastUpdated.syncedActivityLog;
    }

    let request = { excludeUserId: state.user.userId, yourTimestamp: new Date().valueOf() };
    if (lastSyncTime) {
      // we will get the pending ranges from the last 12 hours at least
      request['sinceTimestamp'] = Math.min(new Date().valueOf() - 12*3600000, lastSyncTime);
    }

    return CLOUD.forStone(this.cloudStoneId).getActivityRanges(request);
  }

  _getLocalData(store) {
    let state = store.getState();
    if (
      state &&
      state.spheres[this.localSphereId] &&
      state.spheres[this.localSphereId].stones &&
      state.spheres[this.localSphereId].stones[this.localStoneId]) {
      return state.spheres[this.localSphereId].stones[this.localStoneId].activityRanges;
    }
    return {};
  }

  sync(store) {
    let state = store.getState();
    return this.download(state)
      .then((activity_ranges_in_cloud) => {
        let activityRangesInState = this._getLocalData(store);
        let localActivityRangeIdsSynced = this.syncDown(activityRangesInState, activity_ranges_in_cloud);

        this.syncUp(activityRangesInState, localActivityRangeIdsSynced);
        if ( this.activityRangeCreateBatch.length > 0) {
          this.transferPromises.push(transferActivityRanges.batchCreateOnCloud(state, this.actions, this.activityRangeCreateBatch));
        }

        if (this.activityRangeUpdateBatch.length > 0) {
          this.transferPromises.push(transferActivityRanges.batchUpdateOnCloud(state, this.actions, this.activityRangeUpdateBatch));
        }

        return Promise.all(this.transferPromises);
      })
  }

  syncDown(activityRangesInState, activity_ranges_in_cloud) : object {
    let cloudIdMap = this._getCloudIdMap(activityRangesInState);
    let localActivityRangesIdsSynced = {};

    // find the schedule in our local database that matches the one in the cloud
    activity_ranges_in_cloud.forEach((activity_range_in_cloud) => {
      let localId = cloudIdMap[activity_range_in_cloud.id];

      // if we do not have a schedule with exactly this cloudId, verify that we do not have the same schedule on our device already.
      if (localId === undefined) {
        localId = this._searchForLocalMatch(activityRangesInState, activity_range_in_cloud);
      }

      if (localId) {
        localActivityRangesIdsSynced[localId] = true;
        this.syncLocalActivityRangeDown(localId, activityRangesInState[localId], activity_range_in_cloud)
      }
      else {
        // the schedule does not exist locally but it does exist in the cloud.
        // we create it locally.
        localId = Util.getUUID();
        localActivityRangesIdsSynced[localId] = true;
        // add activityRange
        transferActivityRanges.createLocal(this.actions, {
          localId: localId,
          localSphereId: this.localSphereId,
          localStoneId: this.localStoneId,
          cloudData: activity_range_in_cloud
        });
      }

    });

    return localActivityRangesIdsSynced;
  }

  syncLocalActivityRangeDown(localId, activityRangeInState, activity_range_in_cloud) {
    if (activity_range_in_cloud.count > activityRangeInState.count) {
      // update local
      transferActivityRanges.updateLocal(this.actions, {
        localId: localId,
        localSphereId: this.localSphereId,
        localStoneId: this.localStoneId,
        cloudData: activity_range_in_cloud
      });
    }
    else if (activity_range_in_cloud.count < activityRangeInState.count) {
      // update cloud
      this.activityRangeUpdateBatch.push({
        localId:       localId,
        localData:     activityRangeInState,
        localSphereId: this.localSphereId,
        localStoneId:  this.localStoneId,
        cloudStoneId:  this.cloudStoneId,
      });
    }
  }

  syncUp(activityRangesInState, localActivityRangeIdsSynced) {
    let activityRangeIds = Object.keys(activityRangesInState);
    activityRangeIds.forEach((activityRangeId) => {
      let activityRange = activityRangesInState[activityRangeId];
      this.syncLocalActivityRangeUp(
        activityRangeId,
        activityRange,
        localActivityRangeIdsSynced[activityRangeId] === true
      );
    });
  }


  syncLocalActivityRangeUp(localId, activityRangeInState, hasSyncedDown = false) {
    // if the scheduleId does not exist in the cloud but we have it locally.
    if (!hasSyncedDown) {
      if (!activityRangeInState.cloudId) {
        // fill the batch uploader.
        this.activityRangeCreateBatch.push({
          localId:       localId,
          localData:     activityRangeInState,
          localSphereId: this.localSphereId,
          localStoneId:  this.localStoneId,
          cloudStoneId:  this.cloudStoneId,
        });
      }
    }
  }


  _getCloudIdMap(localActivityRanges) {
    let cloudIdMap = {};
    let activityRangeIds = Object.keys(localActivityRanges);
    activityRangeIds.forEach((activityRangeId) => {
      let activityRange = localActivityRanges[activityRangeId];
      if (activityRange.cloudId) {
        cloudIdMap[activityRange.cloudId] = activityRangeId;
      }
    });
    return cloudIdMap;
  }


  _searchForLocalMatch(activityRangesInState, activity_range_in_cloud) {
    let activityRangeIds = Object.keys(activityRangesInState);
    for (let i = 0; i < activityRangeIds.length; i++) {
      let activityRange = activityRangesInState[activityRangeIds[i]];
      // is the time the same? comparing xx:xx (ie. 15:45)
      if (activityRange.cloudId === activity_range_in_cloud.id) {
        return activityRangeIds[i];
      }
    }
    return null;
  }

}
