export const getStonesFromState = function(state, groupId, locationId) {
  let filteredStones = {};
  if (groupId !== undefined && locationId !== undefined) {
    let stones = state.groups[groupId].stones;
    for (let stoneId in stones) {
      if (stones.hasOwnProperty(stoneId)) {
        if (stones[stoneId].config.locationId === locationId) {
          filteredStones[stoneId] = (stones[stoneId]);
        }
      }
    }
  }
  return filteredStones;
};

export const getPresentUsersFromState = function(state, groupId, locationId) {
  const location = state.groups[groupId].locations[locationId];
  let users = [];

  location.presentUsers.forEach((userId) => {
    users.push({id: userId, data: state.groups[groupId].members[userId]})
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
