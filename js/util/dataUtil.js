import { NO_LOCATION_NAME, AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION } from '../ExternalConfig'
import { LOG, LOGError } from '../logging/Log'

const DeviceInfo = require('react-native-device-info');

export const getStonesInLocation = function(state, sphereId, locationId) {
  let filteredStones = {};
  if (sphereId !== undefined) {
    let stones = state.spheres[sphereId].stones;
    let stoneIds = Object.keys(stones);
    stoneIds.forEach((stoneId) => {
      if (stones[stoneId].config.locationId === locationId || locationId === undefined) {
        filteredStones[stoneId] = (stones[stoneId]);
      }
    })
  }
  return filteredStones;
};

export const getAmountOfStonesInLocation = function(state, sphereId, locationId) {
  let counter = 0;
  if (sphereId !== undefined) {
    let stones = state.spheres[sphereId].stones;
    let stoneIds = Object.keys(stones);
    stoneIds.forEach((stoneId) => {
      if (stones[stoneId].config.locationId === locationId || locationId === undefined) {
        counter += 1;
      }
    })
  }
  return counter;
};

export const getFloatingStones = function(state, sphereId) {
  return getStonesInLocation(state, sphereId, null);
};


export const getPresentUsersInLocation = function(state, sphereId, locationId, all = false) {
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


export const getCurrentPowerUsageInLocation = function(state, sphereId, locationId) {
  let usage = 0;
  let stones = getStonesInLocation(state, sphereId, locationId);
  for (let stoneId in stones) {
    if (stones.hasOwnProperty(stoneId)) {
      usage += stones[stoneId].state.currentUsage
    }
  }

  return usage
};


export const getStonesAndAppliancesInSphere = function(state, sphereId) {
  let stones = getStonesInLocation(state, sphereId);
  let appliances = state.spheres[sphereId].appliances;

  let items = {};
  let stoneIds = Object.keys(stones);
  stoneIds.forEach((stoneId) => {
    let stone = stones[stoneId];
    if (stone.config.applianceId)
      items[stoneId] = {stone: stone, device: appliances[stone.config.applianceId]};
    else
      items[stoneId] = {stone: stone, device: stone}
  });
  return items;
};


export const getStonesAndAppliancesInLocation = function(state, sphereId, locationId) {
  let stones = getStonesInLocation(state, sphereId, locationId);
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


export const getLocationNamesInSphere = function(state, sphereId) {
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


export const getSpheresWhereUserHasAccessLevel = function(state, accessLevel) {
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


export const getUserLevelInSphere = function(state, sphereId) {
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



export const getMapOfCrownstonesInAllSpheresByHandle = function(state) {
  return _getMap(state, 'handle');
};

export const getMapOfCrownstonesInAllSpheresByCID = function(state) {
  return _getMap(state, 'crownstoneId');
};

function _getMap(state, requestedKey) {
  let sphereIds = Object.keys(state.spheres);
  let map = {};
  sphereIds.forEach((sphereId) => {
    let stoneIds = Object.keys(state.spheres[sphereId].stones);
    let locations = state.spheres[sphereId].locations;
    let appliances = state.spheres[sphereId].appliances;
    map[sphereId] = {};

    stoneIds.forEach((stoneId) => {
      let stoneConfig = state.spheres[sphereId].stones[stoneId].config;
      map[sphereId][stoneConfig[requestedKey]] = {
        id: stoneId,
        cid: stoneConfig.crownstoneId,
        handle: stoneConfig.handle,
        name: stoneConfig.name,
        applianceName: stoneConfig.applianceId ? appliances[stoneConfig.applianceId].config.name : undefined,
        locationName: stoneConfig.locationId ? locations[stoneConfig.locationId].config.name : undefined
      };
    })
  });
  return map;
}

export const getAiData = function(state, sphereId) {
  let sexes = {
    his: { male:'his', female:'her' },
    him: { male:'him', female:'her' },
    he:  { male:'he',  female:'she' },
  };

  return {
    name: state.spheres[sphereId].config.aiName,
    his: sexes.his[state.spheres[sphereId].config.aiSex],
    him: sexes.him[state.spheres[sphereId].config.aiSex],
    he:  sexes.he[state.spheres[sphereId].config.aiSex],
  }
};

export const getDeviceSpecs = function() {
  let address = DeviceInfo.getUniqueID();  // e.g. FCDBD8EF-62FC-4ECB-B2F5-92C9E79AC7F9 note this is IdentityForVendor on iOS so it will change if all apps from the current apps vendor have been previously uninstalled
  let name = DeviceInfo.getDeviceName();
  let description = DeviceInfo.getManufacturer() + "," + DeviceInfo.getBrand() + "," + DeviceInfo.getDeviceName();

  return { address, name, description };
};

export const getCurrentDeviceId = function(state) {
  let specs = getDeviceSpecs();

  let deviceIds = Object.keys(state.devices);
  for (let i = 0; i < deviceIds.length; i++) {
    if (state.devices[deviceIds[i]].address == specs.address) {
      return deviceIds[i];
    }
  }
  return undefined;
};


export const prepareStoreForUser = function(store) {
  const state = store.getState();
  let spheres = state.spheres;
  let sphereIds = Object.keys(spheres);
  let actions = [];
  sphereIds.forEach((sphereId) => {
    let locations = spheres[sphereId].locations;
    let locationIds = Object.keys(locations);

    locationIds.forEach((locationId) => {
      actions.push({type: 'CLEAR_USERS', sphereId: sphereId, locationId: locationId});
    });

    let stones = spheres[sphereId].stones;
    let stoneIds = Object.keys(stones);

    stoneIds.forEach((stoneId) => {
      actions.push({type:'CLEAR_STONE_USAGE', sphereId:sphereId, stoneId:stoneId});
      actions.push({type:'UPDATE_STONE_DISABILITY', sphereId:sphereId, stoneId:stoneId, data: { disabled: true }});
    });

    actions.push({type: 'SET_SPHERE_STATE', sphereId: sphereId, data: { reachable: false, present: false }});
  });

  actions.push({type:'CREATE_APP_IDENTIFIER'});

  store.batchDispatch(actions);
};


export const canUseIndoorLocalizationInSphere = function (state, sphereId) {
  // if we do not have a sphereId return false
  if (!sphereId || !state)
    return false;

  // are there enough?
  let enoughForLocalization = enoughCrownstonesInLocationsForIndoorLocalization(state,sphereId);

  // do we need more fingerprints?
  let requiresFingerprints = requireMoreFingerprints(state, sphereId);

  // we have enough and we do not need more fingerprints.
  return !requiresFingerprints && enoughForLocalization;
};


export const enoughCrownstonesForIndoorLocalization = function(state, sphereId) {
  return Object.keys(state.spheres[sphereId].stones).length >= AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION;
};

export const enoughCrownstonesInLocationsForIndoorLocalization = function(state, sphereId) {
  let stoneIds = Object.keys(state.spheres[sphereId].stones);
  let count = 0;

  stoneIds.forEach((stoneId) => {
    let stone = state.spheres[sphereId].stones[stoneId];
    if (stone.config.locationId !== undefined && stone.config.locationId !== null) {
      count += 1;
    }
  });
  return count >= AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION;
};

export const requireMoreFingerprints = function (state, sphereId) {
  // if we do not have a sphereId return false
  if (!sphereId || !state)
    return true;

  // do we need more fingerprints?
  let requiresFingerprints = false;
  if (state.spheres && state.spheres[sphereId] && state.spheres[sphereId].locations) {
    let locationIds = Object.keys(state.spheres[sphereId].locations);
    locationIds.forEach((locationId) => {
      if (state.spheres[sphereId].locations[locationId].config.fingerprintRaw === null) {
        requiresFingerprints = true;
      }
    });
  }
  return requiresFingerprints;
};
