import { CLOUD } from '../../cloud/cloudAPI'
import { getUserLevelInSphere, getCurrentDeviceId } from '../../util/dataUtil'
import { BATCH } from './storeManager'
import { LOG, LOGDebug, LOGError, LOGStore } from '../../logging/Log'

export function CloudEnhancer({ getState }) {
  return (next) => (action) => {
    LOGStore('will dispatch', action);

    // required for some of the actions
    let oldState = getState();

    // Call the next dispatch method in the middleware chain.
    let returnValue = next(action);

    // state after update
    let newState = getState();

    //LOGDebug("isNew state:", getState())
    if (action.type === BATCH && action.payload && Array.isArray(action.payload)) {
      action.payload.forEach((action) => {
        handleAction(action, returnValue, newState, oldState);
      })
    }
    else {
      handleAction(action, returnValue, newState, oldState);
    }

    // This will likely be the action itself, unless
    // a middleware further in chain changed it.
    return returnValue;
  }
}

function handleAction(action, returnValue, newState, oldState) {
  // do not sync actions that have been triggered BY the cloud sync mechanism.
  if (action.triggeredBySync === true) {
    return returnValue;
  }

  switch (action.type) {
    case 'USER_APPEND':
      break;
    case 'USER_UPDATE':
      handleUserInCloud(action, newState);
      break;
    case 'UPDATE_APPLIANCE_CONFIG':
      handleApplianceInCloud(action, newState);
      break;
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeEnter':
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeExit':
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomEnter':
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomExit':
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onNear':
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onAway':
      handleApplianceBehaviourInCloud(action, newState);
      break;


    case 'ADD_STONE':
    case 'UPDATE_STONE_CONFIG':
      handleStoneInCloud(action, newState);
      break;
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeEnter':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeExit':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomEnter':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomExit':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onNear':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onAway':
      handleStoneBehaviourInCloud(action, newState);
      break;
    case 'UPDATE_STONE_LOCATION':
      handleStoneLocationUpdateInCloud(action, newState, oldState);
      break;


    case 'UPDATE_LOCATION_CONFIG':
      handleLocationInCloud(action, newState);
      break;
    case 'UPDATE_SPHERE_CONFIG':
      handleSphereInCloud(action, newState);
      break;
    case 'UPDATE_SPHERE_USER':
      handleSphereUserInCloud(action, newState);
      break;

    case 'USER_EXIT_LOCATION':
      handleUserLocationExit(action, newState);
      break;
    case 'USER_ENTER_LOCATION':
      handleUserLocationEnter(action, newState);
      break;
  }
}


// user in this case is self, the owner of the phone
function handleUserInCloud(action, state) {
  let userId = state.user.userId;
  CLOUD.forUser(userId);
  if (action.data.picture) {
    CLOUD.uploadProfileImage(action.data.picture)
      .then((data) => {
        LOG(data)
      })
      .catch(() => {});
  }
  else if (action.data.picture === null) {
    CLOUD.removeProfileImage({background: true}).catch(() => {});
  }

  if (action.data.firstName || action.data.lastName || action.data.isNew !== undefined) {
    let data = {
      firstName: state.user.firstName,
      lastName: state.user.lastName,
      new: state.user.isNew,
      updatedAt: state.user.updatedAt
    };
    CLOUD.updateUserData(data).catch(() => {});
  }
}

function handleStoneBehaviourInCloud(action, state) {
  let sphereId = action.sphereId;
  let stoneId = action.stoneId;

  if (getUserLevelInSphere(state, sphereId) === 'admin') {
    let stoneConfig = state.spheres[sphereId].stones[stoneId].config;
    let behaviourJSON = JSON.stringify(state.spheres[sphereId].stones[stoneId].behaviour);
    let data = {
      name:        stoneConfig.name,
      address:     stoneConfig.macAddress,
      icon:        stoneConfig.icon,
      id:          stoneId,
      applianceId: stoneConfig.applianceId,
      sphereId:    sphereId,
      major:       stoneConfig.iBeaconMajor,
      minor:       stoneConfig.iBeaconMinor,
      uid:         stoneConfig.crownstoneId,
      json:        behaviourJSON,
      updatedAt:   stoneConfig.updatedAt,
    };
    CLOUD.forSphere(sphereId).updateStone(stoneId, data).catch(() => {});
  }
}

function handleStoneInCloud(action, state) {
  let sphereId = action.sphereId;
  let stoneId = action.stoneId;

  let stoneConfig = state.spheres[sphereId].stones[stoneId].config;
  let data = {
    name:        stoneConfig.name,
    address:     stoneConfig.macAddress,
    icon:        stoneConfig.icon,
    id:          stoneId,
    applianceId: stoneConfig.applianceId,
    sphereId:    sphereId,
    major:       stoneConfig.iBeaconMajor,
    minor:       stoneConfig.iBeaconMinor,
    uid:         stoneConfig.crownstoneId,
    updatedAt:   stoneConfig.updatedAt,
  };

  CLOUD.forSphere(sphereId).updateStone(stoneId, data).catch(() => {});
}

function handleStoneLocationUpdateInCloud(action, state, oldState) {
  let sphereId = action.sphereId;
  let stoneId = action.stoneId;
  let locationId = action.data.locationId;
  let updatedAt = state.spheres[sphereId].stones[stoneId].config.updatedAt;

  let prevLocationId = oldState.spheres[sphereId].stones[stoneId].config.locationId;

  if (prevLocationId === null && locationId !== null) {
    CLOUD.forStone(stoneId).updateStoneLocationLink(locationId, sphereId, updatedAt, true).catch(() => {});
  }
  else {
    CLOUD.forStone(stoneId).deleteStoneLocationLink(prevLocationId, sphereId, updatedAt, true)
      .then(() => {
        if (locationId !== null) {
          return CLOUD.forStone(stoneId).updateStoneLocationLink(locationId, sphereId, updatedAt, true);
        }
      })
      .catch(() => {});
  }
}

function handleApplianceInCloud(action, state) {
  let sphereId = action.sphereId;
  let applianceId = action.applianceId;

  let applianceConfig = state.spheres[sphereId].appliances[applianceId].config;
  let data = {
    name: applianceConfig.name,
    icon: applianceConfig.icon,
    id: applianceId,
    sphereId: sphereId,
    updatedAt: applianceConfig.updatedAt,
  };

  CLOUD.forSphere(sphereId).updateAppliance(applianceId, data).catch(() => {});
}

function handleApplianceBehaviourInCloud(action, state) {
  let sphereId = action.sphereId;
  let applianceId = action.applianceId;

  if (getUserLevelInSphere(state, sphereId) === 'admin') {
    let applianceConfig = state.spheres[sphereId].appliances[applianceId].config;
    let behaviourJSON = JSON.stringify(state.spheres[sphereId].appliances[applianceId].behaviour);
    let data = {
      id:       applianceId,
      icon:     applianceConfig.icon,
      sphereId: sphereId,
      json:     behaviourJSON,
      updatedAt: applianceConfig.updatedAt
    };
    CLOUD.forSphere(sphereId).updateAppliance(applianceId, data).catch(() => {});
  }
}

function handleLocationInCloud(action, state) {
  let sphereId = action.sphereId;
  let locationId = action.locationId;

  let locationConfig = state.spheres[sphereId].locations[locationId].config;
  let data = {
    name: locationConfig.name,
    icon: locationConfig.icon,
    id: locationId,
    sphereId: sphereId,
    updatedAt: locationConfig.updatedAt
  };

  CLOUD.forSphere(sphereId).updateLocation(locationId, data).catch(() => {});
}

function handleSphereInCloud(action, state) {
  // these are handled by the views, cloud update for these things is mandatory
  let sphereId = action.sphereId;

  let sphereConfig = state.spheres[sphereId].config;
  let data = {
    name: sphereConfig.name,
    uuid: sphereConfig.iBeaconUUID,
    meshAccessAddress: sphereConfig.meshAccessAddress,
    aiName: sphereConfig.aiName,
    aiSex: sphereConfig.aiSex,
    updatedAt: sphereConfig.updatedAt,
  };

  CLOUD.updateSphere(sphereId, data).catch(() => {});
}

function handleSphereUserInCloud(action, state) {

}

function handleUserLocationEnter(action, state) {
  let deviceId = getCurrentDeviceId(state);
  if (deviceId) {
    CLOUD.forDevice(deviceId).updateDeviceLocation(action.locationId).catch(() => {
    });
  }
}

function handleUserLocationExit(action, state) {
  let deviceId = getCurrentDeviceId(state);
  if (deviceId) {
    CLOUD.forDevice(deviceId).updateDeviceLocation(null).catch(() => {
    });
  }
}