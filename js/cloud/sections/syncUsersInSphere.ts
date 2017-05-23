export const syncUsersInSphere = {

  /**
   * This method will check if there are any users in rooms in the active sphere. If so, actions will be dispatched to the store.
   * @param store
   * @returns {Promise<TResult2|TResult1>}
   */
  syncUsers: function(store) {
      let state = store.getState();
      let activeSphereId = state.app.activeSphere;

      if (!activeSphereId) {
        return;
      }

      let actions = [];
      let sphereUsers = state.spheres[activeSphereId].users;

      // there's only you in the sphere, no need to check
      if (Object.keys(sphereUsers).length <= 1) {
        return;
      }
      let stateLocations = state.spheres[activeSphereId].locations;
      return this.forSphere(activeSphereId).getLocations({background: true})
        .then((locations) => {
          locations.forEach((location) => {
            if (stateLocations[location.id]) {
              let userActions = syncUsersInLocation(state, location, stateLocations[location.id], sphereUsers, activeSphereId);
              for (let i = 0; i < userActions.length; i++) {
                actions.push(userActions[i]);
              }
            }
          });

          if (actions.length > 0) {
            store.batchDispatch(actions);
          }
        })
    }

};

export const syncUsersInLocation = function(state, location_from_cloud, locationInState, sphereUsers, sphereId) {
  let actions = [];

  // put the present users from the cloud into the location.
  let peopleInCloudLocations = {};
  if (Array.isArray(location_from_cloud.presentPeople) && location_from_cloud.presentPeople.length > 0) {
    location_from_cloud.presentPeople.forEach((person) => {
      peopleInCloudLocations[person.id] = true;
      // check if the person exists in our sphere and if we are not that person.
      if (person.id !== state.user.userId && sphereUsers[person.id] === true) {
        actions.push({type: 'USER_ENTER_LOCATION', sphereId: sphereId, locationId: location_from_cloud.id, data: {userId: person.id}});
      }
    });
  }

  // remove the users from this location that are not in the cloud and that are not the current user
  if (locationInState) {
    locationInState.presentUsers.forEach((userId) => {
      if (peopleInCloudLocations[userId] === undefined && userId !== state.user.userId) {
        actions.push({type: 'USER_EXIT_LOCATION', sphereId: sphereId, locationId: location_from_cloud.id, data: {userId: userId}});
      }
    })
  }

  return actions;
};