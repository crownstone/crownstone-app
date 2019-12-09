/**
 *
 * Sync the messages from the cloud to the database.
 *
 */

import { SyncingStoneItemBase } from "./SyncingBase";
import { xUtil } from "../../../../util/StandAloneUtil";
import { transferBehaviours } from "../../../transferData/transferBehaviours";
import { shouldUpdateInCloud, shouldUpdateLocally } from "../shared/syncUtil";

export class StoneBehaviourSyncer extends SyncingStoneItemBase {
  sync(behavioursInState, cloud_behaviours) {
    return this.syncDown(behavioursInState, cloud_behaviours)
      .then((localBehaviourIdsSynced) => {
        return this.syncUp(behavioursInState, localBehaviourIdsSynced);
      })
      .then(() => {
        return Promise.all(this.transferPromises);
      })
  }

  syncDown(behavioursInState, cloud_behaviours) {
    let localBehaviourIdsSynced = {};
    let cloudIdMap = this._getCloudIdMap(behavioursInState);

    // go through all stones in the cloud.
    return xUtil.promiseBatchPerformer(cloud_behaviours, (cloud_behaviour) => { // underscores so its visually different from behavioursInState
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


  syncUp(behavioursInState, localBehaviourIdsSynced) {
    let localBehaviourIds = Object.keys(behavioursInState);

    localBehaviourIds.forEach((behaviourId) => {
      let behaviour = behavioursInState[behaviourId];
      this.syncLocalBehaviourUp(
        behaviour,
        behaviourId,
        localBehaviourIdsSynced[behaviourId] === true
      )
    });
  }


  _getCloudIdMap(behavioursInState) {
    let cloudIdMap = {};
    let behaviourIds = Object.keys(behavioursInState);
    behaviourIds.forEach((behaviourId) => {
      let behaviour = behavioursInState[behaviourId];
      if (behaviour.cloudId) {
        cloudIdMap[behaviour.cloudId] = behaviourId;
      }
    });

    return cloudIdMap;
  }


  _searchForLocalMatch(behavioursInState, cloud_behaviour) {
    let behaviourIds = Object.keys(behavioursInState);
    let cloudBehaviourParsed = JSON.parse(cloud_behaviour.data);
    for (let i = 0; i < behaviourIds.length; i++) {
      let behaviour = behavioursInState[behaviourIds[i]];
      if (
        behaviour.profileIndex   === cloud_behaviour.profileIndex &&
        behaviour.type           === cloud_behaviour.type &&
        behaviour.activeDays.Mon === cloud_behaviour.activeDays.Mon &&
        behaviour.activeDays.Tue === cloud_behaviour.activeDays.Tue &&
        behaviour.activeDays.Wed === cloud_behaviour.activeDays.Wed &&
        behaviour.activeDays.Thu === cloud_behaviour.activeDays.Thu &&
        behaviour.activeDays.Fri === cloud_behaviour.activeDays.Fri &&
        behaviour.activeDays.Sat === cloud_behaviour.activeDays.Sat &&
        behaviour.activeDays.Sun === cloud_behaviour.activeDays.Sun
      ) {
        let parsedData = JSON.parse(behaviour.data);
        if (xUtil.deepCompare(cloudBehaviourParsed, parsedData)) {
          return behaviourIds[i];
        }
      }
      console.log("Matching cloud behaviour", cloud_behaviour, " with", behavioursInState)
    }

    return null;
  }

  syncLocalBehaviourUp(localBehaviour, localBehaviourId, hasSyncedDown = false) {
    // if the object does not have a cloudId, it does not exist in the cloud but we have it locally.
    if (!hasSyncedDown) {
      if (localBehaviour.cloudId) {
        this.actions.push({ type: 'REMOVE_STONE_RULE', sphereId: this.localSphereId, stoneId: this.localStoneId, ruleId: localBehaviourId });
      }
      else {
        let localDataForCloud = {...localBehaviour};
        this.transferPromises.push(
          transferBehaviours.createOnCloud(
            this.actions, {
              localId: localBehaviourId,
              localData: localDataForCloud,
              localSphereId: this.localSphereId,
              localStoneId: this.localStoneId,
              cloudStoneId: this.cloudStoneId,
              cloudSphereId: this.cloudSphereId,
            }));
      }
    }
  }


  syncLocalBehaviourDown(localId, behaviourInState, behaviour_in_cloud) {
    if (shouldUpdateInCloud(behaviourInState, behaviour_in_cloud)) {
      let localDataForCloud = {...behaviourInState};
      this.transferPromises.push(
        transferBehaviours.updateOnCloud({
          localId: localId,
          localData: localDataForCloud,
          cloudStoneId: this.cloudStoneId,
          cloudId: behaviour_in_cloud.id,
          cloudSphereId: this.cloudSphereId,
        })
          .catch(() => {})
      );
    }
    else if (shouldUpdateLocally(behaviourInState, behaviour_in_cloud)) {
      let cloudDataForLocal = {...behaviour_in_cloud};
      transferBehaviours.updateLocal(this.actions, {
        localId: localId,
        localSphereId: this.localSphereId,
        localStoneId: this.localStoneId,
        cloudData: cloudDataForLocal,
      })
    }

    if (!behaviourInState.cloudId) {
      this.actions.push({type:'UPDATE_RULE_CLOUD_ID', sphereId: this.localSphereId, stoneId: this.localStoneId, ruleId: localId, data:{cloudId: behaviour_in_cloud.id}})
    }
  };

}
