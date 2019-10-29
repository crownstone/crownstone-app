import { AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION } from '../ExternalConfig'
import { LOGe } from '../logging/Log'

import { KEY_TYPES, STONE_TYPES } from "../Enums";

import DeviceInfo from 'react-native-device-info';
import { core } from "../core";
import { FileUtil } from "./FileUtil";


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
      LOGe.info("DataUtil: Trying to call method on all stones in sphere but I cannot find stones in this sphere (or the sphere itself)");
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

  getStone(sphereId, stoneId) {
    let state = core.store.getState();
    let sphere = state.spheres[sphereId];
    if (!sphere) return null
    let stone = sphere.stones[stoneId];
    return stone || null;
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

  getReferenceId: function(state) {
    let sphereIds = Object.keys(state.spheres);
    let activeSphereId = state.app.activeSphere;
    if (activeSphereId && state.spheres[activeSphereId] && state.spheres[activeSphereId].state.present) {
      return activeSphereId;
    }

    for (let i = 0; i < sphereIds.length; i++ ) {
      if (state.spheres[sphereIds[i]].state.present === true) {
        return sphereIds[i];
      }
    }

    if (sphereIds.length > 0) {
      return sphereIds[0];
    }

    return 'unknown';
  },

  getStonesInLocation: function(state : any, sphereId : string, locationId?) : object {
    let filteredStones = {};
    if (sphereId !== undefined) {
      let stones = state.spheres[sphereId].stones;
      let stoneIds = Object.keys(stones);
      stoneIds.forEach((stoneId) => {
        if (stones[stoneId].config.locationId === locationId || locationId === undefined) {
          filteredStones[stoneId] = stones[stoneId];
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



  getLocationFromStone: function(sphere, stone) {
    if (stone.config.locationId && sphere.locations[stone.config.locationId]) {
      return sphere.locations[stone.config.locationId];
    }
    else {
      return null;
    }
  },
  getLocationIdFromStone: function(sphereId, stoneId) {
    let stone = DataUtil.getStone(sphereId, stoneId);
    return stone.config.locationId;
  },

  getUserLocations(state, userId) {
    let presentSphereMap = {};

    // first we determine in which sphere we are:
    let sphereIds = Object.keys(state.spheres);

    for (let i = 0; i < sphereIds.length; i++) {
      if (state.spheres[sphereIds[i]].state.present === true) {
        presentSphereMap[sphereIds[i]] = DataUtil.getUserLocationIdInSphere(state, sphereIds[i], userId);
      }
    }

    return presentSphereMap;
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
    let sphere = state.spheres[sphereId];
    if (!sphere) { return false }

    let stones = sphere.stones;
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


  getStoneName: function(sphereId, stoneId) {
    let state = core.store.getState();
    let sphere = state.spheres[sphereId];
    if (!sphere) { return ""; }
    let stone = sphere.stones[stoneId];
    if (!stone) { return ""; }
    return stone.config.name;
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


  getAiName: function(state, sphereId) : string {
    if (sphereId) {
      if (!state.spheres[sphereId].config.aiSex) {
        return state.spheres[sphereId].config.aiName || 'AI';
      }
      return state.spheres[sphereId].config.aiName;
    }
    else {
      return 'AI';
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

  getLayoutDataRooms: function(state, sphereId) {
    let initialPositions = {};
    let sphere = state.spheres[sphereId];
    let rooms = sphere.locations;

    let roomIdArray = Object.keys(rooms).sort();
    let usePhysics = false;

    for (let i = 0; i < roomIdArray.length; i++) {
      let room = rooms[roomIdArray[i]];
      initialPositions[roomIdArray[i]] = {x: room.layout.x, y: room.layout.y};
      if (room.layout.setOnThisDevice === false) {
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

    if (state.spheres[sphereId].users[userId]) {
      return state.spheres[sphereId].users[userId].accessLevel;
    }
  },


  verifyDatabase(includeStones : boolean) {
    let state = core.store.getState();

    // Catch a broken sphere.
    let sphereIds = Object.keys(state.spheres);
    for (let i = 0; i < sphereIds.length; i++) {
      let sphere = state.spheres[sphereIds[i]];
      if (DataUtil.verifyDatabaseSphere(sphere) === false) {
        return false;
      }

      if (includeStones === true) {
        if (DataUtil.verifyDatabaseStonesInSphere(sphere) === false) {
          return false;
        }
      }
    }
    return true;
  },

  verifyPicturesInDatabase(state) {
    let spheres = state.spheres;
    let pictures = [];
    if (state.user.picture) {
      pictures.push({picturePath: state.user.picture, actionToClean: {type:"USER_REPAIR_PICTURE"}});
    }
    Object.keys(spheres).forEach((sphereId) => {
      let locations = spheres[sphereId].locations;
      let sphereUsers = spheres[sphereId].users;

      Object.keys(locations).forEach((locationId) => {
        if (locations[locationId].config.picture) {
          pictures.push({picturePath: locations[locationId].config.picture, actionToClean: {type:"LOCATION_REPAIR_PICTURE", sphereId: sphereId, locationId: locationId}})
        }
      });
      Object.keys(sphereUsers).forEach((userId) => {
        if (sphereUsers[userId].picture) {
          pictures.push({picturePath: sphereUsers[userId].picture, actionToClean: {type:"SPHERE_USER_REPAIR_PICTURE", sphereId: sphereId, userId: userId}})
        }
      });
    })


    FileUtil.index()
      .then((items) => {
        let itemsMap = {};
        items.forEach((item) => { itemsMap['file://' + item.path] = true; })
        let actions = [];
        pictures.forEach((pictureData) => {
          if (itemsMap[pictureData.picturePath] !== true) {
            actions.push(pictureData.actionToClean);
          }
        })

        if (actions.length > 0) {
          core.store.batchDispatch(actions);
        }
      })

  },

  verifyDatabaseSphere(sphere) {
    if (sphere.keys) {
      Object.keys(sphere.keys).forEach((keyId) => {
        let key = sphere.keys[keyId];
        if (key.ttl === 0) {
          if (!(key.keyType === KEY_TYPES.ADMIN_KEY ||key.keyType === KEY_TYPES.MEMBER_KEY || key.keyType === KEY_TYPES.BASIC_KEY)) {
            return false;
          }
        }
      })
    }

    if (!sphere.config.iBeaconUUID) { return false; }

    return true;
  },

  verifyDatabaseStonesInSphere(sphere) {
    let stoneIds = Object.keys(sphere.stones);
    for (let i = 0; i < stoneIds.length; i++) {
      let stone = sphere.stones[stoneIds[i]];
      if (!stone.config.iBeaconMajor ||
          !stone.config.iBeaconMinor ||
          !stone.config.macAddress) {
        return false;
      }
    }
    return true;
  }
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
  if (!locationId || !sphereId) {
    return users;
  }

  if (!(state && state.spheres && state.spheres[sphereId] && state.spheres[sphereId].locations && state.spheres[sphereId].locations[locationId])) {
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
 * return dataType = { localStoneId: details }
 *
 * details = {
      id:  reduxStoneId
      cid: crownstoneId (smallId)
      handle: handle
      name: stone name in config
      sphereId: sphere id that contains stone
      stoneConfig: config of stone
      locationName: name of location
      locationId: locationId in redux
    }
 */
export const getMapOfCrownstonesInAllSpheresByStoneId = function(state) {
  return _getMap(state, 'STONE_ID', false);
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
        locationName: stoneConfig.locationId && locations && locations[stoneConfig.locationId] ? locations[stoneConfig.locationId].config.name : null,
        locationId: stoneConfig.locationId && locations && locations[stoneConfig.locationId] ? stoneConfig.locationId : null
      };

      let ibeaconString = iBeaconUUID + '_' + stoneConfig.iBeaconMajor + '_' + stoneConfig.iBeaconMinor;
      map[ibeaconString.toLowerCase()] = data;
    }
  }
  return map;
};

function _getMap(state, requestedKey, sphereMap : boolean) {
  let sphereIds = Object.keys(state.spheres);
  let map = {};

  for (let i = 0; i < sphereIds.length; i++) {
    let sphereId = sphereIds[i];
    let stoneIds = Object.keys(state.spheres[sphereId].stones);
    let locations = state.spheres[sphereId].locations;

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
        locationName: stoneConfig.locationId && locations && locations[stoneConfig.locationId] ? locations[stoneConfig.locationId].config.name : null,
        locationId: stoneConfig.locationId && locations && locations[stoneConfig.locationId] ? stoneConfig.locationId : null
      };

      if (requestedKey === "STONE_ID") {
        if (sphereMap) {
          map[sphereId][stoneId] = data;
        }
        else {
          map[stoneId] = data;
        }
      }
      else {
        if (stoneConfig[requestedKey]) {
          if (sphereMap) {
            map[sphereId][stoneConfig[requestedKey]] = data;
          }
          else {
            map[stoneConfig[requestedKey]] = data;
          }
        }
      }
    }
  }
  return map;
}



export const prepareStoreForUser = function() {
  const state = core.store.getState();
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
    });
  });

  core.store.batchDispatch(actions);
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
