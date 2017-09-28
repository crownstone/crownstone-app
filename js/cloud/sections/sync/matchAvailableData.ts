
import {CLOUD} from "../../cloudAPI";
import {Util} from "../../../util/Util";
import {LOG} from "../../../logging/Log";
import {getTimeDifference} from "./shared/syncUtil";
import {syncSphereUser} from "./syncSphereUser";
import {syncUsersInLocation} from "./syncUsersInSphere";
import {transferSpheres} from "../../transferData/transferSpheres";
import {transferLocations} from "../../transferData/transferLocations";
import {transferStones} from "../../transferData/transferStones";
import {transferSchedules} from "../../transferData/transferSchedules";
import {transferAppliances} from "../../transferData/transferAppliances";
import {transferMessages} from "../../transferData/transferMessages";



export const matchAvailableData = function(store, actions, spheresInCloud, cloudSpheresData) {
  let cloudSphereUserIds = {};
  let cloudSphereIds = {};
  let cloudStoneIds = {};
  let cloudLocationIds = {};
  let cloudApplianceIds = {};
  let cloudMessageIds = {};
  let cloudScheduleIds = {};
  let addedSphere = false;

  // LOG.cloud("SyncSpheres", spheresData);

  let transferPromises = [];

  // get the state here so we did not have to wait with an old state on the down sync.
  const state = store.getState();
  spheresInCloud.forEach((sphere) => {
    // put id in map so we can easily find it again
    cloudSphereIds[sphere.id] = true;
    cloudSphereUserIds[sphere.id] = {};

    // local reference to this sphere in our redux database.
    let sphereInState = state.spheres[sphere.id];

    // check if we are an admin in this Sphere.
    let adminInThisSphere = false;

    /**
     * Sync the sphere from the cloud to the database
     */
    if (sphereInState === undefined) {
      addedSphere = true;
      transferPromises.push(transferSpheres.createLocal(actions, {sphereId: sphere.id, cloudId: sphere.id, cloudData: sphere}).catch());
    }
    else if (getTimeDifference(sphereInState.config, sphere) < 0 || !sphereInState.config.cloudId) {
      transferPromises.push(transferSpheres.updateLocal(actions, {sphereId: sphere.id, cloudId: sphere.id, cloudData: sphere}).catch());
      adminInThisSphere = sphereInState.users[state.user.userId] ? sphereInState.users[state.user.userId].accessLevel === 'admin' : false;
    }
    else {
      adminInThisSphere = sphereInState.users[state.user.userId] ? sphereInState.users[state.user.userId].accessLevel === 'admin' : false;
    }

    syncSphereUsers(actions, cloudSpheresData, sphere, cloudSphereUserIds, state, sphereInState);

    syncSphereLocations(actions, transferPromises, state, cloudSpheresData, sphere, cloudLocationIds, cloudSphereUserIds, sphereInState);

    syncSphereStones(actions, transferPromises, state, cloudSpheresData, sphere, cloudStoneIds, cloudScheduleIds, adminInThisSphere, sphereInState);

    syncSphereAppliances(actions, transferPromises, state, cloudSpheresData, sphere, cloudApplianceIds, adminInThisSphere, sphereInState);

    syncSphereMessages(actions, transferPromises, state, cloudSpheresData, sphere, cloudMessageIds, sphereInState);
  });

  return Promise.all(transferPromises)
    .then(() => {
      return {
        cloudSphereUserIds,  // these are lists of localIds that are present in the cloud.
        cloudSphereIds,      // these are lists of localIds that are present in the cloud.
        cloudStoneIds,       // these are lists of localIds that are present in the cloud.
        cloudMessageIds,     // these are lists of localIds that are present in the cloud.
        cloudScheduleIds,    // these are lists of localIds that are present in the cloud.
        cloudLocationIds,    // these are lists of localIds that are present in the cloud.
        cloudApplianceIds,   // these are lists of localIds that are present in the cloud.
        addedSphere,
      };
    })
};


const syncSphereMessages = function(actions, transferPromises, state, cloudSpheresData, sphere, cloudMessageIds, sphereInState) {
  let messageMap = {};

  if (sphereInState) {
    let messageIds = Object.keys(sphereInState.messages);
    messageIds.forEach((messageId) => {
      let message = sphereInState.messages[messageId];
      if (message.config.cloudId) {
        messageMap[message.config.cloudId] = messageId;
      }
    })
  }

  cloudSpheresData[sphere.id].messages.forEach((message_from_cloud) => {
    // check if there is an existing message
    let localId = messageMap[message_from_cloud.id];
    if (sphereInState !== undefined && localId !== undefined) {
      cloudMessageIds[localId] = true;
      if (getTimeDifference(sphereInState.messages[localId].config, message_from_cloud) < 0) {
        // update local
        transferPromises.push(
          transferMessages.updateLocal( actions, {
            sphereId: sphere.id,
            localId: localId,
            cloudId: message_from_cloud.id,
            cloudData: message_from_cloud
          }).catch()
        );
      }
      else if (getTimeDifference(sphereInState.messages[localId].config, message_from_cloud) > 0) {
        // update in cloud --> not possible for messages. Sent is sent.
      }
    }
    else {
      // if the user does not own this message, do not sync it into the local database, it will be handled by the MessageCenter
      if (message_from_cloud.ownerId === state.user.userId) {
        // do nothing.
      }
      else {
        transferPromises.push(
          transferMessages.createLocal( actions, {
            sphereId: sphere.id,
            localId: Util.getUUID(),
            cloudId: message_from_cloud.id,
            cloudData: message_from_cloud,
            extraFields: { sent: true, sentAt: message_from_cloud['createdAt']}
          }).catch()
        );
      }
    }
  });
};

/**
 * Sync the Admins, members and guests from the cloud to the database.
 */
const syncSphereUsers = function(actions, cloudSpheresData, sphere, cloudSphereUserIds, state, sphereInState) {
  // sync admins
  Object.keys(cloudSpheresData[sphere.id].admins).forEach((userId) => {
    cloudSphereUserIds[sphere.id][userId] = true;
    let user = cloudSpheresData[sphere.id].admins[userId];
    syncSphereUser(actions, sphere, sphereInState, userId, user, state, 'admin');
  });
  // sync members
  Object.keys(cloudSpheresData[sphere.id].members).forEach((userId) => {
    cloudSphereUserIds[sphere.id][userId] = true;
    let user = cloudSpheresData[sphere.id].members[userId];
    syncSphereUser(actions, sphere, sphereInState, userId, user, state, 'member');
  });
  // sync guests
  Object.keys(cloudSpheresData[sphere.id].guests).forEach((userId) => {
    cloudSphereUserIds[sphere.id][userId] = true;
    let user = cloudSpheresData[sphere.id].guests[userId];
    syncSphereUser(actions, sphere, sphereInState, userId, user, state, 'guest');
  });
  // sync pending invites
  cloudSpheresData[sphere.id].pendingInvites.forEach((invite) => {
    cloudSphereUserIds[sphere.id][invite.email] = true;
    if (sphereInState !== undefined && sphereInState.users[invite.email] === undefined) {
      actions.push({
        type: 'ADD_SPHERE_USER',
        sphereId: sphere.id,
        userId: invite.email,
        data: {
          email: invite.email,
          invitationPending: true,
          accessLevel: invite.role
        }
      });
    }
  });
};


/**
 * Sync the locations from the cloud to the database.
 */
const syncSphereLocations = function(actions, transferPromises, state, cloudSpheresData, sphere, cloudLocationIds, cloudSphereUserIds, sphereInState) {
  cloudSpheresData[sphere.id].locations.forEach((location_from_cloud) => {
    // TODO: move this over to localId.
    cloudLocationIds[location_from_cloud.id] = true;

    let locationInState = undefined;
    if (sphereInState !== undefined && sphereInState.locations[location_from_cloud.id] !== undefined) {
      locationInState = sphereInState.locations[location_from_cloud.id];
      // date in cloud is more recent than it is locally, update cloud
      if (getTimeDifference(sphereInState.locations[location_from_cloud.id].config, location_from_cloud) > 0) {
        transferPromises.push(
          transferLocations.updateOnCloud(actions,
            {sphereId: sphere.id, localId: location_from_cloud.id, cloudId: location_from_cloud.id, localData: locationInState.config}).catch()
        );
      }
      else if (getTimeDifference(sphereInState.locations[location_from_cloud.id].config, location_from_cloud) < 0 || !locationInState.config.cloudId) {
        transferPromises.push(
          transferLocations.updateLocal(actions,
            {sphereId: sphere.id, localId: location_from_cloud.id, cloudId: location_from_cloud.id, cloudData: location_from_cloud}).catch()
        );
      }
    }
    else {
      transferPromises.push(
        transferLocations.createLocal(actions,
          {sphereId: sphere.id, localId: location_from_cloud.id, cloudId: location_from_cloud.id, cloudData: location_from_cloud}).catch()
      );
    }

    // put the present users from the cloud into the location.
    let userActions = syncUsersInLocation(state, location_from_cloud, locationInState, cloudSphereUserIds[sphere.id], sphere.id);
    for (let i = 0; i < userActions.length; i++) {
      actions.push(userActions[i]);
    }
  });
};


/**
 * Sync the stones from the cloud to the database.
 */
const syncSphereStones = function(actions, transferPromises, state, cloudSpheresData, sphere, cloudStoneIds, cloudScheduleIds, adminInThisSphere, sphereInState) {
  cloudSpheresData[sphere.id].stones.forEach((stone_from_cloud) => { // underscores so its visually different from stoneInState

    // TODO: move this over to localId.
    cloudStoneIds[stone_from_cloud.id] = true; // mark this ID as "yes it is in the cloud"

    // determine the linked location id
    let locationLinkId = null;
    if (stone_from_cloud.locations.length > 0 && stone_from_cloud.locations[0]) {
      locationLinkId = stone_from_cloud.locations[0].id;
    }
    else {
      locationLinkId = null;
    }
    if (sphereInState !== undefined && sphereInState.stones[stone_from_cloud.id] !== undefined) {
      let stoneInState = sphereInState.stones[stone_from_cloud.id];
      // update cloud since our data is newer!
      if (getTimeDifference(sphereInState.stones[stone_from_cloud.id].config, stone_from_cloud) > 0) {

        let extraFields = {};
        // only admins get to update the behaviour
        if (adminInThisSphere === true) {
          extraFields["json"] = JSON.stringify(stoneInState.behaviour);
        }

        transferPromises.push(
          transferStones.updateOnCloud(actions,
            {sphereId: sphere.id, localId: stone_from_cloud.id, cloudId: stone_from_cloud.id, localData: stoneInState, extraFields: extraFields})
            .then(() => {
              // check if we have to sync the locations:
              if (stoneInState.config.locationId !== locationLinkId) {
                // if the one in the cloud is null, we only create a link
                if (locationLinkId === null && stoneInState.config.locationId !== null) {
                  CLOUD.forStone(stone_from_cloud.id).updateStoneLocationLink(stoneInState.config.locationId, sphere.id, stoneInState.config.updatedAt, true).catch(() => {});
                }
                else {
                  CLOUD.forStone(stone_from_cloud.id).deleteStoneLocationLink(locationLinkId,  sphere.id, stoneInState.config.updatedAt, true)
                    .then(() => {
                      if (stoneInState.config.locationId !== null) {
                        return CLOUD.forStone(stone_from_cloud.id).updateStoneLocationLink(stoneInState.config.locationId, sphere.id,  stoneInState.config.updatedAt, true);
                      }
                    }).catch(() => {})
                }
              }
            })
            .catch()
        );
      }
      else if (getTimeDifference(sphereInState.stones[stone_from_cloud.id].config, stone_from_cloud) < 0 || !stoneInState.config.cloudId) {
        transferPromises.push(
          transferStones.updateLocal(actions,
            {sphereId: sphere.id, localId: stone_from_cloud.id, cloudId: stone_from_cloud.id, cloudData: stone_from_cloud}).catch()
        );
      }
    }
    else {
      transferPromises.push(
        transferStones.createLocal(actions,
          {sphereId: sphere.id, localId: stone_from_cloud.id, cloudId: stone_from_cloud.id, cloudData: stone_from_cloud})
          .then(() => {
            // we only download the behaviour the first time we add the stone.
            if (stone_from_cloud.json !== undefined) {
              let behaviour = JSON.parse(stone_from_cloud.json);

              if (behaviour.onHomeEnter)
                actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeEnter', sphereId: sphere.id, stoneId: stone_from_cloud.id, data: behaviour.onHomeEnter });
              if (behaviour.onHomeExit)
                actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeExit',  sphereId: sphere.id, stoneId: stone_from_cloud.id, data: behaviour.onHomeExit });
              if (behaviour.onRoomEnter)
                actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomEnter', sphereId: sphere.id, stoneId: stone_from_cloud.id, data: behaviour.onRoomEnter });
              if (behaviour.onRoomExit)
                actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomExit',  sphereId: sphere.id, stoneId: stone_from_cloud.id, data: behaviour.onRoomExit });
              if (behaviour.onNear)
                actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onNear', sphereId: sphere.id, stoneId: stone_from_cloud.id, data: behaviour.onNear });
              if (behaviour.onAway)
                actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onAway', sphereId: sphere.id, stoneId: stone_from_cloud.id, data: behaviour.onAway });
            }
          })
          .catch()
      );
    }

    syncStoneSchedules(actions, transferPromises, state, cloudSpheresData, sphere, stone_from_cloud, cloudScheduleIds, sphereInState)
  });
};


/**
 * Sync schedules in this stone.
 * @param actions
 * @param transferPromises
 * @param state
 * @param cloudSpheresData
 * @param sphere
 * @param stone_from_cloud
 * @param cloudScheduleIds
 * @param sphereInState
 */
const syncStoneSchedules = function(actions, transferPromises, state, cloudSpheresData, sphere, stone_from_cloud, cloudScheduleIds, sphereInState) {
  let scheduleMap = {};
  let schedules = {};
  if (sphereInState) {
    schedules = sphereInState.stones[stone_from_cloud.id].schedules;
    let scheduleIds = Object.keys(schedules);
    scheduleIds.forEach((scheduleId) => {
      let schedule = schedules[scheduleId];
      if (schedule.cloudId) {
        scheduleMap[schedule.cloudId] = scheduleId;
      }
    })
  }

  // sync down schedules of this stone
  if (stone_from_cloud.schedules && stone_from_cloud.schedules.length > 0) {
    // find the schedule in our local database that matches the one in the cloud
    stone_from_cloud.schedules.forEach((schedule_in_cloud) => {
      let localId = scheduleMap[schedule_in_cloud.id];
      if (localId) {
        let scheduleInState = schedules[localId];
        cloudScheduleIds[localId] = true;
        if (getTimeDifference(scheduleInState, schedule_in_cloud) < 0) {
          // update local
          transferPromises.push(
            transferSchedules.updateLocal(actions, {
              sphereId: sphere.id,
              stoneId: stone_from_cloud.id,
              localId: localId,
              cloudId: schedule_in_cloud.id,
              cloudData: schedule_in_cloud
            }).catch()
          );
        }
        else if (getTimeDifference(scheduleInState, schedule_in_cloud) > 0) {
          // update cloud since local data is newer!
          transferPromises.push(
            transferSchedules.updateOnCloud(actions, {
              sphereId: sphere.id,
              stoneId: stone_from_cloud.id,
              localId: localId,
              cloudId: schedule_in_cloud.id,
              localData: scheduleInState,
              cloudData: schedule_in_cloud,
            }).catch()
          );
        }
      }
      else {
        let localId = Util.getUUID();
        cloudScheduleIds[localId] = true;
        // add schedule
        transferPromises.push(
          transferSchedules.createLocal(actions, {
            sphereId: sphere.id,
            stoneId: stone_from_cloud.id,
            cloudId: schedule_in_cloud.id,
            cloudData: schedule_in_cloud
          }).catch()
        );
      }
    });
  }
};


/**
 * Sync the appliances from the cloud to the database.
 */
const syncSphereAppliances = function(actions, transferPromises, state, cloudSpheresData, sphere, cloudApplianceIds, adminInThisSphere, sphereInState) {
  cloudSpheresData[sphere.id].appliances.forEach((appliance_from_cloud) => {
    // TODO: move this over to localId.
    cloudApplianceIds[appliance_from_cloud.id] = true; // mark this ID as "yes it is in the cloud"

    // check if we have to update of add this appliance
    if (sphereInState !== undefined && sphereInState.appliances[appliance_from_cloud.id] !== undefined) {
      let applianceInState = sphereInState.appliances[appliance_from_cloud.id];
      if (getTimeDifference(sphereInState.appliances[appliance_from_cloud.id].config, appliance_from_cloud) > 0) {
        // update cloud since our data is newer!
        LOG.info("SYNC: Updating appliance", appliance_from_cloud.id, "in Cloud since our data is newer!");

        let extraFields = {};
        // only admins get to update the behaviour
        if (adminInThisSphere === true) {
          extraFields["json"] = JSON.stringify(applianceInState.behaviour);
        }

        transferPromises.push(
          transferStones.updateOnCloud(actions,
            {sphereId: sphere.id, localId: appliance_from_cloud.id, cloudId: appliance_from_cloud.id, localData: applianceInState, extraFields: extraFields})
            .catch()
        );
      }
      else if (getTimeDifference(sphereInState.appliances[appliance_from_cloud.id].config, appliance_from_cloud) < 0 || !applianceInState.config.cloudId) {
        transferPromises.push(
          transferAppliances.updateLocal(actions,
            {sphereId: sphere.id, localId: appliance_from_cloud.id, cloudId: appliance_from_cloud.id, cloudData: appliance_from_cloud})
            .catch()
        );
      }
    }
    else {
      transferPromises.push(
        transferAppliances.createLocal(actions,
          {sphereId: sphere.id, localId: appliance_from_cloud.id, cloudId: appliance_from_cloud.id, cloudData: appliance_from_cloud})
          .then(() => {
            // we only download the behaviour the first time we add the stone.
            if (appliance_from_cloud.json !== undefined) {
              let behaviour = JSON.parse(appliance_from_cloud.json);

              if (behaviour.onHomeEnter)
                actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeEnter', sphereId: sphere.id, applianceId: appliance_from_cloud.id, data: behaviour.onHomeEnter });
              if (behaviour.onHomeExit)
                actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeExit', sphereId: sphere.id, applianceId: appliance_from_cloud.id, data: behaviour.onHomeExit });
              if (behaviour.onRoomEnter)
                actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomEnter', sphereId: sphere.id, applianceId: appliance_from_cloud.id, data: behaviour.onRoomEnter });
              if (behaviour.onRoomExit)
                actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomExit', sphereId: sphere.id, applianceId: appliance_from_cloud.id, data: behaviour.onRoomExit });
              if (behaviour.onNear)
                actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onNear', sphereId: sphere.id, applianceId: appliance_from_cloud.id, data: behaviour.onNear });
              if (behaviour.onAway)
                actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onAway', sphereId: sphere.id, applianceId: appliance_from_cloud.id, data: behaviour.onAway });
            }
          })
          .catch()
      );
    }
  });
};