import { CLOUD } from '../../cloud/cloudAPI'
import { getUserLevelInSphere } from '../../util/DataUtil'
import { Util } from '../../util/Util'
import { BATCH } from './storeManager'
import { LOG } from '../../logging/Log'

export function CloudEnhancer({ getState }) {
  return (next) => (action) => {
    LOG.store('will dispatch', action);

    // required for some of the actions
    let oldState = getState();

    // Call the next dispatch method in the middleware chain.
    let returnValue = next(action);

    // state after update
    let newState = getState();

    //LOG.debug("isNew state:", getState())
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
    case 'UPDATE_MESH_NETWORK_ID':
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
    case 'SET_TAP_TO_TOGGLE_CALIBRATION':
    case 'UPDATE_DEVICE_CONFIG':
      handleDeviceInCloud(action, newState);
      break;


    case "UPDATE_STONE_STATE":
      handleStoneState(action, newState);
      break;
    case "UPDATE_STONE_SWITCH_STATE":
      handleStoneState(action, newState, true);
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
        LOG.info(data)
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
      uploadLocation:    state.user.uploadLocation,
      uploadSwitchState: state.user.uploadSwitchState,
      uploadPowerUsage:  state.user.uploadPowerUsage,
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
      applianceId:       stoneConfig.applianceId,
      address:           stoneConfig.macAddress,
      icon:              stoneConfig.icon,
      id:                stoneId,
      bootloaderVersion: stoneConfig.bootloaderVersion,
      firmwareVersion:   stoneConfig.firmwareVersion,
      meshNetworkId:     stoneConfig.meshNetworkId,
      major:             stoneConfig.iBeaconMajor,
      minor:             stoneConfig.iBeaconMinor,
      name:              stoneConfig.name,
      onlyOnWhenDark:    stoneConfig.onlyOnWhenDark,
      sphereId:          sphereId,
      touchToToggle:     stoneConfig.touchToToggle,
      updatedAt:         stoneConfig.updatedAt,
      uid:               stoneConfig.crownstoneId,
      json:              behaviourJSON,
    };
    CLOUD.forSphere(sphereId).updateStone(stoneId, data).catch(() => {});
  }
}

function handleStoneInCloud(action, state) {
  let sphereId = action.sphereId;
  let stoneId = action.stoneId;

  let stoneConfig = state.spheres[sphereId].stones[stoneId].config;
  let data = {
    applianceId:       stoneConfig.applianceId,
    address:           stoneConfig.macAddress,
    icon:              stoneConfig.icon,
    id:                stoneId,
    bootloaderVersion: stoneConfig.bootloaderVersion,
    firmwareVersion:   stoneConfig.firmwareVersion,
    meshNetworkId:     stoneConfig.meshNetworkId,
    major:             stoneConfig.iBeaconMajor,
    minor:             stoneConfig.iBeaconMinor,
    name:              stoneConfig.name,
    onlyOnWhenDark:    stoneConfig.onlyOnWhenDark,
    sphereId:          sphereId,
    touchToToggle:     stoneConfig.touchToToggle,
    uid:               stoneConfig.crownstoneId,
    updatedAt:         stoneConfig.updatedAt,
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
    onlyOnWhenDark: applianceConfig.onlyOnWhenDark,
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
      onlyOnWhenDark: applianceConfig.onlyOnWhenDark,
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
    aiName: sphereConfig.aiName,
    aiSex: sphereConfig.aiSex,
    exitDelay: sphereConfig.exitDelay,
    meshAccessAddress: sphereConfig.meshAccessAddress,
    gpsLocation:{
      lat: sphereConfig.latitude,
      lng: sphereConfig.longitude,
    },
    name: sphereConfig.name,
    uuid: sphereConfig.iBeaconUUID,
    updatedAt: sphereConfig.updatedAt,
  };

  CLOUD.updateSphere(sphereId, data).catch(() => {});
}

function handleSphereUserInCloud(action, state) {

}

function handleUserLocationEnter(action, state) {
  if (state.user.uploadLocation === true) {
    let deviceId = Util.data.getCurrentDeviceId(state);
    if (deviceId) {
      CLOUD.forDevice(deviceId).updateDeviceLocation(action.locationId).catch(() => {
      });
    }
  }
}

function handleUserLocationExit(action, state) {
  if (state.user.uploadLocation === true) {
    let deviceId = Util.data.getCurrentDeviceId(state);
    if (deviceId) {
      CLOUD.forDevice(deviceId).updateDeviceLocation(null).catch(() => {
      });
    }
  }
}


function handleDeviceInCloud(action, state) {
  let deviceId = action.deviceId;
  if (!deviceId) {
    LOG.error("handleDeviceInCloud: invalid device id: ", deviceId);
    return;
  }
  let deviceConfig = state.devices[deviceId];
  let data = {
    name: deviceConfig.name,
    address: deviceConfig.address,
    description: deviceConfig.description,
    hubFunction: deviceConfig.hubFunction,
    location: state.user.uploadLocation === true ? deviceConfig.location : undefined,
    tapToToggleCalibration: deviceConfig.tapToToggleCalibration,
    updatedAt: deviceConfig.updatedAt
  };

  CLOUD.updateDevice(deviceId, data).catch(() => {});
}


function handleStoneState(action, state, pureSwitch = false) {
  let sphereId = action.sphereId;
  let stoneId = action.stoneId;

  if (state.user.uploadSwitchState === true && pureSwitch === true) {
    let stone = state.spheres[sphereId].stones[stoneId];
    let data  = {
      id:          stoneId,
      switchState: stone.state.state,
      switchStateUpdatedAt: stone.state.updatedAt,
      updatedAt:   stone.updatedAt,
    };

    CLOUD.forSphere(sphereId).updateStone(stoneId, data).catch(() => {});
  }

  if (state.user.uploadPowerUsage === true) {
    let stone = state.spheres[sphereId].stones[stoneId];
    let data  = { energy:   stone.state.currentUsage, duration: 1 };

    CLOUD.forStone(stoneId).updateUsage(data).catch(() => {});
  }
}