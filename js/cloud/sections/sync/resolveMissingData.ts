
export const resolveMissingData = function(store, actions, cloudData) {
  const state = store.getState();
  let sphereIds = Object.keys(state.spheres);
  let changedLocations = false;

  let promises = [];

  sphereIds.forEach((sphereId) => {
    if (cloudData.cloudSphereIds[sphereId] === undefined) {
      // we are going to remove this sphere, if it is active we first deactivate it.
      if (state.app.activeSphere == sphereId) {
        store.dispatch({type: 'CLEAR_ACTIVE_SPHERE'});
      }
      actions.push({type: 'REMOVE_SPHERE', sphereId: sphereId});
      changedLocations = true;
    }
    else {
      // if the sphere also exists in the cloud, check if its member need deletion
      let sphere = state.spheres[sphereId];
      let locationIds = Object.keys(sphere.locations);
      let messageIds = Object.keys(sphere.messages);
      let stoneIds = Object.keys(sphere.stones);
      let applianceIds = Object.keys(sphere.appliances);
      let sphereUserIds = Object.keys(sphere.users);

      // cleanup locations
      locationIds.forEach((locationId) => {
        if (cloudData.cloudLocationIds[locationId] === undefined) {
          // CLOUD.getLocationDeleteEvent(sphereId, locationId)
          //   .then((result) => {
          //     if (result.length === 0) {
          //        // TODO: upload to cloud!
          //     }
          //     else {
          //          TODO: remove locally.
          actions.push({type: 'REMOVE_LOCATION', sphereId: sphereId, locationId: locationId});
          changedLocations = true;
          // }
          // })
          // .catch((err) => {})
        }
      });

      // cleanup stones
      stoneIds.forEach((stoneId) => {
        // TODO: check schedules


        if (cloudData.cloudStoneIds[stoneId] === undefined) {
          actions.push({type: 'REMOVE_STONE', sphereId: sphereId, stoneId: stoneId});
        }
      });

      // cleanup appliances
      applianceIds.forEach((applianceId) => {
        if (cloudData.cloudApplianceIds[applianceId] === undefined) {
          actions.push({type: 'REMOVE_APPLIANCE', sphereId: sphereId, applianceId: applianceId});
        }
      });

      // cleanup sphere users
      sphereUserIds.forEach((userId) => {
        if (cloudData.cloudSphereUserIds[sphereId][userId] === undefined) {
          actions.push({type: 'REMOVE_SPHERE_USER', sphereId: sphereId, userId: userId});
        }
      });

    }
  });

  return changedLocations;
};
