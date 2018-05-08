/**
 *
 * Sync the locations from the cloud to the database.
 *
 */

import {shouldUpdateInCloud, shouldUpdateLocally} from "../shared/syncUtil";
import {CLOUD} from "../../../cloudAPI";
import {Util} from "../../../../util/Util";
import {SyncingSphereItemBase} from "./SyncingBase";
import {transferLocations} from "../../../transferData/transferLocations";
import {Permissions} from "../../../../backgroundProcesses/PermissionManager";
import {LOGe} from "../../../../logging/Log";

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

        localId = Util.getUUID();
        this.transferPromises.push(
          transferLocations.createLocal(this.actions, {
            localId: localId,
            localSphereId: this.localSphereId,
            cloudData: location_from_cloud
          })
          .catch(() => {})
        );

        // download image
        this._downloadLocationImage(localId, location_from_cloud.id, location_from_cloud.imageId);
      }

      cloudIdMap[location_from_cloud.id] = localId;
      this.syncChildren(localId, localId ? locationsInState[localId] : null, location_from_cloud);
    });

    this.globalSphereMap.locations = {...this.globalSphereMap.locations, ...cloudIdMap}
    this.globalCloudIdMap.locations = {...this.globalCloudIdMap.locations, ...cloudIdMap};
    return localLocationIdsSynced;
  }

  syncChildren(localId, localLocation, location_from_cloud) {
    this.syncUsersInLocation(localId, localLocation, location_from_cloud)
  }

  syncUsersInLocation(localLocationId, localLocation, location_from_cloud) {
    // put the present users from the cloud into the location.
    let peopleInCloudLocations = {};
    if (Array.isArray(location_from_cloud.presentPeople) && location_from_cloud.presentPeople.length > 0) {
      location_from_cloud.presentPeople.forEach((person) => {
        if (peopleInCloudLocations[person.id] === undefined) {
          peopleInCloudLocations[person.id] = true;
          // check if the person exists in our sphere and if we are not that person. Also check if this user is already in the room.

          if (person.id !== this.userId && this.globalCloudIdMap.users[person.id] !== undefined) {
            // if no local location exists, or if it does and it has a present user.
            if (!localLocation || localLocation && localLocation.presentUsers && localLocation.presentUsers.indexOf(person.id) === -1) {
              this.actions.push({
                type:       'USER_ENTER_LOCATION',
                sphereId:   this.localSphereId,
                locationId: localLocationId,
                data:       { userId: person.id }
              });
            }
          }
        }
      });
    }


    // remove the users from this location that are not in the cloud and that are not the current user
    let peopleInCurrentLocation = {};
    if (localLocation && localLocation.presentUsers) {
      localLocation.presentUsers.forEach((userId) => {
        // remove duplicates
        if (peopleInCurrentLocation[userId] === undefined) {
          // once is OK
          peopleInCurrentLocation[userId] = true;

          // if this person is not in the location anymore (according to the cloud) and is not the current user, we remove him from the room.
          if (peopleInCloudLocations[userId] === undefined && userId !== this.userId) {
            this.actions.push({
              type:       'USER_EXIT_LOCATION',
              sphereId:   this.localSphereId,
              locationId: localLocationId,
              data:       { userId: userId }
            });
          }
        }
        else {
          // if we're here, that means a userId is in this location more than once. We cannot have that.
          this.actions.push({
            type:       'USER_EXIT_LOCATION',
            sphereId:   this.localSphereId,
            locationId: localLocationId,
            data:       { userId: userId }
          });
        }
      })
    }
  };

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
        // We also need to make sure all items currently using this appliance will propagate the removal of this item.
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

    let toPath = Util.getPath(localId + '.jpg');
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
    else if (shouldUpdateLocally(locationInState.config, location_from_cloud)) {
      this.transferPromises.push(
        transferLocations.updateLocal(this.actions, {
          localId:   localId,
          localSphereId: this.localSphereId,
          cloudData: location_from_cloud
        }).catch(() => {})
      );
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
