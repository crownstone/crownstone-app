import { CLOUD } from '../cloudAPI'
import { LOG } from '../../logging/Log'

/**
 * We claim the cloud is leading for the availability of items.
 * @param store
 * @returns {Promise.<TResult>|*}
 */
export const sync = {

  sync: function (store) {
    let state = store.getState();
    let actions = [];
    return syncDown(state)
      .then((data) => {
        let cloudData = syncGroups(state, actions, data.groups, data.groupsData);
        let deletedGroup = syncCleanupLocal(store, state, actions, cloudData);
        syncKeys(actions, data.keys);

        LOG("SYNC Dispatching ", actions.length, " actions!");
        actions.forEach((action) => {
          action.triggeredBySync = true;
        });
        store.batchDispatch(actions);

        this.events.emit("CloudSyncComplete");

        if (cloudData.addedGroup === true || deletedGroup === true) {
          this.events.emit("CloudSyncComplete_groupsChanged");
        }
      })


  }
};

const syncDown = function (state) {
  return new Promise((resolve, reject) => {
    let userId = state.user.userId;
    let accessToken = state.user.accessToken;

    CLOUD.setAccess(accessToken);
    CLOUD.setUserId(userId);

    let cloudGroups = [];
    let cloudGroupsData = {};
    let cloudKeys = [];

    let syncPromises = [];

    syncPromises.push(
      CLOUD.getKeys()
        .then((data) => {
          cloudKeys = data;
        })
    );
    syncPromises.push(
      CLOUD.getGroups()
        .then((groupData) => {
          let groupDataPromises = [];
          groupData.forEach((group) => {
            cloudGroups.push(group);

            // download all data from the cloud to the phone
            groupDataPromises.push(CLOUD.forGroup(group.id).getGroupData(userId)
              .then((result) => {
                cloudGroupsData[group.id] = result;
              })
            );
          });

          return Promise.all(groupDataPromises);
        })
    );

    Promise.all(syncPromises)
      .then(() => {
        resolve({keys: cloudKeys, groups: cloudGroups, groupsData: cloudGroupsData})
      })
      .catch((err) => {
        reject(err);
      })
  });
};

const shouldUpdate = function(localVersion, cloudVersion) {
  return localVersion.updatedAt < new Date(cloudVersion.updatedAt).valueOf();
};


const syncCleanupLocal = function(store, state, actions, cloudData) {
  let groupIds = Object.keys(state.groups);
  let deletedGroup = false;

  groupIds.forEach((groupId) => {
    if (cloudData.cloudGroupIds[groupId] === undefined) {
      // we are going to remove this group, if it is active we first deactivate it.
      if (state.app.activeGroup == groupId) {
        store.dispatch({type: 'CLEAR_ACTIVE_GROUP'});
      }
      actions.push({type: 'REMOVE_GROUP', groupId: groupId});
      deletedGroup = true;
    }
    else {
      // if the group also exists in the cloud, check if its member need deletion
      let group = state.groups[groupId];
      let locationIds = Object.keys(group.locations);
      let stoneIds = Object.keys(group.stones);
      let applianceIds = Object.keys(group.appliances);
      let groupUserIds = Object.keys(group.users);

      // cleanup locations
      locationIds.forEach((locationId) => {
        if (cloudData.cloudLocationIds[locationId] === undefined) {
          actions.push({type: 'REMOVE_LOCATION', groupId: groupId, locationId: locationId});
        }
      });

      // cleanup stones
      stoneIds.forEach((stoneId) => {
        if (cloudData.cloudStoneIds[stoneId] === undefined) {
          actions.push({type: 'REMOVE_STONE', groupId: groupId, stoneId: stoneId});
        }
      });

      // cleanup appliances
      applianceIds.forEach((applianceId) => {
        if (cloudData.cloudApplianceIds[applianceId] === undefined) {
          actions.push({type: 'REMOVE_APPLIANCE', groupId: groupId, applianceId: applianceId});
        }
      });

      // cleanup group users
      groupUserIds.forEach((userId) => {
        if (cloudData.cloudGroupMemberIds[groupId][userId] === undefined) {
          actions.push({type: 'REMOVE_GROUP_USER', groupId: groupId, userId: userId});
        }
      });

    }
  });

  return deletedGroup;
};

const syncGroups = function(state, actions, groups, groupsData) {
  let cloudGroupMemberIds = {};
  let cloudGroupIds = {};
  let cloudStoneIds = {};
  let cloudLocationIds = {};
  let cloudApplianceIds = {};
  let addedGroup = false;

  groups.forEach((group) => {
    // put id in map so we can easily find it again
    cloudGroupIds[group.id] = true;
    cloudGroupMemberIds[group.id] = {};

    let groupInState = state.groups[group.id];

    // add or update the group.
    if (groupInState === undefined) {
      addedGroup = true;
      actions.push({type:'ADD_GROUP', groupId: group.id, data:{name: group.name, iBeaconUUID: group.uuid}});
    }
    else if (shouldUpdate(groupInState.config, group)) {
      actions.push({type: 'UPDATE_GROUP', groupId: group.id, data: {name: group.name, iBeaconUUID: group.uuid}});
    }

    /**
     * Sync the locations from the cloud to the database.
     */
    groupsData[group.id].locations.forEach((location) => {
      cloudLocationIds[location.id] = true;
      if (groupInState !== undefined && groupInState.locations[location.id] !== undefined) {
        if (shouldUpdate(groupInState.locations[location.id].config, location)) {
          actions.push({
            type: 'UPDATE_LOCATION_CONFIG',
            groupId: group.id,
            locationId: location.id,
            data: {name: location.name, icon: location.icon}
          });
        }
      }
      else {
        actions.push({
          type: 'ADD_LOCATION',
          groupId: group.id,
          locationId: location.id,
          data: {name: location.name, icon: location.icon}
        });
      }
    });


    /**
     * Sync the stones from the cloud to the database.
     */
    groupsData[group.id].stones.forEach((stone) => {
      cloudStoneIds[stone.id] = true;
      if (groupInState !== undefined && groupInState.stones[stone.id] !== undefined) {
        if (shouldUpdate(groupInState.stones[stone.id].config, stone)) {
          actions.push({
            type: 'UPDATE_STONE_CONFIG',
            groupId: group.id,
            stoneId: stone.id,
            data: {name: stone.name, icon: stone.deviceType, stoneId: stone.id}
          });
        }
      }
      else {
        actions.push({
          type: 'ADD_STONE',
          groupId: group.id,
          stoneId: stone.id,
          data: {name: stone.name, icon: stone.deviceType, stoneId: stone.id}
        });

        // we only download the behaviour the first time we add the stone.
        if (stone.json !== undefined) {
          let behaviour = JSON.parse(stone.json);

          if (behaviour.onHomeEnter)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeEnter', groupId: group.id, stoneId: stone.id, data: behaviour.onHomeEnter });
          if (behaviour.onHomeExit)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeExit', groupId: group.id, stoneId: stone.id, data: behaviour.onHomeExit });
          if (behaviour.onRoomEnter)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomEnter', groupId: group.id, stoneId: stone.id, data: behaviour.onRoomEnter });
          if (behaviour.onRoomExit)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomExit', groupId: group.id, stoneId: stone.id, data: behaviour.onRoomExit });
          if (behaviour.onNear)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onNear', groupId: group.id, stoneId: stone.id, data: behaviour.onNear });
          if (behaviour.onAway)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onAway', groupId: group.id, stoneId: stone.id, data: behaviour.onAway });
        }
      }
    });


    /**
     * Sync the appliances from the cloud to the database.
     */
    groupsData[group.id].appliances.forEach((appliance) => {
      cloudApplianceIds[appliance.id] = true;
      if (groupInState !== undefined && groupInState.appliances[appliance.id] !== undefined) {
        if (shouldUpdate(groupInState.appliances[appliance.id].config, appliance)) {
          actions.push({
            type: 'UPDATE_APPLIANCE_CONFIG',
            groupId: group.id,
            applianceId: appliance.id,
            data: {name: appliance.name, icon: appliance.deviceType}
          });
        }
      }
      else {
        actions.push({
          type: 'ADD_APPLIANCE',
          groupId: group.id,
          applianceId: appliance.id,
          data: {name: appliance.name, icon: appliance.deviceType, applianceId: appliance.applianceId}
        });

        // we only download the behaviour the first time we add the stone.
        if (appliance.json !== undefined) {
          let behaviour = JSON.parse(appliance.json);

          if (behaviour.onHomeEnter)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeEnter', groupId: group.id, applianceId: appliance.id, data: behaviour.onHomeEnter });
          if (behaviour.onHomeExit)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeExit', groupId: group.id, applianceId: appliance.id, data: behaviour.onHomeExit });
          if (behaviour.onRoomEnter)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomEnter', groupId: group.id, applianceId: appliance.id, data: behaviour.onRoomEnter });
          if (behaviour.onRoomExit)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomExit', groupId: group.id, applianceId: appliance.id, data: behaviour.onRoomExit });
          if (behaviour.onNear)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onNear', groupId: group.id, applianceId: appliance.id, data: behaviour.onNear });
          if (behaviour.onAway)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onAway', groupId: group.id, applianceId: appliance.id, data: behaviour.onAway });
        }
      }
    });


    /**
     * Sync the Admins from the cloud to the database.
     */
    Object.keys(groupsData[group.id].admins).forEach((userId) => {
      cloudGroupMemberIds[group.id][userId] = true;
      let user = groupsData[group.id].admins[userId];
      syncGroupUser(actions, group, groupInState, userId, user, state, 'admin');
    });
    Object.keys(groupsData[group.id].members).forEach((userId) => {
      cloudGroupMemberIds[group.id][userId] = true;
      let user = groupsData[group.id].members[userId];
      syncGroupUser(actions, group, groupInState, userId, user, state, 'member');
    });
    Object.keys(groupsData[group.id].guests).forEach((userId) => {
      cloudGroupMemberIds[group.id][userId] = true;
      let user = groupsData[group.id].guests[userId];
      syncGroupUser(actions, group, groupInState, userId, user, state, 'guest');
    });
  });

  return {
    cloudGroupMemberIds,
    cloudGroupIds,
    cloudStoneIds,
    cloudLocationIds,
    cloudApplianceIds,
    addedGroup
  }
};

const syncGroupUser = function(actions, group, groupInState, userId, user, state, accessLevel) {
  if (groupInState !== undefined && groupInState.users[userId] !== undefined) {
    // since we do not get a profile picture via the same way as the rest of the users, we alter the data to contain our own pic.
    let selfId = state.user.userId;
    if (userId == selfId) {
      user.picture = state.user.picture;
    }

    if (shouldUpdate(groupInState.users[userId], user)) {
      actions.push({
        type: 'UPDATE_GROUP_USER',
        groupId: group.id,
        userId: user.id,
        data: {
          picture: user.picture,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          emailVerified: user.emailVerified,
          accessLevel: accessLevel
        }
      });
    }
  }
  else {
    actions.push({
      type: 'ADD_GROUP_USER',
      groupId: group.id,
      userId: user.id,
      data: {
        picture: user.picture,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        emailVerified: user.emailVerified,
        accessLevel: accessLevel
      }
    });
  }
};

const syncKeys = function(actions, keys) {
  keys.forEach((keySet) => {
    actions.push({type:'SET_GROUP_KEYS', groupId: keySet.groupId, data:{
      adminKey:  keySet.keys.owner  || keySet.keys.admin || null,
      memberKey: keySet.keys.member || null,
      guestKey:  keySet.keys.guest  || null
    }})
  })
};

