
import {CLOUD} from "../../cloudAPI";
import {transferSchedules} from "../../transferData/transferSchedules";
import {transferMessages} from "../../transferData/transferMessages";

export const resolveMissingData = function(store, actions, sphereSyncedIds, cloudData) {
  const state = store.getState();
  let sphereIds = Object.keys(state.spheres);
  let changedLocations = false;

  let transferPromises = [];

  sphereIds.forEach((sphereId) => {
    if (sphereSyncedIds.cloudSphereIds[sphereId] === undefined) {
      // we are going to remove this sphere, if it is active we first deactivate it.
      if (state.app.activeSphere == sphereId) {
        store.dispatch({type: 'CLEAR_ACTIVE_SPHERE'});
      }
      actions.push({type: 'REMOVE_SPHERE', sphereId: sphereId});
      changedLocations = true;
    }
    else {
      // if the sphere also exists in the cloud, check if its member need deletion
      let localSphere = state.spheres[sphereId];
      let localLocationIds = Object.keys(localSphere.locations);
      let localStoneIds = Object.keys(localSphere.stones);
      let localMessagesIds = Object.keys(localSphere.messages);
      let localApplianceIds = Object.keys(localSphere.appliances);
      let localSphereUserIds = Object.keys(localSphere.users);

      // cleanup locations
      localLocationIds.forEach((locationId) => {
        if (sphereSyncedIds.cloudLocationIds[locationId] === undefined) {
          actions.push({type: 'REMOVE_LOCATION', sphereId: sphereId, locationId: locationId});
          changedLocations = true;
        }
      });



      // cleanup stones
      localStoneIds.forEach((stoneId) => {
        let stone = localSphere.stones[stoneId];
        let scheduleIds = Object.keys(stone.schedules);
        scheduleIds.forEach((scheduleId) => {
          let schedule = stone.schedules[scheduleId];
          // if the scheduleId does not exist in the cloud but we have it locally.
          if (sphereSyncedIds.cloudScheduleIds[scheduleId] === undefined) {
            if (schedule.cloudId) {
              actions.push({ type: 'REMOVE_STONE_SCHEDULE', sphereId: sphereId, stoneId: stoneId, scheduleId: scheduleId });
            }
            else {
              transferPromises.push(transferSchedules.createOnCloud( actions, { localId: scheduleId, localData: schedule, sphereId: sphereId, stoneId: stoneId }));
            }
          }
        });

        if (sphereSyncedIds.cloudStoneIds[stoneId] === undefined) {
          actions.push({type: 'REMOVE_STONE', sphereId: sphereId, stoneId: stoneId});
        }
      });

      // cleanup appliances
      localApplianceIds.forEach((applianceId) => {
        if (sphereSyncedIds.cloudApplianceIds[applianceId] === undefined) {
          actions.push({type: 'REMOVE_APPLIANCE', sphereId: sphereId, applianceId: applianceId});
        }
      });

      // cleanup sphere users
      localSphereUserIds.forEach((userId) => {
        if (sphereSyncedIds.cloudSphereUserIds[sphereId][userId] === undefined) {
          actions.push({type: 'REMOVE_SPHERE_USER', sphereId: sphereId, userId: userId});
        }
      });

      // cleanup messages
      localMessagesIds.forEach((messageId) => {
        if (sphereSyncedIds.cloudMessageIds[messageId] === undefined) {
          actions.push({ type: 'REMOVE_MESSAGE', sphereId: sphereId, messageId: messageId });
        }
      })
    }
  });

  return Promise.all(transferPromises).then(() => { return changedLocations; });
};


/**
 *
 * @param actions         // array of store actions
 * @param item            // local data entry
 * @param itemId          // if of local entry
 * @param cloudId         // cloudId (can be localId in some cases)
 * @param sphereId        // id of sphere containing model
 * @param cloudMethod     // function that is invoked with a sphereId and a cloud ID that queries the CLOUD Change for deletion events.
 * @param createMethod    // createOnCloud function from the transferMethods for creating a data point on the cloud based on the local data.
 * @param removeAction    // redux action to remove local data point
 * @param extraIds        // optional object of extra ids that will be added to the create method (some cases require a stoneId for instance)
 * @returns {Promise<any>}
 */
function verifyDeletionEvent(actions : any[], item, itemId, cloudId, sphereId, cloudMethod, createMethod, removeAction, extraIds?) {
  return cloudMethod(sphereId, cloudId)
    .then((result) => {

      // if there is NO delete event in the cloud.
      if (result.length === 0) {
        return createMethod( actions, { localId: itemId, localData: item, sphereId: sphereId, ...extraIds })
      }
      else {
        actions.push(removeAction);
      }
    })
}