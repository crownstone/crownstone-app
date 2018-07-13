import { Platform } from 'react-native'
import { AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION } from '../ExternalConfig'
import { LOG } from '../logging/Log'
import { STONE_TYPES } from '../router/store/reducers/stones'

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
    if (state && state.spheres && state.spheres[sphereId]) {
      let stones = state.spheres[sphereId].stones;
      let stoneIds = Object.keys(stones);
      for (let j = 0; j < stoneIds.length; j++) {
        callback(stoneIds[j], stones[stoneIds[j]])
      }
    }
    else {
      LOG.error("DataUtil: Trying to call method on all stones in sphere but I cannot find stones in this sphere (or the sphere itself)");
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

  getDevice: function(state) {
    let deviceId = this.getDeviceIdFromState(state, state.user.appIdentifier);
    if (state.devices && deviceId && state.devices[deviceId]) {
      return state.devices[deviceId];
    }
    return null;
  },

  getPresentSphereId: function(state) {
    let sphereIds = Object.keys(state.spheres);
    for (let i = 0; i < sphereIds.length; i++ ) {
      if (state.spheres[sphereIds[i]].state.present === true) {
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
  getElement: function(store, sphereId, stoneId, stone) {
    let state = store.getState();
    let sphere = state.spheres[sphereId];
    if (!sphere) { return stone; }

    if (stone.config.applianceId && sphere.appliances[stone.config.applianceId]) {
      return sphere.appliances[stone.config.applianceId];
    }
    else if (stone.config.applianceId) {
      LOG.error("DataUtil: Stone has an appliance ID but the appliance itself is not found.", stone.config.applianceId);

      // self repair..
      if (stoneId) {
        store.dispatch({type: "UPDATE_STONE_CONFIG", sphereId: sphereId, stoneId: stoneId, data: { applianceId: null }})
      }

      return stone;
    }
    else {
      return stone;
    }
  },

  /**
   * If the stone has an appliance, return that appliance, otherwise return the stone. This gets you the item that
   * contains the active behaviour
   * @param sphere
   * @param stone
   * @returns {*}
   */
  getLocationFromStone: function(sphere, stone) {
    if (stone.config.locationId && sphere.locations[stone.config.locationId]) {
      return sphere.locations[stone.config.locationId];
    }
    else {
      return null;
    }
  },

  getUserLocation(state, userId) {
    let presentSphereId = null;
    let presentLocationId = null;

    // first we determine in which sphere we are:
    let sphereIds = Object.keys(state.spheres);
    for (let i = 0; i < sphereIds.length; i++) {
      if (state.spheres[sphereIds[i]].state.present === true) {
        presentSphereId = sphereIds[i];
      }
    }

    // if the user is in a sphere, search for his location.
    if (presentSphereId) {
      presentLocationId = DataUtil.getUserLocationIdInSphere(state, presentSphereId, userId);
    }

    return { sphereId: presentSphereId, locationId: presentLocationId };
  },

  getUserLocationIdInSphere: function(state, sphereId, userId) {
    let locationIds = Object.keys(state.spheres[sphereId].locations);
    for (let i = 0; i < locationIds.length; i++) {
      let location = state.spheres[sphereId].locations[locationIds[i]];
      if (location.presentUsers.indexOf(userId) !== -1) {
        return locationIds[i];
      }
    }
    return null;
  },


  userHasPlugsInSphere: function(state, sphereId) {
    let stones = state.spheres[sphereId].stones;
    let stoneIds = Object.keys(stones);

    for (let i = 0; i < stoneIds.length; i++) {
      if (stones[stoneIds[i]].config.type === STONE_TYPES.plug) {
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
    let description = DeviceInfo.getManufacturer() + " : " + DeviceInfo.getBrand() + ' : ' + DeviceInfo.getDeviceId();
    let os = DeviceInfo.getSystemName() + ' ' + DeviceInfo.getSystemVersion();
    let deviceType = DeviceInfo.getDeviceId();
    let model = DeviceInfo.getModel();
    let userAgent = DeviceInfo.getUserAgent();
    let locale = DeviceInfo.getDeviceLocale();

    return { name, address, description, os, userAgent, locale, deviceType, model };
  },

  getCurrentDeviceId: function(state) {
    let specs = DataUtil.getDeviceSpecs(state);

    let deviceIds = Object.keys(state.devices);
    for (let i = 0; i < deviceIds.length; i++) {
      if (state.devices[deviceIds[i]].address == specs.address) {
        return deviceIds[i];
      }
    }
    return null;
  },

  getAiData: function(state, sphereId) {
    let sexes = {
      his: { male:'his', female:'her' },
      him: { male:'him', female:'her' },
      he:  { male:'he',  female:'she' },
    };

    if (sphereId) {
      if (!state.spheres[sphereId].config.aiSex) {
        return {
          name: state.spheres[sphereId].config.aiName || 'AI',
          his: 'her',
          him: 'her',
          he:  'she',
        }
      }
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
  },



  getSpheresWhereUserHasAccessLevel: function(state, accessLevel) {
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
  },

  getLayoutDataRooms: function(state, sphereId, showSetupCrownstone = false) {
    let initialPositions = {}
    let sphere = state.spheres[sphereId]
    let rooms = sphere.locations;

    let floatingStones = getFloatingStones(state, sphereId);
    let showFloatingCrownstones = floatingStones.length > 0 || showSetupCrownstone;

    let roomIdArray = Object.keys(rooms).sort();
    let usePhysics = false;

    for (let i = 0; i < roomIdArray.length; i++) {
      let room = rooms[roomIdArray[i]];
      initialPositions[roomIdArray[i]] = {x: room.layout.x, y: room.layout.y};
      if (room.layout.setOnThisDevice === false) {
        usePhysics = true
      }
    }

    if (showFloatingCrownstones) {
      roomIdArray.push(null);
      initialPositions['null'] = {x: sphere.layout.floatingLocation.x, y: sphere.layout.floatingLocation.y};
      if ( sphere.layout.floatingLocation.setOnThisDevice === false ) {
        usePhysics = true
      }
    }

    return { roomIdArray, initialPositions, usePhysics };
  },


  getUserLevelInSphere: function(state, sphereId) {
    if (!(state && state.user && state.user.userId)) {
      return null;
    }
    let userId = state.user.userId;

    if (!(
      state.spheres &&
      state.spheres[sphereId] &&
      state.spheres[sphereId].users &&
      state.spheres[sphereId].users[userId])) {
      return null;
    }

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
      applianceId: applianceId in redux
      locationName: name of location
      locationId: locationId in redux
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
      applianceId: applianceId in redux
      locationName: name of location
      locationId: locationId in redux
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
      applianceId: applianceId in redux
      locationName: name of location
      locationId: locationId in redux
    }
 */
export const getMapOfCrownstonesInAllSpheresByCID = function(state) {
  return _getMap(state, 'crownstoneId', true);
};

/**
 * @param state
 * @returns {{}}
 *
 * THE KEY IS LOWERCASE
 * return dataType = { (ibeaconUUID + '_' + major + '_' + minor) : { details }}
 *
 * details = {
      id:  reduxStoneId
      cid: crownstoneId (smallId)
      handle: handle
      name: stone name in config
      sphereId: sphere id that contains stone
      stoneConfig: config of stone
      applianceName: name of appliance
      applianceId: applianceId in redux
      locationName: name of location
      locationId: locationId in redux
    }
 */
export const getMapOfCrownstonesInAllSpheresByIBeacon = function(state) {
  let sphereIds = Object.keys(state.spheres);
  let map = {};
  for (let i = 0; i < sphereIds.length; i++) {
    let sphereId = sphereIds[i];
    let stoneIds = Object.keys(state.spheres[sphereId].stones);
    let locations = state.spheres[sphereId].locations;
    let appliances = state.spheres[sphereId].appliances;
    let iBeaconUUID = state.spheres[sphereId].config.iBeaconUUID;

    for (let j = 0; j < stoneIds.length; j++) {
      let stoneId = stoneIds[j];
      let stoneConfig = state.spheres[sphereId].stones[stoneId].config;

      let data = {
        id: stoneId,
        cid: stoneConfig.crownstoneId,
        handle: stoneConfig.handle,
        name: stoneConfig.name,
        sphereId: sphereId,
        stoneConfig: stoneConfig,
        applianceName: stoneConfig.applianceId && appliances && appliances[stoneConfig.applianceId] ? appliances[stoneConfig.applianceId].config.name : null,
        applianceId: stoneConfig.applianceId && appliances && appliances[stoneConfig.applianceId] ? stoneConfig.applianceId : null,
        locationName: stoneConfig.locationId && locations && locations[stoneConfig.locationId] ? locations[stoneConfig.locationId].config.name : null,
        locationId: stoneConfig.locationId && locations && locations[stoneConfig.locationId] ? stoneConfig.locationId : null
      };

      let ibeaconString = iBeaconUUID + '_' + stoneConfig.iBeaconMajor + '_' + stoneConfig.iBeaconMinor;
      map[ibeaconString.toLowerCase()] = data
    }
  };

  return map;
};

function _getMap(state, requestedKey, sphereMap : boolean) {
  let sphereIds = Object.keys(state.spheres);
  let map = {};

  for (let i = 0; i < sphereIds.length; i++) {
    let sphereId = sphereIds[i];
    let stoneIds = Object.keys(state.spheres[sphereId].stones);
    let locations = state.spheres[sphereId].locations;
    let appliances = state.spheres[sphereId].appliances;

    if (sphereMap) {
      map[sphereId] = {};
    }

    for (let j = 0; j < stoneIds.length; j++) {
      let stoneId = stoneIds[j];
      let stoneConfig = state.spheres[sphereId].stones[stoneId].config;

      let data : StoneMap = {
        id: stoneId,
        cid: stoneConfig.crownstoneId,
        handle: stoneConfig.handle,
        name: stoneConfig.name,
        sphereId: sphereId,
        stoneConfig: stoneConfig,
        applianceName: stoneConfig.applianceId && appliances && appliances[stoneConfig.applianceId] ? appliances[stoneConfig.applianceId].config.name : null,
        applianceId: stoneConfig.applianceId && appliances && appliances[stoneConfig.applianceId] ? stoneConfig.applianceId : null,
        locationName: stoneConfig.locationId && locations && locations[stoneConfig.locationId] ? locations[stoneConfig.locationId].config.name : null,
        locationId: stoneConfig.locationId && locations && locations[stoneConfig.locationId] ? stoneConfig.locationId : null
      };

      if (sphereMap) {
        map[sphereId][stoneConfig[requestedKey]] = data
      }
      else {
        map[stoneConfig[requestedKey]] = data
      }
    }
  }
  return map;
}



export const prepareStoreForUser = function(store) {
  const state = store.getState();
  let spheres = state.spheres;
  let sphereIds = Object.keys(spheres);
  let actions = [];
  sphereIds.forEach((sphereId) => {
    let locations = spheres[sphereId].locations;
    let locationIds = Object.keys(locations);

    locationIds.forEach((locationId) => {
      actions.push({type: 'CLEAR_USERS_IN_LOCATION', sphereId: sphereId, locationId: locationId});
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
  if (state.app.indoorLocalizationEnabled === false) {
    return false;
  }

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
