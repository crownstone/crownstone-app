/**
 *
 * Sync the locations from the cloud to the database.
 *
 */

import {CLOUD} from "../../../cloudAPI";
import {SyncingSphereItemBase} from "./SyncingBase";
import {LOG} from "../../../../logging/Log";

export class SphereUserSyncer extends SyncingSphereItemBase {
  userId: string;
  userPicture: string;

  downloadPendingInvites() {
    return CLOUD.forSphere(this.cloudSphereId).getPendingInvites();
  }

  download() {
    return CLOUD.forSphere(this.cloudSphereId).getUsers();
  }

  _getLocalData(store) {
    let state = store.getState();
    if (state.spheres[this.localSphereId]) {
      return state.spheres[this.localSphereId].users;
    }
    return {};
  }

  sync(store) {
    let userInState = store.getState().user;
    this.userId = userInState.userId;
    this.userPicture = userInState.picture;
    let localSphereUserIdsSynced = {};
    return this.download()
      .then((sphereUsersInCloud) => {
        let sphereUsersInState = this._getLocalData(store);
        localSphereUserIdsSynced = this.syncDown(sphereUsersInState, sphereUsersInCloud);
        return this.downloadPendingInvites();
      })
      .then((pendingInvites) => {
        let sphereUsersInState = this._getLocalData(store);
        this.syncPendingInvites(localSphereUserIdsSynced, pendingInvites, sphereUsersInState);
        this.syncUp(localSphereUserIdsSynced, sphereUsersInState);
        return Promise.all(this.transferPromises);
      })
      .then(() => { return this.actions });
  }

  syncUp(localSphereUserIdsSynced, sphereUsersInState) {
    // cleanup sphere users
    let userIds = Object.keys(sphereUsersInState);
    userIds.forEach((userId) => {
      if (localSphereUserIdsSynced[userId] === undefined) {
        this.actions.push({type: 'REMOVE_SPHERE_USER', sphereId: this.localSphereId, userId: userId});
      }
    });
  }

  syncPendingInvites(localSphereUserIdsSynced, pendingInvites, sphereUsersInState) {
    // sync pending invites
    pendingInvites.forEach((invite) => {
      localSphereUserIdsSynced[invite.email] = true;
      if (sphereUsersInState[invite.email] === undefined) {
        this.actions.push({
          type: 'ADD_SPHERE_USER',
          sphereId: this.localSphereId,
          userId: invite.email,
          data: {
            email: invite.email,
            invitationPending: true,
            accessLevel: invite.role
          }
        });
      }
    });
  }

  syncUserTypeDown(localSphereUserIdsSynced, sphereUsersInState, sphereUsersInCloud, type) {
    sphereUsersInCloud.forEach((sphere_user_in_cloud) => {
      let sphereUserId = sphere_user_in_cloud.id;

      this.globalCloudIdMap.users[sphereUserId] = sphereUserId;

      localSphereUserIdsSynced[sphereUserId] = true;

      let actionBase = {
        type: 'MUST_BE_CHANGED',
        sphereId: this.localSphereId,
        userId: sphereUserId,
        data: {
          firstName: sphere_user_in_cloud.firstName,
          lastName: sphere_user_in_cloud.lastName,
          email: sphere_user_in_cloud.email,
          accessLevel: type,
          picture: null,
          pictureId: null,
        }
      };

      let handleProfilePictureAndStore = (action) => {
        if (sphere_user_in_cloud.profilePicId) {
          if (this.userId === sphereUserId) {
            action.data.picture = this.userPicture;
            action.data.pictureId = sphere_user_in_cloud.profilePicId;
            this.actions.push(action);
            return;
          }
          // download new profile picture.
          this.transferPromises.push(
            CLOUD.getUserPicture(this.cloudSphereId, sphere_user_in_cloud.email, sphere_user_in_cloud.id)
              .then((filename) => {
                action.data.picture = filename;
                action.data.pictureId = sphere_user_in_cloud.profilePicId;
                this.actions.push(action);
              })
              .catch((err) => {
                LOG.error("SphereUserSyncer: Failed getting user picture", err);
                // still add data to ensure we never miss out on a user because of a bad profile picture.
                this.actions.push(action);
              })
          );
        }
        else {
          this.actions.push(action);
        }
      };

      if (sphereUsersInState[sphereUserId]) {
        let sphereUserInState = sphereUsersInState[sphereUserId];
        if (
          sphereUserInState.firstName   !== sphere_user_in_cloud.firstName    ||
          sphereUserInState.lastName    !== sphere_user_in_cloud.lastName     ||
          sphereUserInState.email       !== sphere_user_in_cloud.email        ||
          sphereUserInState.accessLevel !== type                              ||
          (sphereUserInState.pictureId  !== sphere_user_in_cloud.profilePicId && !(sphereUserInState.pictureId === null && sphere_user_in_cloud.profilePicId === undefined)) // it can happen that null and undefined are compared if there is no picture.
        ) {
          actionBase.type = 'UPDATE_SPHERE_USER';
          if (sphereUserInState.pictureId !== sphere_user_in_cloud.profilePicId) {
            handleProfilePictureAndStore(actionBase);
          }
          else {
            this.actions.push(actionBase);
          }
        }
      }
      else {
        actionBase.type = 'ADD_SPHERE_USER';
        handleProfilePictureAndStore(actionBase);
      }
    });
  }

  syncDown(sphereUsersInState, sphereUsersInCloud) : object {
    let localSphereUserIdsSynced = {};

    this.syncUserTypeDown(localSphereUserIdsSynced, sphereUsersInState, sphereUsersInCloud.admins,  'admin');
    this.syncUserTypeDown(localSphereUserIdsSynced, sphereUsersInState, sphereUsersInCloud.members, 'member');
    this.syncUserTypeDown(localSphereUserIdsSynced, sphereUsersInState, sphereUsersInCloud.guests,  'guest');

    return localSphereUserIdsSynced;
  }

}
