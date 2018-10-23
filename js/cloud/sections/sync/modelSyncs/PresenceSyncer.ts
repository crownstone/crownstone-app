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

export class PresenceSyncer extends SyncingSphereItemBase {
  userId: string;

  download(deviceId) {
    return CLOUD.forSphere(this.cloudSphereId).getPresentPeople(deviceId);
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

    return this.download(deviceId)
      .then((presentPeopleInCloud) => {
        let locationsInSphere = this._getLocalData(store);
        this.syncDown(locationsInSphere, presentPeopleInCloud);
        return Promise.all(this.transferPromises);
      })
      .then(() => { return this.actions });
  }

  syncDown(locationsInSphere, presentPeopleInCloud) : object {
    let localLocationIdsSynced = {};
    let cloudIdMap = this._getCloudIdMap(locationsInSphere);

    // go through all locations in the cloud.
    presentPeopleInCloud.forEach((user_in_cloud) => { // underscores so its visually different from locationInState
      if (user_in_cloud.locations && user_in_cloud.locations.length > 0) {

      }
    });

    this.globalSphereMap.locations = {...this.globalSphereMap.locations, ...cloudIdMap}
    this.globalCloudIdMap.locations = {...this.globalCloudIdMap.locations, ...cloudIdMap};
    return localLocationIdsSynced;
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


  syncLocalLocationDown(localId, locationInState, location_from_cloud) {

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
