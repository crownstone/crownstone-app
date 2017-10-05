/**
 * Sync the stones from the cloud to the database.
 */

import {shouldUpdateInCloud, shouldUpdateLocally} from "../shared/syncUtil";
import {transferStones} from "../../../transferData/transferStones";
import {CLOUD} from "../../../cloudAPI";
import {Util} from "../../../../util/Util";
import {SyncingSphereItemBase} from "./SyncingBase";
import {ScheduleSyncer} from "./ScheduleSyncer";
import {LOG} from "../../../../logging/Log";
import {Permissions} from "../../../../backgroundProcesses/PermissionManager";

export class StoneSyncer extends SyncingSphereItemBase {

  download() {
    return CLOUD.forSphere(this.cloudSphereId).getStonesInSphere({background: true})
  }

  sync(state, stonesInState) {
    this._constructLocalIdMap();

    return this.download()
      .then((stonesInCloud) => {
        let localStoneIdsSynced = this.syncDown(stonesInState, stonesInCloud);
        this.syncUp(stonesInState, localStoneIdsSynced);

        return Promise.all(this.transferPromises)
      })
      .then(() => { return this.actions });
  }

  syncDown(stonesInState, stonesInCloud) : object {
    let localStoneIdsSynced = {};
    let cloudIdMap = this._getCloudIdMap(stonesInState);

    // go through all stones in the cloud.
    stonesInCloud.forEach((stone_from_cloud) => { // underscores so its visually different from stoneInState
      let localId = cloudIdMap[stone_from_cloud.id];

      // determine the linked location id
      // TODO: [2017-10-02] RETROFIT CODE: AFTER A FEW RELEASES
      let locationLinkId = null;
      if (stone_from_cloud.locations.length > 0 && stone_from_cloud.locations[0]) {
        locationLinkId = stone_from_cloud.locations[0].id;
      }
      else {
        locationLinkId = null;
      }

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
        localId = Util.getUUID();

        let cloudDataForLocal = {...stone_from_cloud};
        cloudDataForLocal['localApplianceId'] = this._getLocalApplianceId(stone_from_cloud.applianceId);
        cloudDataForLocal['localLocationId']  = this._getLocalLocationId(locationLinkId);
        this.transferPromises.push(
          transferStones.createLocal(this.actions, {
            localSphereId: this.localSphereId,
            localId: localId,
            cloudId: stone_from_cloud.id,
            cloudData: stone_from_cloud
          })
            .then(() => {
              this._copyBehaviourFromCloud(localId, stone_from_cloud );
            })
            .catch()
        );
      }

      this.syncChildren(localId, localId ? stonesInState[localId] : null, stone_from_cloud);
    });

    return localStoneIdsSynced;
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

  syncChildren(localId, localStone, stone_from_cloud) {
    let scheduleSyncing = new ScheduleSyncer(
      this.globalCloudIdMap,
      this.actions,
      this.transferPromises,
      this.localSphereId,
      this.cloudSphereId,
      localId,
      stone_from_cloud.id
    );

    this.transferPromises.push(
      scheduleSyncing.sync(
        localStone && localStone.schedules || {},
        stone_from_cloud.schedules
      )
    );
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
            this.actions, { localId: localStoneId, localData: localStone, localSphereId: this.localSphereId, cloudSphereId: this.cloudSphereId }));
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
    return this.globalLocalIdMap.appliances(localId);
  }

  _getCloudLocationId(localId) {
    if (!localId) { return; }
    return this.globalLocalIdMap.locations(localId);
  }

  syncLocalStoneDown(localId, stoneInState, stone_from_cloud, locationLinkId) {
    if (shouldUpdateInCloud(stoneInState.config, stone_from_cloud)) {
      if (!Permissions.inSphere(this.localSphereId).canUploadStones) { return }

      let localDataForCloud = {...stoneInState};
      localDataForCloud.config['cloudApplianceId'] = this._getCloudApplianceId(stoneInState.applianceId);
      localDataForCloud.config['cloudLocationId']  = this._getCloudLocationId(stoneInState.locationId);
      this.transferPromises.push(
        transferStones.updateOnCloud({
          cloudSphereId: this.cloudSphereId,
          localId: localId,
          cloudId: stone_from_cloud.id,
          localData: localDataForCloud,
        })
          .then(() => {
            // check if we have to sync the locations:
            if (stoneInState.config.locationId !== locationLinkId) {
              // if the one in the cloud is null, we only create a link
              if (locationLinkId === null && stoneInState.config.locationId !== null) {
                CLOUD.forStone(stone_from_cloud.id).updateStoneLocationLink(stoneInState.config.locationId, this.cloudSphereId, stoneInState.config.updatedAt, true).catch(() => {
                });
              }
              else {
                CLOUD.forStone(stone_from_cloud.id).deleteStoneLocationLink(locationLinkId,this.cloudSphereId, stoneInState.config.updatedAt, true)
                  .then(() => {
                    if (stoneInState.config.locationId !== null) {
                      return CLOUD.forStone(stone_from_cloud.id).updateStoneLocationLink(stoneInState.config.locationId, this.cloudSphereId, stoneInState.config.updatedAt, true);
                    }
                  }).catch(() => {
                })
              }
            }
          })
          .catch()
      );
    }
    else if (shouldUpdateLocally(stoneInState.config, stone_from_cloud) || !stoneInState.config.cloudId) {
      let cloudDataForLocal = {...stone_from_cloud};
      cloudDataForLocal['localApplianceId'] = this._getLocalApplianceId(stone_from_cloud.applianceId);
      cloudDataForLocal['localLocationId']  = this._getLocalLocationId(locationLinkId);
      this.transferPromises.push(
        transferStones.updateLocal(this.actions, {
          localSphereId: this.localSphereId,
          localId: localId,
          cloudId: stone_from_cloud.id,
          cloudData: stone_from_cloud
        }).catch()
      );
    }
    // TODO: [2017-10-02] RETROFIT CODE: AFTER A FEW RELEASES
    else if (stone_from_cloud.locationId === undefined) {
      if (!Permissions.inSphere(this.localSphereId).canUploadStones) { return }
      let localDataForCloud = {...stoneInState};
      localDataForCloud.config['cloudApplianceId'] = this._getCloudApplianceId(stoneInState.applianceId);
      localDataForCloud.config['cloudLocationId']  = this._getCloudLocationId(stoneInState.locationId);
      this.transferPromises.push(
        transferStones.updateOnCloud({
          localId: localId,
          localData: localDataForCloud,
          cloudId: stone_from_cloud.id,
          cloudSphereId: this.cloudSphereId,
        })
        .catch()
      );
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
}
