


import {LOG} from "../../../logging/Log";
import {getTimeDifference} from "./shared/syncUtil";

export const syncSphereUser = function(actions, sphere, sphereInState, userId, user, state, accessLevel) {
  if (sphereInState !== undefined && sphereInState.users[userId] !== undefined) {
    // since we do not get a profile picture via the same way as the rest of the users, we alter the data to contain our own pic.
    let selfId = state.user.userId;
    let forceUpdate = false;

    // check if the content of the current sphere user in the state is different from that in the cloud.
    if (sphereInState.users[userId] !== undefined) {
      let sphereUserInState = sphereInState.users[userId];
      if (
        user.firstName !== sphereUserInState.firstName ||
        user.lastName !== sphereUserInState.lastName ||
        user.email !== sphereUserInState.email
      ) {
        forceUpdate = true;
        LOG.info("Sync: Force updating local sphere user data with remote sphere user.")
      }
    }

    // the local user has a different path to his/her local picture than the other sphere users.
    if (userId == selfId) {
      user.picture = state.user.picture;
    }

    if (getTimeDifference(sphereInState.users[userId], user) > 0 || forceUpdate) {
      actions.push({
        type: 'UPDATE_SPHERE_USER',
        sphereId: sphere.id,
        userId: user.id,
        data: {
          picture: user.picture,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          accessLevel: accessLevel
        }
      });
    }
  }
  else {
    actions.push({
      type: 'ADD_SPHERE_USER',
      sphereId: sphere.id,
      userId: user.id,
      data: {
        picture: user.picture,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accessLevel: accessLevel
      }
    });
  }
};