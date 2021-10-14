
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
  return _getMap(state, 'uid', true);
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
        cid: stoneConfig.uid,
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
        cid: stoneConfig.uid,
        handle: stoneConfig.handle,
        name: stoneConfig.name,
        sphereId: sphereId,
        stone: state.spheres[sphereId].stones[stoneId],
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
