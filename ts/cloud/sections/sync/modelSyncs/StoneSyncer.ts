/**
 * Sync the stones from the cloud to the database.
 */

import {shouldUpdateInCloud, shouldUpdateLocally} from "../shared/syncUtil";
import {transferStones} from "../../../transferData/transferStones";
import {CLOUD} from "../../../cloudAPI";
import {SyncingSphereItemBase} from "./SyncingBase";
import {LOGe, LOGw} from "../../../../logging/Log";
import {Permissions} from "../../../../backgroundProcesses/PermissionManager";
import { xUtil } from "../../../../util/StandAloneUtil";
import { StoneAbilitySyncer } from "./StoneAbilitySyncer";
import { StoneBehaviourSyncer } from "./StoneBehaviourSyncer";

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
        cloudDataForLocal['localLocationId']  = this._getLocalLocationId(locationLinkId);
        transferStones.createLocal(this.actions, {
          localSphereId: this.localSphereId,
          localId: localId,
          cloudId: stone_from_cloud.id,
          cloudData: cloudDataForLocal
        });
      }

      cloudIdMap[stone_from_cloud.id] = localId;

      return this.syncChildren(localId, stonesInState[localId], stone_from_cloud);
    })
      .then(() => {
        return Promise.all(this.transferPromises);
      })
      .then(() => {
        this.globalSphereMap.stones = {...this.globalSphereMap.stones, ...cloudIdMap};
        this.globalCloudIdMap.stones = {...this.globalCloudIdMap.stones, ...cloudIdMap};
        return localStoneIdsSynced;
      })
  }


  syncChildren(localId, localStone, stone_from_cloud) {
    let abilitySyncer   = new StoneAbilitySyncer(
      this.actions,
      [],
      localId,
      stone_from_cloud.id,
      this.localSphereId,
      this.cloudSphereId,
      this.globalCloudIdMap,
      this.globalSphereMap
    );
    let behaviourSyncer = new StoneBehaviourSyncer(
      this.actions,
      [],
      localId,
      stone_from_cloud.id,
      this.localSphereId,
      this.cloudSphereId,
      this.globalCloudIdMap,
      this.globalSphereMap
    );

    return abilitySyncer.sync(localStone && localStone.abilities || {}, stone_from_cloud.abilities)
      .then(() => {
        return behaviourSyncer.sync(localStone && localStone.rules || {}, stone_from_cloud.behaviours)
      })
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


  _getLocalLocationId(cloudId) {
    if (!cloudId) { return null; }
    return this.globalCloudIdMap.locations[cloudId] || null;
  }

  _getCloudLocationId(localId) {
    if (!localId) { return; }
    return this.globalLocalIdMap.locations[localId];
  }

  syncLocalStoneDown(localId, stoneInState, stone_from_cloud, locationLinkId) {
    // somehow sometimes ibeacon major and minor go missing. If this happens, redownload from cloud
    let corruptData = !stoneInState.config.iBeaconMajor || !stoneInState.config.iBeaconMinor || !stoneInState.config.macAddress;

    let localLocationId  = this._getLocalLocationId(locationLinkId);

    let syncLocal = () => {
      let cloudDataForLocal = {...stone_from_cloud};
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

}
