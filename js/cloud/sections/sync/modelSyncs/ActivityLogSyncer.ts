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

import {transferActivityLogs} from "../../../transferData/transferActivityLogs";
import {Util} from "../../../../util/Util";
import {SyncingSphereItemBase} from "./SyncingBase";
import {LOG} from "../../../../logging/Log";
import {CLOUD} from "../../../cloudAPI";
import {Permissions} from "../../../../backgroundProcesses/PermissionManager";
import { xUtil } from "../../../../util/StandAloneUtil";


export class ActivityLogSyncer extends SyncingSphereItemBase {
  localStoneId: string;
  cloudStoneId: string;

  activityLogUploadBatch : transferNewToCloudStoneData[][];
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
    // @ts-ignore
    this.activityLogUploadBatch = [];
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
      request['sinceTimestamp'] = lastSyncTime;
    }

    return CLOUD.forStone(this.cloudStoneId).getActivityLogs(request);
  }

  _getLocalData(store) {
    let state = store.getState();
    if (
      state &&
      state.spheres[this.localSphereId] &&
      state.spheres[this.localSphereId].stones &&
      state.spheres[this.localSphereId].stones[this.localStoneId]) {
      return state.spheres[this.localSphereId].stones[this.localStoneId].activityLogs;
    }
    return {};
  }

  sync(store) {
    let state = store.getState();
    if (state.user.uploadActivityLogs) {
      return this.download(state)
        .then((activity_logs_in_cloud) => {
          let activityLogsInState = this._getLocalData(store);
          let localActivityLogIdsSynced = this.syncDown(activityLogsInState, activity_logs_in_cloud);

          this.syncUp(activityLogsInState, localActivityLogIdsSynced);
          if (this.activityLogUploadBatch.length > 0) {
            let uploadCounter = 0;
            this.transferPromises.push(
              xUtil.promiseBatchPerformer(this.activityLogUploadBatch, (uploadBatch) => {
                uploadCounter++;
                LOG.info("SYNC: Uploading Activitylog batch: ", uploadCounter, ' from ', this.activityLogUploadBatch.length, ' which has ', uploadBatch.length, ' data points');
                // console.log("SYNC: Uploading Activitylog batch: ", uploadCounter, ' from ', this.activityLogUploadBatch.length,' which has ', uploadBatch.length, ' data points');
                return transferActivityLogs.batchCreateOnCloud(store.getState(), this.actions, uploadBatch);
              })
            )
          }

          this.actions.push({
            type: 'UPDATE_SYNC_ACTIVITY_TIME',
            sphereId: this.localSphereId,
            stoneId: this.localStoneId
          });

          return Promise.all(this.transferPromises);
        })
    }
    else {
      return new Promise((resolve, reject) => { resolve(); })
    }
  }

  syncDown(activityLogsInState, activity_logs_in_cloud) : object {
    let cloudIdMap = this._getCloudIdMap(activityLogsInState);
    let localActivityLogsIdsSynced = {};

    // find the schedule in our local database that matches the one in the cloud
    activity_logs_in_cloud.forEach((activity_log_in_cloud) => {
      let localId = cloudIdMap[activity_log_in_cloud.id];

      // if we do not have a schedule with exactly this cloudId, verify that we do not have the same schedule on our device already.
      if (localId === undefined) {
        localId = this._searchForLocalMatch(activityLogsInState, activity_log_in_cloud);
      }

      if (localId) {
        localActivityLogsIdsSynced[localId] = true;
      }
      else {
        // the schedule does not exist locally but it does exist in the cloud.
        // we create it locally.
        localId = xUtil.getUUID();
        localActivityLogsIdsSynced[localId] = true;
        // add activityLog
        transferActivityLogs.createLocal(this.actions, {
          localId: localId,
          localSphereId: this.localSphereId,
          localStoneId: this.localStoneId,
          cloudData: activity_log_in_cloud
        })
      }

    });

    return localActivityLogsIdsSynced;
  }

  syncUp(activityLogsInState, localActivityLogsIdsSynced) {
    let activityLogIds = Object.keys(activityLogsInState);
    activityLogIds.forEach((activityLogId) => {
      let activityLog = activityLogsInState[activityLogId];
      this.syncLocalActivityLogUp(
        activityLogId,
        activityLog,
        localActivityLogsIdsSynced[activityLogId] === true
      );
    });
  }


  syncLocalActivityLogUp(localId, activityLogInState, hasSyncedDown = false) {
    // if the scheduleId does not exist in the cloud but we have it locally.
    if (!hasSyncedDown) {
      if (!activityLogInState.cloudId) {
        // fill the batch uploader.
        if (this.activityLogUploadBatch.length === 0) {
          this.activityLogUploadBatch.push([]);
        }

        if (this.activityLogUploadBatch[this.activityLogUploadBatch.length-1].length >= this.maxBatchSize) {
          this.activityLogUploadBatch.push([]);
        }

        this.activityLogUploadBatch[this.activityLogUploadBatch.length-1].push({
          localId: localId,
          localData: activityLogInState,
          localSphereId: this.localSphereId,
          localStoneId: this.localStoneId,
          cloudStoneId: this.cloudStoneId
        })
      }
    }
  }


  _getCloudIdMap(localActivityLogs) {
    let cloudIdMap = {};
    let activityLogIds = Object.keys(localActivityLogs);
    activityLogIds.forEach((activityLogId) => {
      let activityLog = localActivityLogs[activityLogId];
      if (activityLog.cloudId) {
        cloudIdMap[activityLog.cloudId] = activityLogId;
      }
    });
    return cloudIdMap;
  }


  _searchForLocalMatch(activityLogsInState, activity_log_in_cloud) {
    let activityLogIds = Object.keys(activityLogsInState);
    for (let i = 0; i < activityLogIds.length; i++) {
      let activityLog = activityLogsInState[activityLogIds[i]];
      // is the time the same? comparing xx:xx (ie. 15:45)
      if (activityLog.cloudId === activity_log_in_cloud.id) {
        return activityLogIds[i];
      }
    }
    return null;
  }

}
