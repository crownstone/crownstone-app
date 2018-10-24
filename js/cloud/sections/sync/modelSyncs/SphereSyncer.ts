/**
 *
 * Sync the spheres from the cloud to the database.
 *
 */

import { shouldUpdateInCloud, shouldUpdateLocally} from "../shared/syncUtil";

import { CLOUD}               from "../../../cloudAPI";
import { Util}                from "../../../../util/Util";
import {getGlobalIdMap, SyncingBase} from "./SyncingBase";
import { transferSpheres }    from "../../../transferData/transferSpheres";
import { SphereUserSyncer }   from "./SphereUserSyncer";
import { LocationSyncer }     from "./LocationSyncer";
import { ApplianceSyncer }    from "./ApplianceSyncer";
import { StoneSyncer }        from "./StoneSyncer";
import { MessageSyncer }      from "./MessageSyncer";
import {LOG} from "../../../../logging/Log";
import {Permissions} from "../../../../backgroundProcesses/PermissionManager";
import {ToonSyncer} from "./thirdParty/ToonSyncer";
import { PresenceSyncer } from "./PresenceSyncer";

export class SphereSyncer extends SyncingBase {
  globalSphereMap;

  constructor(actions : any[], transferPromises: any[], globalCloudIdMap: globalIdMap, globalSphereMap : globalSphereMap) {
    super(actions, transferPromises, globalCloudIdMap);
    this.globalSphereMap = globalSphereMap
  }

  download() {
    return CLOUD.getSpheres();
  }

  sync(store) {
    return this.download()
      .then((spheresInCloud) => {
        let state = store.getState();
        let spheresInState = state.spheres;

        let localSphereIdsSynced = this.syncDown(store, spheresInState, spheresInCloud);
        this.syncUp(spheresInState, localSphereIdsSynced);

        return Promise.all(this.transferPromises);
      })
      .then(() => { return this.actions });
  }

  syncDown(store, spheresInState, spheresInCloud) : object {
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
        transferSpheres.createLocal(this.actions, {
          localId: localId,
          cloudData: sphere_from_cloud
        })
      }

      this.syncChildren(store, localId, localId ? spheresInState[localId] : null, sphere_from_cloud);
    });

    this.globalCloudIdMap.spheres = cloudIdMap;
    return localSphereIdsSynced;
  }

  syncChildren(store, localId, localSphere, sphere_from_cloud) {
    this.globalSphereMap[localId] = getGlobalIdMap();

    this.syncFloatingLocationPosition(store, localId, localSphere, sphere_from_cloud);

    let sphereUserSyncer  = new SphereUserSyncer( this.actions, [], localId, sphere_from_cloud.id, this.globalCloudIdMap, this.globalSphereMap[localId]);
    let locationSyncer    = new LocationSyncer(   this.actions, [], localId, sphere_from_cloud.id, this.globalCloudIdMap, this.globalSphereMap[localId]);
    let applianceSyncer   = new ApplianceSyncer(  this.actions, [], localId, sphere_from_cloud.id, this.globalCloudIdMap, this.globalSphereMap[localId]);
    let stoneSyncer       = new StoneSyncer(      this.actions, [], localId, sphere_from_cloud.id, this.globalCloudIdMap, this.globalSphereMap[localId]);
    let messageSyncer     = new MessageSyncer(    this.actions, [], localId, sphere_from_cloud.id, this.globalCloudIdMap, this.globalSphereMap[localId]);
    let toonSyncer        = new ToonSyncer(       this.actions, [], localId, sphere_from_cloud.id, this.globalCloudIdMap, this.globalSphereMap[localId]);
    let presenceSyncer    = new PresenceSyncer(   this.actions, [], localId, sphere_from_cloud.id, this.globalCloudIdMap, this.globalSphereMap[localId]);

    // sync sphere users
    LOG.info("SphereSync ",localId,": START sphereUserSyncer sync.");
    this.transferPromises.push(
      sphereUserSyncer.sync(store)
      .then(() => {
        LOG.info("SphereSync ",localId,": DONE sphereUserSyncer sync.");
        LOG.info("SphereSync ",localId,": START locationSyncer sync.");
      // sync locations
        return locationSyncer.sync(store);
      })
      .then(() => {
        LOG.info("SphereSync ",localId,": DONE locationSyncer sync.");
        LOG.info("SphereSync ",localId,": START presenceSyncer sync.");
        // sync appliances
        return presenceSyncer.sync(store);
      })
      .then(() => {
        LOG.info("SphereSync ",localId,": DONE presenceSyncer sync.");
        LOG.info("SphereSync ",localId,": START applianceSyncer sync.");
        // sync appliances
        return applianceSyncer.sync(store);
      })
      .then(() => {
        LOG.info("SphereSync ",localId,": DONE applianceSyncer sync.");
        LOG.info("SphereSync ",localId,": START stoneSyncer sync.");
        // sync stones
        return stoneSyncer.sync(store);
      })
      .then(() => {
        LOG.info("SphereSync ",localId,": DONE stoneSyncer sync.");
        LOG.info("SphereSync ",localId,": START messageSyncer sync.");
        // sync messages
        return messageSyncer.sync(store);
      })
      .then(() => {
        LOG.info("SphereSync ",localId,": DONE messageSyncer sync.");
        LOG.info("SphereSync ",localId,": START ToonSyncer sync.");
        // sync messages
        return toonSyncer.sync(store);
      })
      .then(() => {
        LOG.info("SphereSync ",localId,": DONE ToonSyncer sync.");
      })
    );
  }

  syncFloatingLocationPosition(store, localId, localSphere, sphere_from_cloud) {
    let addPositionToFloatingLocation = () => {
      this.actions.push({
        type: "SET_FLOATING_LAYOUT_LOCATION",
        sphereId: localId,
        data: {
          x: sphere_from_cloud.floatingLocationPosition.x,
          y: sphere_from_cloud.floatingLocationPosition.y,
          setOnThisDevice: false,
          updatedAt: sphere_from_cloud.floatingLocationPosition.updatedAt,
        }
      })
    }
    if (localSphere) {
      if (localSphere.layout.floatingLocation.x === null || localSphere.layout.floatingLocation.y === null) {
        if (sphere_from_cloud.floatingLocationPosition) {
          addPositionToFloatingLocation();
        }
      }
      else if (localSphere.layout.floatingLocation.setOnThisDevice === false) {
        if (sphere_from_cloud.floatingLocationPosition && shouldUpdateLocally(localSphere.layout.floatingLocation, sphere_from_cloud.floatingLocationPosition)) {
          addPositionToFloatingLocation();
        }
      }
      else if (Permissions.inSphere(localId).canSetPositionInCloud) {
        if (!sphere_from_cloud.floatingLocationPosition) {
          this.transferPromises.push(
            CLOUD.forSphere(sphere_from_cloud.id).updateFloatingLocationPosition({x:localSphere.layout.floatingLocation.x, y: localSphere.layout.floatingLocation.y})
          )
        }
        else if (shouldUpdateInCloud(localSphere.layout.floatingLocation, sphere_from_cloud.floatingLocationPosition)) {
          this.transferPromises.push(
            CLOUD.forSphere(sphere_from_cloud.id).updateFloatingLocationPosition({x:localSphere.layout.floatingLocation.x, y: localSphere.layout.floatingLocation.y})
          )
        }
      }
    }
    else {
      // new location! store the positions
      if (sphere_from_cloud.floatingLocationPosition) {
        addPositionToFloatingLocation();
      }
    }
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
    // somehow sometimes all keys go missing or the ibeacon uuid goes missing. If this is the case, redownload from cloud.
    let corruptData = sphereInState.config.adminKey === null && sphereInState.config.memberKey === null &&sphereInState.config.guestKey === null;
    corruptData = sphereInState.config.iBeaconUUID === undefined || sphereInState.config.iBeaconUUID === null || corruptData;

    if (shouldUpdateInCloud(sphereInState.config, sphere_from_cloud) && !corruptData) {
      if (!Permissions.inSphere(localId).canUploadSpheres) { return }

      this.transferPromises.push(
        transferSpheres.updateOnCloud({
          localData: sphereInState,
          cloudId:   sphere_from_cloud.id,
        })
        .catch(() => {})
      );
    }
    else if (shouldUpdateLocally(sphereInState.config, sphere_from_cloud) || corruptData) {
      transferSpheres.updateLocal(this.actions, {
        localId:   localId,
        cloudData: sphere_from_cloud
      })
    }

    if (!sphereInState.config.cloudId) {
      this.actions.push({type:'UPDATE_SPHERE_CLOUD_ID', sphereId: localId, data:{cloudId: sphere_from_cloud.id}})
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
