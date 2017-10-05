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

export class LocationSyncer extends SyncingSphereItemBase {
  userId: string;

  download() {
    return CLOUD.forSphere(this.cloudSphereId).getLocations();
  }

  sync(state, locationsInState) {
    this.userId = state.user.userId;

    return this.download()
      .then((locationsInCloud) => {
        let localLocationIdsSynced = this.syncDown(locationsInState, locationsInCloud);
        this.syncUp(locationsInState, localLocationIdsSynced);

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
          .catch()
        );
      }

      cloudIdMap[location_from_cloud.id] = localId;
      this.syncChildren(localId, localId ? locationsInState[localId] : null, location_from_cloud);
    });

    this.globalCloudIdMap.locations = cloudIdMap;
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
          if (person.id !== this.userId && this.globalCloudIdMap.users[person.id] === true) {
            // if no local location exists, or if it does and it has a present user.
            if  (!localLocation || localLocation && localLocation.presentUsers && localLocation.presentUsers.indexOf(person.id) === -1) {
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

  syncUp(locationsInState, localLocationIdsSynced) {
    let localLocationIds = Object.keys(locationsInState);

    localLocationIds.forEach((locationId) => {
      let location = locationsInState[locationId];
      this.syncLocalLocationUp(
        location,
        locationId,
        localLocationIdsSynced[locationId] === true
      )
    });
  }


  syncLocalLocationUp(localLocation, localLocationId, hasSyncedDown = false) {
    // if the object does not have a cloudId, it does not exist in the cloud but we have it locally.
    if (!hasSyncedDown) {
      if (localLocation.config.cloudId) {
        this.actions.push({ type: 'REMOVE_LOCATION', sphereId: this.localSphereId, locationId: localLocationId });
      }
      else {
        if (!Permissions.inSphere(this.localSphereId).canCreateLocations) { return }

        this.transferPromises.push(
          transferLocations.createOnCloud(this.actions, { localId: localLocationId, localSphereId: this.localSphereId, cloudSphereId: this.cloudSphereId, localData: localLocation })
            .then((cloudId) => {
              this.globalCloudIdMap.appliances[cloudId] = localLocationId;
            })
        );
      }
    }
  }

  syncLocalLocationDown(localId, locationInState, location_from_cloud) {
    if (shouldUpdateInCloud(locationInState.config, location_from_cloud)) {

      if (!Permissions.inSphere(this.localSphereId).canUploadLocations) { return }

      this.transferPromises.push(
        transferLocations.updateOnCloud({
          localId:   localId,
          localData: locationInState,
          cloudSphereId: this.cloudSphereId,
          cloudId:   location_from_cloud.id,
        })
        .catch()
      );
    }
    else if (shouldUpdateLocally(locationInState.config, location_from_cloud) || !locationInState.config.cloudId) {
      this.transferPromises.push(
        transferLocations.updateLocal(this.actions, {
          localId:   localId,
          localSphereId: this.localSphereId,
          cloudData: location_from_cloud
        }).catch()
      );
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
