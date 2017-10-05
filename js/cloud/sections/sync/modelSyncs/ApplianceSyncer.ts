/**
 *
 * Sync the appliances from the cloud to the database.
 *
 */

import {shouldUpdateInCloud, shouldUpdateLocally} from "../shared/syncUtil";
import {CLOUD} from "../../../cloudAPI";
import {Util} from "../../../../util/Util";
import {SyncingSphereItemBase} from "./SyncingBase";
import {transferAppliances} from "../../../transferData/transferAppliances";
import {Permissions} from "../../../../backgroundProcesses/PermissionManager";

export class ApplianceSyncer extends SyncingSphereItemBase {
  userId: string;

  download() {
    return CLOUD.forSphere(this.cloudSphereId).getAppliancesInSphere();
  }

  sync(state, appliancesInState) {
    return this.download()
      .then((appliancesInCloud) => {
        let localApplianceIdsSynced = this.syncDown(appliancesInState, appliancesInCloud);
        this.syncUp(appliancesInState, localApplianceIdsSynced);

        return Promise.all(this.transferPromises);
      })
      .then(() => { return this.actions; });
  }

  syncDown(appliancesInState, appliancesInCloud) : object {
    let localApplianceIdsSynced = {};
    let cloudIdMap = this._getCloudIdMap(appliancesInState);

    // go through all appliances in the cloud.
    appliancesInCloud.forEach((appliance_from_cloud) => { // underscores so its visually different from applianceInState
      let localId = cloudIdMap[appliance_from_cloud.id];

      // if we do not have a appliance with exactly this cloudId, verify that we do not have the same appliance on our device already.
      if (localId === undefined) {
        localId = this._searchForLocalMatch(appliancesInState, appliance_from_cloud);
      }

      // item exists locally.
      if (localId) {
        localApplianceIdsSynced[localId] = true;
        this.syncLocalApplianceDown(localId, appliancesInState[localId], appliance_from_cloud);
      }
      else {
        // the appliance does not exist locally but it does exist in the cloud.
        // we create it locally.
        localId = Util.getUUID();
        this.transferPromises.push(
          transferAppliances.createLocal(this.actions, {
            localId: localId,
            localSphereId: this.localSphereId,
            cloudData: appliance_from_cloud
          })
          .then(() => {
            this._copyBehaviourFromCloud(localId, appliance_from_cloud);
          })
          .catch()
        );
      }

      cloudIdMap[appliance_from_cloud.id] = localId;
    });

    this.globalCloudIdMap.appliances = {...this.globalCloudIdMap.appliances, ...cloudIdMap};
    return localApplianceIdsSynced;
  }

  syncUp(appliancesInState, localApplianceIdsSynced) {
    let localApplianceIds = Object.keys(appliancesInState);

    localApplianceIds.forEach((applianceId) => {
      let appliance = appliancesInState[applianceId];
      this.syncLocalApplianceUp(
        appliance,
        applianceId,
        localApplianceIdsSynced[applianceId] === true
      )
    });
  }


  syncLocalApplianceUp(localAppliance, localApplianceId, hasSyncedDown = false) {
    // if the object does not have a cloudId, it does not exist in the cloud but we have it locally.
    if (!hasSyncedDown) {
      if (localAppliance.config.cloudId) {
        this.actions.push({ type: 'REMOVE_APPLIANCE', sphereId: this.localSphereId, applianceId: localApplianceId });
      }
      else {
        if (!Permissions.inSphere(this.localSphereId).canCreateAppliances) { return }

        this.transferPromises.push(
          transferAppliances.createOnCloud(this.actions, {
            localId: localApplianceId,
            localSphereId: this.localSphereId,
            cloudSphereId: this.cloudSphereId,
            localData: localAppliance
          })
          .then((cloudId) => {
            this.globalCloudIdMap.appliances[cloudId] = localApplianceId;
          })
        );
      }
    }
  }

  syncLocalApplianceDown(localId, applianceInState, appliance_from_cloud) {
    // determine the linked location id
    if (shouldUpdateInCloud(applianceInState.config, appliance_from_cloud)) {
      if (!Permissions.inSphere(this.localSphereId).canUploadAppliances) { return }

      this.transferPromises.push(
        transferAppliances.updateOnCloud({
          cloudSphereId:  this.cloudSphereId,
          localId:        localId,
          cloudId:        appliance_from_cloud.id,
          localData:      applianceInState,
        })
        .catch()
      );
    }
    else if (shouldUpdateLocally(applianceInState.config, appliance_from_cloud) || !applianceInState.config.cloudId) {
      this.transferPromises.push(
        transferAppliances.updateLocal(this.actions, {
          localSphereId:  this.localSphereId,
          localId:        localId,
          cloudId:        appliance_from_cloud.id,
          cloudData:      appliance_from_cloud
        }).catch()
      );
    }
  };


  _getCloudIdMap(appliancesInState) {
    let cloudIdMap = {};
    let applianceIds = Object.keys(appliancesInState);
    applianceIds.forEach((applianceId) => {
      let appliance = appliancesInState[applianceId];
      if (appliance.config.cloudId) {
        cloudIdMap[appliance.config.cloudId] = applianceId;
      }
    });

    return cloudIdMap;
  }

  _searchForLocalMatch(appliancesInState, applianceInCloud) {
    let applianceIds = Object.keys(appliancesInState);
    for (let i = 0; i < applianceIds.length; i++) {
      if (applianceIds[i] === applianceInCloud.id) {
        return applianceIds[i];
      }
    }

    return null;
  }

  _copyBehaviourFromCloud(localId, appliance_from_cloud) {
    // we only download the behaviour the first time we add the stone.
    if (appliance_from_cloud.json !== undefined) {
      let behaviour = JSON.parse(appliance_from_cloud.json);

      if (behaviour.onHomeEnter)
        this.actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeEnter', sphereId: this.localSphereId, applianceId: localId, data: behaviour.onHomeEnter });
      if (behaviour.onHomeExit)
        this.actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeExit',  sphereId: this.localSphereId, applianceId: localId, data: behaviour.onHomeExit });
      if (behaviour.onRoomEnter)
        this.actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomEnter', sphereId: this.localSphereId, applianceId: localId, data: behaviour.onRoomEnter });
      if (behaviour.onRoomExit)
        this.actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomExit',  sphereId: this.localSphereId, applianceId: localId, data: behaviour.onRoomExit });
      if (behaviour.onNear)
        this.actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onNear',      sphereId: this.localSphereId, applianceId: localId, data: behaviour.onNear });
      if (behaviour.onAway)
        this.actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onAway',      sphereId: this.localSphereId, applianceId: localId, data: behaviour.onAway });
    }
  };

}
