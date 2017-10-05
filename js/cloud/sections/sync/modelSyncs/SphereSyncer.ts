/**
 *
 * Sync the spheres from the cloud to the database.
 *
 */

import { shouldUpdateInCloud, shouldUpdateLocally} from "../shared/syncUtil";

import { CLOUD}               from "../../../cloudAPI";
import { Util}                from "../../../../util/Util";
import { SyncingBase }        from "./SyncingBase";
import { transferSpheres }    from "../../../transferData/transferSpheres";
import { SphereUserSyncer }   from "./SphereUserSyncer";
import { LocationSyncer }     from "./LocationSyncer";
import { ApplianceSyncer }    from "./ApplianceSyncer";
import { StoneSyncer }        from "./StoneSyncer";
import { MessageSyncer }      from "./MessageSyncer";
import {LOG} from "../../../../logging/Log";

export class SphereSyncer extends SyncingBase {

  download() {
    return CLOUD.getSpheres();
  }

  sync(state) {
    let spheresInState = state.spheres;
    return this.download()
      .then((spheresInCloud) => {
        let localSphereIdsSynced = this.syncDown(state, spheresInState, spheresInCloud);
        this.syncUp(spheresInState, localSphereIdsSynced);

        return Promise.all(this.transferPromises)
      })
      .then(() => { return this.actions });
  }

  syncDown(state, spheresInState, spheresInCloud) : object {
    let localSphereIdsSynced = {};
    let cloudIdMap = this._getCloudIdMap(spheresInState);

    // go through all spheres in the cloud.
    spheresInCloud.forEach((sphere_from_cloud) => { // underscores so its visually different from sphereInState
      let localId = cloudIdMap[sphere_from_cloud.id];

      // if we do not have a sphere with exactly this cloudId, verify that we do not have the same sphere on our device already.
      if (localId === undefined) {
        localId = this._searchForLocalMatch(spheresInState, sphere_from_cloud);
      }

      if (localId) {
        localSphereIdsSynced[localId] = true;
        this.syncLocalSphereDown(localId, spheresInState[localId], sphere_from_cloud);
      }
      else {
        // the sphere does not exist locally but it does exist in the cloud.
        // we create it locally.
        localId = Util.getUUID();
        cloudIdMap[sphere_from_cloud.id] = localId;
        this.transferPromises.push(
          transferSpheres.createLocal(this.actions, {
            localId: localId,
            cloudData: sphere_from_cloud
          })
          .catch()
        );
      }

      this.syncChildren(state, localId, localId ? spheresInState[localId] : null, sphere_from_cloud);
    });

    this.globalCloudIdMap.spheres = cloudIdMap;
    return localSphereIdsSynced;
  }

  syncChildren(state, localId, localSphere, sphere_from_cloud) {
    let sphereUserSyncer  = new SphereUserSyncer( this.actions, [], localId, sphere_from_cloud.id, this.globalCloudIdMap);
    let locationSyncer    = new LocationSyncer(   this.actions, [], localId, sphere_from_cloud.id, this.globalCloudIdMap);
    let applianceSyncer   = new ApplianceSyncer(  this.actions, [], localId, sphere_from_cloud.id, this.globalCloudIdMap);
    let stoneSyncer       = new StoneSyncer(      this.actions, [], localId, sphere_from_cloud.id, this.globalCloudIdMap);
    let messageSyncer     = new MessageSyncer(    this.actions, [], localId, sphere_from_cloud.id, this.globalCloudIdMap);

    // sync sphere users
    LOG.info("SphereSync ",localId,": START sphereUserSyncer sync.");
    this.transferPromises.push(
      sphereUserSyncer.sync(state, localSphere && localSphere.users || {})
      .then(() => {
        LOG.info("SphereSync ",localId,": DONE sphereUserSyncer sync.");
        LOG.info("SphereSync ",localId,": START locationSyncer sync.");
      // sync locations
        return locationSyncer.sync(state, localSphere && localSphere.locations || {});
      })
      .then(() => {
        LOG.info("SphereSync ",localId,": DONE locationSyncer sync.");
        LOG.info("SphereSync ",localId,": START applianceSyncer sync.");
        // sync appliances
        return applianceSyncer.sync(state, localSphere && localSphere.appliances || {});
      })
      .then(() => {
        LOG.info("SphereSync ",localId,": DONE applianceSyncer sync.");
        LOG.info("SphereSync ",localId,": START stoneSyncer sync.");
        // sync stones
        return stoneSyncer.sync(state, localSphere && localSphere.stones || {});
      })
      .then(() => {
        LOG.info("SphereSync ",localId,": DONE stoneSyncer sync.");
        LOG.info("SphereSync ",localId,": START messageSyncer sync.");
        // sync messages
        return messageSyncer.sync(state, localSphere && localSphere.messages || {});
      })
      .then(() => {
        LOG.info("SphereSync ",localId,": DONE messageSyncer sync.");
      })
    );
  }

  syncUp(spheresInState, localSphereIdsSynced) {
    let localSphereIds = Object.keys(spheresInState);

    localSphereIds.forEach((sphereId) => {
      let sphere = spheresInState[sphereId];
      this.syncLocalSphereUp(
        sphere,
        sphereId,
        localSphereIdsSynced[sphereId] === true
      )
    });
  }


  syncLocalSphereUp(localSphere, localSphereId, hasSyncedDown = false) {
    // if the object does not have a cloudId, it does not exist in the cloud but we have it locally.
    if (!hasSyncedDown) {
      if (localSphere.config.cloudId) {
        this.actions.push({ type: 'REMOVE_SPHERE', sphereId: localSphereId });
      }
      else {
        this.transferPromises.push(
          transferSpheres.createOnCloud(this.actions, { localId: localSphereId, localData: localSphere })
        );
      }
    }
  }

  syncLocalSphereDown(localId, sphereInState, sphere_from_cloud) {
    if (shouldUpdateInCloud(sphereInState.config, sphere_from_cloud)) {
      this.transferPromises.push(
        transferSpheres.updateOnCloud({
          localData: sphereInState,
          cloudId:   sphere_from_cloud.id,
        })
        .catch()
      );
    }
    else if (shouldUpdateLocally(sphereInState.config, sphere_from_cloud) || !sphereInState.config.cloudId) {
      this.transferPromises.push(
        transferSpheres.updateLocal(this.actions, {
          localId:   localId,
          cloudData: sphere_from_cloud
        }).catch()
      );
    }
  };


  _getCloudIdMap(spheresInState) {
    let cloudIdMap = {};
    let sphereIds = Object.keys(spheresInState);
    sphereIds.forEach((sphereId) => {
      let sphere = spheresInState[sphereId];
      if (sphere.config.cloudId) {
        cloudIdMap[sphere.config.cloudId] = sphereId;
      }
    });

    return cloudIdMap;
  }

  _searchForLocalMatch(spheresInState, sphereInCloud) {
    let sphereIds = Object.keys(spheresInState);
    for (let i = 0; i < sphereIds.length; i++) {
      let sphere = spheresInState[sphereIds[i]];
      if (sphere.config.iBeaconUUID === sphereInCloud.uuid) {
        return sphereIds[i];
      }
    }

    return null;
  }

}
