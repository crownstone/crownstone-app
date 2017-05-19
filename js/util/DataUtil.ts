import { AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION } from '../ExternalConfig'
import { LOG } from '../logging/Log'
import { stoneTypes } from '../router/store/reducers/stones'

import { Alert } from 'react-native';

const DeviceInfo = require('react-native-device-info');


export const DataUtil = {

  /**
   * Call a callback on all stones in all spheres
   * @param state
   * @param callback
   */
  callOnAllStones: function(state: any, callback: (sphereId: string, stoneId: string, stone: any) => void) {
    let sphereIds = Object.keys(state.spheres);
    for (let i = 0; i < sphereIds.length; i++) {
      let stones = state.spheres[sphereIds[i]].stones;
      let stoneIds = Object.keys(stones);
      for (let j = 0; j < stoneIds.length; j++) {
        callback(sphereIds[i], stoneIds[j], stones[stoneIds[j]])
      }
    }
  },

  /**
   * Call a callback on all stones in all spheres
   * @param state
   * @param sphereId
   * @param callback
   */
  callOnStonesInSphere: function(state: any, sphereId: string, callback: (stoneId: string, stone: any) => void) {
    let stones = state.spheres[sphereId].stones;
    let stoneIds = Object.keys(stones);
    for (let j = 0; j < stoneIds.length; j++) {
      callback(stoneIds[j], stones[stoneIds[j]])
    }
  },

  /**
   * Get the ID of the device (phone model) we are currently using.
   * @param state
   * @param deviceAddress
   * @returns {*}
   */
  getDeviceIdFromState: function(state, deviceAddress : string) : string {
    let deviceIds = Object.keys(state.devices);
    for (let i = 0; i < deviceIds.length; i++) {
      if (state.devices[deviceIds[i]].address === deviceAddress) {
        return deviceIds[i];
      }
    }
    return null;
  },

  getTapToToggleCalibration: function(state) : number {
    if (state && state.devices) {
      let deviceId = this.getDeviceIdFromState(state, state.user.appIdentifier);
      if (deviceId && state.devices[deviceId]) {
        let calibration = state.devices[deviceId].tapToToggleCalibration;
        if (calibration) {
          return calibration;
        }
      }
    }
    return null;
  },

  getPresentSphere: function(state) {
    let sphereIds = Object.keys(state.spheres);
    for (let i = 0; i < sphereIds.length; i++ ) {
      if (state.spheres[sphereIds[i]].config.present === true) {
        return sphereIds[i];
      }
    }
    return null;
  },

  getStonesInLocation: function(state : any, sphereId : string, locationId?) : object {
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
  },

  getStonesInLocationArray: function(state : any, sphereId : string, locationId?) : any[] {
    let filteredStones = [];
    if (sphereId !== undefined) {
      let stones = state.spheres[sphereId].stones;
      let stoneIds = Object.keys(stones);
      stoneIds.forEach((stoneId) => {
        if (stones[stoneId].config.locationId === locationId || locationId === undefined) {
          filteredStones.push(stones[stoneId]);
        }
      })
    }
    return filteredStones;
  },


  /**
   * If the stone has an appliance, return that appliance, otherwise return the stone. This gets you the item that
   * contains the active behaviour
   * @param sphere
   * @param stone
   * @returns {*}
   */
  getElement: function(sphere, stone) {
    if (stone.config.applianceId) {
      return sphere.appliances[stone.config.applianceId];
    }
    else {
      return stone;
    }
  },


  userHasPlugsInSphere: function(state, sphereId) {
    let stones = state.spheres[sphereId].stones;
    let stoneIds = Object.keys(stones);

    for (let i = 0; i < stoneIds.length; i++) {
      if (stones[stoneIds[i]].config.type === stoneTypes.plug) {
        return true;
      }
    }

    return false;
  },

  getStoneIdFromHandle: function(state, sphereId, handle) {
    let stones = state.spheres[sphereId].stones;
    let stoneIds = Object.keys(stones);
    for (let i = 0; i < stoneIds.length; i++) {
      if (stones[stoneIds[i]].config.handle === handle) {
        return stoneIds[i]
      }
    }
  },

  getStoneFromHandle: function(state, sphereId, handle) {
    let stoneId = DataUtil.getStoneIdFromHandle(state, sphereId, handle);
    return state.spheres[sphereId].stones[stoneId];
  },

  getDeviceSpecs: function(state) {
    let address = state.user.appIdentifier;
    let name = DeviceInfo.getDeviceName();
    let description = DeviceInfo.getManufacturer() + "," + DeviceInfo.getBrand() + "," + DeviceInfo.getDeviceName();

    return { name, address, description };
  },

  getCurrentDeviceId: function(state) {
    let specs = DataUtil.getDeviceSpecs(state);

    let deviceIds = Object.keys(state.devices);
    for (let i = 0; i < deviceIds.length; i++) {
      if (state.devices[deviceIds[i]].address == specs.address) {
        return deviceIds[i];
      }
    }
    return undefined;
  },
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

// TODO: replace by dataUtil method
export const getFloatingStones = function(state, sphereId) {
  let floatingStones = [];
  if (sphereId !== undefined) {
    let stones = state.spheres[sphereId].stones;
    let stoneIds = Object.keys(stones);
    stoneIds.forEach((stoneId) => {
      if (stones[stoneId].config.locationId === null || stones[stoneId].config.locationId === undefined) {
        floatingStones.push(stones[stoneId]);
      }
    })
  }
  return floatingStones;
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
  let stones = DataUtil.getStonesInLocation(state, sphereId, locationId);
  let stoneIds = Object.keys(stones);

  for (let i = 0; i < stoneIds.length; i++) {
    usage += stones[stoneIds[i]].state.currentUsage
  }

  return usage
};


export const getStonesAndAppliancesInSphere = function(state, sphereId) {
  let stones = DataUtil.getStonesInLocation(state, sphereId);
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


export const getStonesAndAppliancesInLocation = function(state, sphereId, locationId) : object {
  let stones = DataUtil.getStonesInLocation(state, sphereId, locationId);
  let stoneIds = Object.keys(stones);
  let appliances = state.spheres[sphereId].appliances;

  let items = {};

  for (let i = 0; i < stoneIds.length; i++) {
    let stoneId = stoneIds[i];
    let stone = stones[stoneId];
    if (stone.config.applianceId)
      items[stoneId] = {stone: stone, device: appliances[stone.config.applianceId]};
    else
      items[stoneId] = {stone: stone, device: stone}
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
      LOG.error("User is admin but is not added to the sphere users. This is likely an issue in the Cloud.");
      return 'admin';
    }
    else if (state.spheres[sphereId].config.memberKey !== null) {
      LOG.error("User is member but is not added to the sphere users. This is likely an issue in the Cloud.");
      return 'member';
    }
    else if (state.spheres[sphereId].config.guestKey !== null) {
      LOG.error("User is guest but is not added to the sphere users. This is likely an issue in the Cloud.");
      return 'guest';
    }
  }
};


/**
 * @param state
 * @returns {{}}
 *
 * return dataType = { handle: details }
 *
 * details = {
      id:  reduxStoneId
      cid: crownstoneId (smallId)
      handle: handle
      name: stone name in config
      sphereId: sphere id that contains stone
      stoneConfig: config of stone
      applianceName: name of appliance
      locationName: name of location
    }
 */
export const getMapOfCrownstonesInAllSpheresByHandle = function(state) {
  return _getMap(state, 'handle', false);
};

/**
 * @param state
 * @returns {{}}
 *
 * return dataType = { sphereId: { handle: details }}
 *
 * details = {
      id:  reduxStoneId
      cid: crownstoneId (smallId)
      handle: handle
      name: stone name in config
      sphereId: sphere id that contains stone
      stoneConfig: config of stone
      applianceName: name of appliance
      locationName: name of location
    }
 */
export const getMapOfCrownstonesBySphereByHandle = function(state) {
  return _getMap(state, 'handle', true);
};

/**
 * @param state
 * @returns {{}}
 *
 * return dataType = { sphereId: { crownstoneId: details }}
 *
 * details = {
      id:  reduxStoneId
      cid: crownstoneId (smallId)
      handle: handle
      name: stone name in config
      sphereId: sphere id that contains stone
      stoneConfig: config of stone
      applianceName: name of appliance
      locationName: name of location
    }
 */
export const getMapOfCrownstonesInAllSpheresByCID = function(state) {
  return _getMap(state, 'crownstoneId', true);
};

function _getMap(state, requestedKey, sphereMap : boolean) {
  let sphereIds = Object.keys(state.spheres);
  let map = {};
  sphereIds.forEach((sphereId) => {
    let stoneIds = Object.keys(state.spheres[sphereId].stones);
    let locations = state.spheres[sphereId].locations;
    let appliances = state.spheres[sphereId].appliances;

    if (sphereMap) {
      map[sphereId] = {};
    }

    stoneIds.forEach((stoneId) => {
      let stoneConfig = state.spheres[sphereId].stones[stoneId].config;

      let data = {
        id: stoneId,
        cid: stoneConfig.crownstoneId,
        handle: stoneConfig.handle,
        name: stoneConfig.name,
        sphereId: sphereId,
        stoneConfig: stoneConfig,
        applianceName: stoneConfig.applianceId && appliances && appliances[stoneConfig.applianceId] ? appliances[stoneConfig.applianceId].config.name : undefined,
        locationName: stoneConfig.locationId && locations && locations[stoneConfig.locationId] ? locations[stoneConfig.locationId].config.name : undefined
      };

      if (sphereMap) {
        map[sphereId][stoneConfig[requestedKey]] = data
      }
      else {
        map[stoneConfig[requestedKey]] = data
      }
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

  if (sphereId) {
    return {
      name: state.spheres[sphereId].config.aiName,
      his: sexes.his[state.spheres[sphereId].config.aiSex],
      him: sexes.him[state.spheres[sphereId].config.aiSex],
      he:  sexes.he[state.spheres[sphereId].config.aiSex],
    }
  }
  else {
    return {
      name: 'AI',
      his: 'her',
      him: 'her',
      he:  'she',
    }
  }


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
  });

  store.batchDispatch(actions);
};



export const clearRSSIs = function(store, sphereId) {
  const state = store.getState();
  let actions = [];
  let stones = state.spheres[sphereId].stones;
  let stoneIds = Object.keys(stones);

  stoneIds.forEach((stoneId) => {
    actions.push({type:'UPDATE_STONE_RSSI', sphereId:sphereId, stoneId:stoneId, data: { rssi: -1000 }});
  });

  store.batchDispatch(actions);
};

export const disableStones = function(store, sphereId) {
  const state = store.getState();
  let actions = [];
  let stones = state.spheres[sphereId].stones;
  let stoneIds = Object.keys(stones);

  stoneIds.forEach((stoneId) => {
    actions.push({type:'UPDATE_STONE_DISABILITY', sphereId:sphereId, stoneId:stoneId, data: { disabled: true }});
  });

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
  if (!(state && state.spheres && state.spheres[sphereId] && state.spheres[sphereId].stones)) {
    return false;
  }

  return Object.keys(state.spheres[sphereId].stones).length >= AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION;
};

export const enoughCrownstonesInLocationsForIndoorLocalization = function(state, sphereId) {
  if (!(state && sphereId && state.spheres && state.spheres[sphereId] && state.spheres[sphereId].stones)) {
    return false;
  }

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
