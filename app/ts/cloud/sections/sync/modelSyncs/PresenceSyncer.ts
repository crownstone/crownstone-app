/**
 *
 * Sync the locations from the cloud to the database.
 *
 */

import {CLOUD} from "../../../cloudAPI";
import {Util} from "../../../../util/Util";
import {SyncingSphereItemBase} from "./SyncingBase";

export class PresenceSyncer extends SyncingSphereItemBase {
  userId: string;
  deviceId: string;

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
    this.deviceId = Util.data.getCurrentDeviceId(store.getState());
    return this.download(this.deviceId)
      .then((presentPeopleInCloud) => {
        let locationsInSphere = this._getLocalData(store);
        this.syncDown(locationsInSphere, presentPeopleInCloud);
        return Promise.all(this.transferPromises);
      })
      .then(() => { return this.actions });
  }

  syncDown(locationsInSphere, presentPeopleInCloud) {
    let cloudIdMap = this._getCloudIdMap(locationsInSphere);

    // go through all locations in the cloud.
    let usersByLocation = {};

    presentPeopleInCloud.forEach((user_in_cloud) => { // underscores so its visually different from locationInState
      let userId = user_in_cloud.userId;
      if (user_in_cloud.locations && user_in_cloud.locations.length > 0) {
        user_in_cloud.locations.forEach((locationCloudId) => {
          let localId = cloudIdMap[locationCloudId];
          if (localId) {
            if (usersByLocation[localId] === undefined) {
              usersByLocation[localId] = [];
            }
            usersByLocation[localId].push(userId);
          }
        });
      }
    });

    console.log("usersByLocation", usersByLocation)

    Object.keys(locationsInSphere).forEach((localLocationId) => {
      console.log("LocalLocationId", localLocationId, usersByLocation[localLocationId])

      // check if the data from the cloud is already in the location;
      if (usersByLocation[localLocationId] === undefined) {
        // nobody here! PURGE!'
        locationsInSphere[localLocationId].presentUsers.forEach((userId) => {
          if (userId === this.userId) { return; }

          this.actions.push({
            type:       'USER_EXIT_LOCATION',
            sphereId:   this.localSphereId,
            locationId: localLocationId,
            data:       { userId: userId }
          });
        })
      }
      else {
        // we ARE NOT in the location according to our DB, but are according to the CLOUD.
        usersByLocation[localLocationId].forEach((userId) => {
          console.log("Adding this user", localLocationId, userId);

          if (userId === this.userId) { return; }

          console.log("locationsInSphere[localLocationId].presentUsers",locationsInSphere[localLocationId].presentUsers);
          if (locationsInSphere[localLocationId].presentUsers.indexOf(userId) === -1) {
            // enter user into the location!
            console.log("UserEnter!")
            this.actions.push({
              type:       'USER_ENTER_LOCATION',
              sphereId:   this.localSphereId,
              locationId: localLocationId,
              data:       { userId: userId }
            });
          }
        });

        // we ARE in the location according to our DB, but are NOT according to the CLOUD.
        locationsInSphere[localLocationId].presentUsers.forEach((userId) => {
          if (userId === this.userId) { return; }

          if (usersByLocation[localLocationId].indexOf(userId) === -1) {
            // exit user from the location
            this.actions.push({
              type:       'USER_EXIT_LOCATION',
              sphereId:   this.localSphereId,
              locationId: localLocationId,
              data:       { userId: userId }
            });
          }
        })
      }
    })
  }


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


}
