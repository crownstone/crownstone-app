import { NO_LOCATION_NAME, AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION } from '../ExternalConfig'

export const getStonesFromState = function(state, sphereId, locationId) {
  let filteredStones = {};
  if (sphereId !== undefined) {
    let stones = state.spheres[sphereId].stones;
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

export const getAmountOfStonesInLocation = function(state, sphereId, locationId) {
  let counter = 0;
  if (sphereId !== undefined) {
    let stones = state.spheres[sphereId].stones;
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

export const getOrphanedStones = function(state, sphereId) {
  let filteredStones = [];
  if (sphereId !== undefined) {
    let stones = state.spheres[sphereId].stones;
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


export const getPresentUsersFromState = function(state, sphereId, locationId, all = false) {
  let users = [];
  if (locationId === null) {
    return users;
  }

  const location = state.spheres[sphereId].locations[locationId];

  let presentUsers = location.presentUsers;
  if (all) {
    presentUsers = Object.keys(state.spheres[sphereId].users)
  }
  presentUsers.forEach((userId) => {
    users.push({id: userId, data: state.spheres[sphereId].users[userId]})
  });

  return users
};


export const getCurrentPowerUsageFromState = function(state, sphereId, locationId) {
  let usage = 0;
  let stones = getStonesFromState(state, sphereId, locationId);
  for (let stoneId in stones) {
    if (stones.hasOwnProperty(stoneId)) {
      usage += stones[stoneId].state.currentUsage
    }
  }

  return usage
};


export const getSphereContentFromState = function(state, sphereId) {
  let stones = getStonesFromState(state, sphereId);
  let appliances = state.spheres[sphereId].appliances;

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


export const getRoomContentFromState = function(state, sphereId, locationId) {
  let stones = getStonesFromState(state, sphereId, locationId);
  let appliances = state.spheres[sphereId].appliances;

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


export const getRoomNames = function(state, sphereId) {
  let roomNames = {};
  let rooms = state.spheres[sphereId].locations;
  for (let roomId in rooms) {
    if (rooms.hasOwnProperty(roomId)) {
      let room = rooms[roomId];
      roomNames[room.config.name] = true;
    }
  }
  return roomNames;
};


export const userIsAdmin = function(state) {
  let sphereIds = Object.keys(state.spheres);
  for (let i = 0; i < sphereIds.length; i++) {
    if (state.spheres[sphereIds[i]].config.adminKey !== undefined) {
      return true;
    }
  }
  return false;
};

export const userIsAdminInSphere = function(state, sphereId) {
  return state.spheres[sphereId].config.adminKey !== undefined;
};

export const getSpheresWhereIHaveAccessLevel = function(state, accessLevel) {
  let items = [];
  for (let sphereId in state.spheres) {
    if (state.spheres.hasOwnProperty(sphereId)) {
      let sphere = state.spheres[sphereId];
      // there can be a race condition where the current user is yet to be added to spheres but a redraw during the creation process triggers this method
      if (sphere.users[state.user.userId] && sphere.users[state.user.userId].accessLevel === accessLevel) {
        items.push({id: sphereId, name: sphere.config.name});
      }
    }
  }
  return items;
};


export const getMyLevelInSphere = function(state, sphereId) {
  let userId = state.user.userId;
  if (state.spheres[sphereId].users[userId])
    return state.spheres[sphereId].users[userId].accessLevel;
  else {
    if (state.spheres[sphereId].config.adminKey !== null) {
      LOGError("User is admin but is not added to the sphere users. This is likely an issue in the Cloud.");
      return 'admin';
    }
    else if (state.spheres[sphereId].config.memberKey !== null) {
      LOGError("User is member but is not added to the sphere users. This is likely an issue in the Cloud.");
      return 'member';
    }
    else if (state.spheres[sphereId].config.guestKey !== null) {
      LOGError("User is guest but is not added to the sphere users. This is likely an issue in the Cloud.");
      return 'guest';
    }
  }
};


export const userInSpheres = function(state) {
  return Object.keys(state.spheres).length > 0;
};


export const getSphereName = function(state, id) {
  return state.spheres[id].config.name;
};


export const getRoomName = function(state, sphereId, locationId) {
  if (locationId === null) {
    return NO_LOCATION_NAME;
  }
  return state.spheres[sphereId].locations[locationId].config.name;
};


export const getRoomIdFromName = function(state, sphereId, locationName) {
  if (locationName === NO_LOCATION_NAME) {
    return null;
  }
  let locations = state.spheres[sphereId].locations;
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
  let sphereIds = Object.keys(state.spheres);
  let count = 0;
  sphereIds.forEach((sphereId) => {
    count += Object.keys(state.spheres[sphereId].stones).length;
  });
  return count;
};

export const getAmountOfCrownstonesInSphereForLocalization = function(state, sphereId) {
  let stoneIds = Object.keys(state.spheres[sphereId].stones);
  let count = 0;

  stoneIds.forEach((stoneId) => {
    let stone = state.spheres[sphereId].stones[stoneId];
    if (stone.config.locationId !== undefined && stone.config.locationId !== null) {
      count += 1;
    }
  });
  return count;
};

export const enoughCrownstonesForIndoorLocalization = function(state, sphereId) {
  let amount = getAmountOfCrownstonesInSphereForLocalization(state, sphereId);
  return amount >= AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION;
};

export const getMapOfCrownstonesInAllSpheresByHandle = function(state) {
  let sphereIds = Object.keys(state.spheres);
  let map = {};
  sphereIds.forEach((sphereId) => {
    let stoneIds = Object.keys(state.spheres[sphereId].stones);
    let locations = state.spheres[sphereId].locations;
    let appliances = state.spheres[sphereId].appliances;
    stoneIds.forEach((stoneId) => {
      let stoneConfig = state.spheres[sphereId].stones[stoneId].config;
      map[stoneConfig.handle] = {
        id: stoneId,
        cid: stoneConfig.crownstoneId,
        name: stoneConfig.name,
        applianceName: stoneConfig.applianceId ? appliances[stoneConfig.applianceId].config.name : undefined,
        locationName: stoneConfig.locationId ? locations[stoneConfig.locationId].config.name : undefined
      };
    })
  });
  return map;
};

export const getMapOfCrownstonesInSphereByCID = function(state, sphereId) {
  if (sphereId) {
    let map = {};
    let stoneIds = Object.keys(state.spheres[sphereId].stones);
    let locations = state.spheres[sphereId].locations;
    let appliances = state.spheres[sphereId].appliances;
    stoneIds.forEach((stoneId) => {
      let stoneConfig = state.spheres[sphereId].stones[stoneId].config;
      map[stoneConfig.crownstoneId] = {
        id: stoneId,
        handle: stoneConfig.handle,
        name: stoneConfig.name,
        applianceName: stoneConfig.applianceId ? appliances[stoneConfig.applianceId].config.name : undefined,
        locationName: stoneConfig.locationId ? locations[stoneConfig.locationId].config.name : undefined
      };
    });
    return map;
  }
  return {};
};

export const getAiData = function(state, sphereId) {
  let sexes = {
    ref1: {male:'his', female:'her', other:'it'},
    ref2: {male:'him', female:'her', other:'it'},
  };

  return {
    name: state.spheres[sphereId].config.aiName,
    ref1: sexes.ref1[state.spheres[sphereId].config.aiSex],
    ref2: sexes.ref2[state.spheres[sphereId].config.aiSex],
  }


}