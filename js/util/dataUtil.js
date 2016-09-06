import { NO_LOCATION_NAME } from '../ExternalConfig'

export const getStonesFromState = function(state, groupId, locationId) {
  let filteredStones = {};
  if (groupId !== undefined) {
    let stones = state.groups[groupId].stones;
    for (let stoneId in stones) {
      if (stones.hasOwnProperty(stoneId)) {
        if (stones[stoneId].config.locationId === locationId || locationId === undefined) {
          filteredStones[stoneId] = (stones[stoneId]);
        }
      }
    }
  }
  return filteredStones;
};

export const getAmountOfStonesInLocation = function(state, groupId, locationId) {
  let counter = 0;
  if (groupId !== undefined) {
    let stones = state.groups[groupId].stones;
    for (let stoneId in stones) {
      if (stones.hasOwnProperty(stoneId)) {
        if (stones[stoneId].config.locationId === locationId || locationId === undefined) {
          counter += 1;
        }
      }
    }
  }
  return counter;
}

export const getOrphanedStones = function(state, groupId) {
  let filteredStones = [];
  if (groupId !== undefined) {
    let stones = state.groups[groupId].stones;
    for (let stoneId in stones) {
      if (stones.hasOwnProperty(stoneId)) {
        if (stones[stoneId].config.locationId === null || stones[stoneId].config.locationId === undefined) {
          filteredStones.push(stones[stoneId]);
        }
      }
    }
  }
  return filteredStones;
};


export const getPresentUsersFromState = function(state, groupId, locationId, all = false) {
  let users = [];
  if (locationId === null) {
    return users;
  }

  const location = state.groups[groupId].locations[locationId];

  let presentUsers = location.presentUsers;
  if (all) {
    presentUsers = Object.keys(state.groups[groupId].users)
  }
  presentUsers.forEach((userId) => {
    users.push({id: userId, data: state.groups[groupId].users[userId]})
  });

  return users
};


export const getCurrentPowerUsageFromState = function(state, groupId, locationId) {
  let usage = 0;
  let stones = getStonesFromState(state, groupId, locationId);
  for (let stoneId in stones) {
    if (stones.hasOwnProperty(stoneId)) {
      usage += stones[stoneId].state.currentUsage
    }
  }

  return usage
};


export const getGroupContentFromState = function(state, groupId) {
  let stones = getStonesFromState(state, groupId);
  let appliances = state.groups[groupId].appliances;

  let items = {};
  for (let stoneId in stones) {
    if (stones.hasOwnProperty(stoneId)) {
      let stone = stones[stoneId];
      if (stone.config.applianceId)
        items[stoneId] = {stone: stone, device: appliances[stone.config.applianceId]};
      else
        items[stoneId] = {stone: stone, device: stone}
    }
  }
  return items;
};


export const getRoomContentFromState = function(state, groupId, locationId) {
  let stones = getStonesFromState(state, groupId, locationId);
  let appliances = state.groups[groupId].appliances;

  let items = {};
  for (let stoneId in stones) {
    if (stones.hasOwnProperty(stoneId)) {
      let stone = stones[stoneId];
      if (stone.config.applianceId)
        items[stoneId] = {stone: stone, device: appliances[stone.config.applianceId]};
      else
        items[stoneId] = {stone: stone, device: stone}
    }
  }
  return items;
};


export const getRoomNames = function(state, groupId) {
  let roomNames = {};
  let rooms = state.groups[groupId].locations;
  for (let roomId in rooms) {
    if (rooms.hasOwnProperty(roomId)) {
      let room = rooms[roomId];
      roomNames[room.config.name] = true;
    }
  }
  return roomNames;
};


export const userIsAdmin = function(state) {
  let groupIds = Object.keys(state.groups);
  for (let i = 0; i < groupIds.length; i++) {
    if (state.groups[groupIds[i]].config.adminKey !== undefined) {
      return true;
    }
  }
  return false;
};


export const getGroupsWhereIHaveAccessLevel = function(state, accessLevel) {
  let items = [];
  for (let groupId in state.groups) {
    if (state.groups.hasOwnProperty(groupId)) {
      let group = state.groups[groupId];
      // there can be a race condition where the current user is yet to be added to groups but a redraw during the creation process triggers this method
      if (group.users[state.user.userId] && group.users[state.user.userId].accessLevel === accessLevel) {
        items.push({id: groupId, name: group.config.name});
      }
    }
  }
  return items;
};


export const getMyLevelInGroup = function(state, groupId) {
  let userId = state.user.userId;

  return state.groups[groupId].users[userId].accessLevel;
};


export const userInGroups = function(state) {
  return Object.keys(state.groups).length > 0;
};


export const getGroupName = function(state, id) {
  return state.groups[id].config.name;
};


export const getRoomName = function(state, groupId, locationId) {
  if (locationId === null) {
    return NO_LOCATION_NAME;
  }
  return state.groups[groupId].locations[locationId].config.name;
};


export const getRoomIdFromName = function(state, groupId, locationName) {
  if (locationName === NO_LOCATION_NAME) {
    return null;
  }
  let locations = state.groups[groupId].locations;
  for (let locationId in locations) {
    if (locations.hasOwnProperty(locationId)) {
      if (locations[locationId].config.name == locationName) {
        return locationId;
      }
    }
  }
  return false;
};

export const getTotalAmountOfCrownstones = function(state) {
  let groupIds = Object.keys(state.groups);
  let count = 0;
  groupIds.forEach((groupId) => {
    count += Object.keys(state.groups[groupId].stones).length;
  })
  return count;
};