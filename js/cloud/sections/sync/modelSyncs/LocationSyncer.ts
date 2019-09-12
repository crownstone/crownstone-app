/**
 *
 * Sync the locations from the cloud to the database.
 *
 */

import {shouldUpdateInCloud, shouldUpdateLocally} from "../shared/syncUtil";
import {CLOUD} from "../../../cloudAPI";
import {SyncingSphereItemBase} from "./SyncingBase";
import {transferLocations} from "../../../transferData/transferLocations";
import {Permissions} from "../../../../backgroundProcesses/PermissionManager";
import {LOGe} from "../../../../logging/Log";
import { xUtil } from "../../../../util/StandAloneUtil";
import { FileUtil } from "../../../../util/FileUtil";

export class LocationSyncer extends SyncingSphereItemBase {
  userId: string;

  download() {
    return CLOUD.forSphere(this.cloudSphereId).getLocations();
  }

  _getLocalData(store) {
    let state = store.getState();
    if (state && state.spheres[this.localSphereId]) {
      return state.spheres[this.localSphereId].locations;
    }
    return {};
  }

  sync(store) {
    let userInState = store.getState().user;
    this.userId = userInState.userId;

    return this.download()
      .then((locationsInCloud) => {
        let locationsInState = this._getLocalData(store);
        let localLocationIdsSynced = this.syncDown(locationsInState, locationsInCloud);
        this.syncUp(store, locationsInState, localLocationIdsSynced);

        return Promise.all(this.transferPromises);
      })
      .then(() => { return this.actions });
  }

  syncDown(locationsInState, locationsInCloud) : object {
    let localLocationIdsSynced = {};
    let cloudIdMap = this._getCloudIdMap(locationsInState);

    // go through all locations in the cloud.
    locationsInCloud.forEach((location_from_cloud) => { // underscores so its visually different from locationInState
      let localId = cloudIdMap[location_from_cloud.id];

      // if we do not have a location with exactly this cloudId, verify that we do not have the same location on our device already.
      if (localId === undefined) {
        localId = this._searchForLocalMatch(locationsInState, location_from_cloud);
      }

      // item exists locally.
      if (localId) {
        localLocationIdsSynced[localId] = true;
        this.syncLocalLocationDown(localId, locationsInState[localId], location_from_cloud);
      }
      else {
        // the location does not exist locally but it does exist in the cloud.
        // we create it locally.

        localId = xUtil.getUUID();
        transferLocations.createLocal(this.actions, {
          localId: localId,
          localSphereId: this.localSphereId,
          cloudData: location_from_cloud
        });

        // download image
        this._downloadLocationImage(localId, location_from_cloud.id, location_from_cloud.imageId);
      }

      cloudIdMap[location_from_cloud.id] = localId;
      this.syncChildren(localId, localId ? locationsInState[localId] : null, location_from_cloud);
    });

    this.globalSphereMap.locations = {...this.globalSphereMap.locations, ...cloudIdMap};
    this.globalCloudIdMap.locations = {...this.globalCloudIdMap.locations, ...cloudIdMap};
    return localLocationIdsSynced;
  }

  syncChildren(localId, localLocation, location_from_cloud) {
    this.syncLayoutPosition(localId, localLocation, location_from_cloud);
  }

  syncLayoutPosition(localLocationId, localLocation, location_from_cloud) {
    let addPositionToLocation = () => {
      this.actions.push({
        type: "SET_LOCATION_POSITIONS",
        sphereId:   this.localSphereId,
        locationId: localLocationId,
        data:       {
          x: location_from_cloud.sphereOverviewPosition.x,
          y: location_from_cloud.sphereOverviewPosition.y,
          setOnThisDevice: false,
          updatedAt: location_from_cloud.sphereOverviewPosition.updatedAt,
        }
      })
    };
    if (localLocation) {
      if (localLocation.layout.x === null || localLocation.layout.y === null) {
        if (location_from_cloud.sphereOverviewPosition) {
          addPositionToLocation();
        }
      }
      else if (localLocation.layout.setOnThisDevice === false) {
        if (location_from_cloud.sphereOverviewPosition && shouldUpdateLocally(localLocation.layout, location_from_cloud.sphereOverviewPosition)) {
          addPositionToLocation();
        }
      }
      else if (Permissions.inSphere(this.localSphereId).canSetPositionInCloud) {
        if (!location_from_cloud.sphereOverviewPosition) {
          this.transferPromises.push(
            CLOUD.forLocation(location_from_cloud.id).updateLocationPosition({x: localLocation.layout.x, y: localLocation.layout.y})
          );
        }
        else if (shouldUpdateInCloud(localLocation.layout, location_from_cloud.sphereOverviewPosition)) {
          this.transferPromises.push(
            CLOUD.forLocation(location_from_cloud.id).updateLocationPosition({x: localLocation.layout.x, y: localLocation.layout.y})
          );
        }
      }
    }
    else {
      // new location! store the positions
      if (location_from_cloud.sphereOverviewPosition) {
        addPositionToLocation();
      }
    }
  }



  syncUp(store, locationsInState, localLocationIdsSynced) {
    let localLocationIds = Object.keys(locationsInState);

    localLocationIds.forEach((locationId) => {
      let location = locationsInState[locationId];
      this.syncLocalLocationUp(
        store,
        location,
        locationId,
        localLocationIdsSynced[locationId] === true
      )
    });
  }


  syncLocalLocationUp(store, localLocation, localLocationId, hasSyncedDown = false) {
    // if the object does not have a cloudId, it does not exist in the cloud but we have it locally.
    if (!hasSyncedDown) {
      if (localLocation.config.cloudId) {
        this.actions.push({ type: 'REMOVE_LOCATION', sphereId: this.localSphereId, locationId: localLocationId });
        this.propagateRemoval(store, localLocationId);
      }
      else {
        if (!Permissions.inSphere(this.localSphereId).canCreateLocations) { return }

        this.transferPromises.push(
          transferLocations.createOnCloud(this.actions, { localId: localLocationId, localSphereId: this.localSphereId, cloudSphereId: this.cloudSphereId, localData: localLocation })
            .then((cloudId) => {
              this.globalCloudIdMap.locations[cloudId] = localLocationId;
            })
        );
      }
    }
  }

  propagateRemoval(store, locationId) {
    let state = store.getState();
    let sphere = state.spheres[this.localSphereId];
    if (!sphere) { return } // the sphere does not exist yet. In that case we do not need to propagate.

    let stones = sphere.stones;
    let stoneIds = Object.keys(stones);

    let actions = [];
    stoneIds.forEach((stoneId) => {
      if (stones[stoneId].config.locationId === locationId) {
        actions.push({type:'UPDATE_STONE_CONFIG', sphereId: this.localSphereId, stoneId: stoneId, data: {locationId: null}});
      }
    });

    if (actions.length > 0) {
      store.batchDispatch(actions);
    }
  }

  _downloadLocationImage(localId, cloudId, imageId) {
    if (!imageId) { return; }

    let toPath = FileUtil.getPath(localId + '.jpg');
    this.transferPromises.push(
      CLOUD.forLocation(cloudId).downloadLocationPicture(toPath)
        .then((picturePath) => {
          this.actions.push({type:'LOCATION_UPDATE_PICTURE', sphereId: this.localSphereId, locationId: localId, data:{ picture: picturePath, pictureId: imageId, pictureTaken: new Date().valueOf() }});
        }).catch((err) => { LOGe.cloud("LocationSyncer: Could not download location picture to ", toPath, ' err:', err); })
    );
  }

  syncLocalLocationDown(localId, locationInState, location_from_cloud) {
    if (location_from_cloud.imageId && locationInState.config.pictureId === null || (location_from_cloud.imageId && (location_from_cloud.imageId !== locationInState.config.pictureId))) {
      // user should have A or A DIFFERENT profile picture according to the cloud
      this._downloadLocationImage(localId, location_from_cloud.id,  location_from_cloud.imageId);
    }


    if (shouldUpdateInCloud(locationInState.config, location_from_cloud)) {
      if (!Permissions.inSphere(this.localSphereId).canUploadLocations) { return }

      this.transferPromises.push(
        transferLocations.updateOnCloud({
          localId:   localId,
          localData: locationInState,
          localSphereId: this.localSphereId,
          cloudSphereId: this.cloudSphereId,
          cloudId:   location_from_cloud.id,
        })
        .catch(() => {})
      );
    }
    else if (shouldUpdateLocally(locationInState.config, location_from_cloud) || !locationInState.config.uid) {
      transferLocations.updateLocal(this.actions, {
        localId:   localId,
        localSphereId: this.localSphereId,
        cloudData: location_from_cloud
      })
    }

    if (!locationInState.config.cloudId) {
      this.actions.push({type:'UPDATE_LOCATION_CLOUD_ID', sphereId: this.localSphereId, locationId: localId, data:{cloudId: location_from_cloud.id}})
    }
  };


  _getCloudIdMap(locationsInState) {
    let cloudIdMap = {};
    let locationIds = Object.keys(locationsInState);
    locationIds.forEach((locationId) => {
      let location = locationsInState[locationId];
      if (location.config.cloudId) {
        cloudIdMap[location.config.cloudId] = locationId;
      }
    });

    return cloudIdMap;
  }

  _searchForLocalMatch(locationsInState, locationInCloud) {
    let locationIds = Object.keys(locationsInState);
    for (let i = 0; i < locationIds.length; i++) {
      if (locationIds[i] === locationInCloud.id) {
        return locationIds[i];
      }
    }

    return null;
  }

}
