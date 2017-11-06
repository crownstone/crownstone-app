import { CLOUD }         from '../../cloud/cloudAPI'
import { Util }          from '../../util/Util'
import { BATCH }         from './storeManager'
import {LOG, LOGd, LOGi, LOGv, LOGe, LOGw} from '../../logging/Log'
import { BatchUploader } from "../../backgroundProcesses/BatchUploader";
import {eventBus} from "../../util/EventBus";
import {transferSchedules} from "../../cloud/transferData/transferSchedules";
import {transferUser} from "../../cloud/transferData/transferUser";
import {transferStones} from "../../cloud/transferData/transferStones";
import {transferAppliances} from "../../cloud/transferData/transferAppliances";
import {transferSpheres} from "../../cloud/transferData/transferSpheres";
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {LOG_LEVEL} from "../../logging/LogLevels";
import {MapProvider} from "../../backgroundProcesses/MapProvider";
import {transferLocations} from "../../cloud/transferData/transferLocations";

export function CloudEnhancer({ getState }) {
  return (next) => (action) => {
    let highestLogLevel = 0;
    if (action.type === BATCH && action.payload && Array.isArray(action.payload)) {
      for (let i = 0; i < action.payload.length; i++) {
        if (action.payload[i].__logLevel) { highestLogLevel = Math.max(action.payload[i].__logLevel); }
      }
    }
    else {
      highestLogLevel = action.__logLevel;
    }

    switch (highestLogLevel) {
      case LOG_LEVEL.verbose:
        LOGv.store('will dispatch', action); break;
      case LOG_LEVEL.debug:
        LOGd.store('will dispatch', action); break;
      case LOG_LEVEL.info:
        LOGi.store('will dispatch', action); break;
      case LOG_LEVEL.warning:
        LOGw.store('will dispatch', action); break;
      case LOG_LEVEL.error:
        LOGe.store('will dispatch', action); break;
      case LOG_LEVEL.none:
        break;
      default:
        LOG.store('will dispatch', action);
    }

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
  if (action.triggeredBySync === true || action.__test === true) {
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
      handleStoneState(action, newState, oldState);
      break;
    case "UPDATE_STONE_SWITCH_STATE":
      handleStoneState(action, newState, oldState, true);
      break;

    case "ADD_STONE_SCHEDULE":
      handleStoneScheduleAdd(action, newState); break;
    case "UPDATE_STONE_SCHEDULE":
      handleStoneScheduleUpdate(action, newState); break;
    case "REMOVE_STONE_SCHEDULE":
      handleStoneScheduleRemoval(action, newState, oldState); break;

    case "REMOVE_MESSAGE":
      handleMessageRemove(action, newState, oldState); break;
    case "I_RECEIVED_MESSAGE":
      handleMessageReceived(action, newState); break;
    case "I_READ_MESSAGE":
      handleMessageRead(action, newState); break;

    case "ADD_INSTALLATION":
    case "UPDATE_INSTALLATION_CONFIG":
      handleInstallation(action, newState);
      break;

    case "SET_SPHERE_STATE":
      handleSphereStateOnDevice(action, newState);
      break;


  }
}


// user in this case is self, the owner of the phone
function handleUserInCloud(action, state) {
  if (action.data.picture) {
    // in case the user has a pending delete profile picture request, we will finish this immediately so a new
    // picture will not be deleted.
    eventBus.emit("submitCloudEvent",{type: 'FINISHED_SPECIAL_USER', id: 'removeProfilePicture' });
    eventBus.emit("submitCloudEvent", {
      type: 'CLOUD_EVENT_SPECIAL_USER',
      id: 'uploadProfilePicture',
      specialType: 'uploadProfilePicture'
    });
  }
  else if (action.data.picture === null) {
    eventBus.emit("submitCloudEvent",{type: 'FINISHED_SPECIAL_USER', id: 'uploadProfilePicture' });
    eventBus.emit("submitCloudEvent", {
      type: 'CLOUD_EVENT_SPECIAL_USER',
      id: 'removeProfilePicture',
      specialType: 'removeProfilePicture'
    });
  }

  transferUser.updateOnCloud({localData: state.user, cloudId: state.user.userId})
}

function handleStoneBehaviourInCloud(action, state) {
  if (Permissions.inSphere(action.sphereId).setBehaviourInCloud) {
    _handleStone(action, state);
  }
}

function handleStoneInCloud(action, state) {
  _handleStone(action, state);
}

function _handleStone(action, state) {
  let sphere = state.spheres[action.sphereId];
  let stone = sphere.stones[action.stoneId];

  let localDataForCloud = {...stone};
  if (stone.config.applianceId) { localDataForCloud.config['cloudApplianceId'] = MapProvider.local2cloudMap.appliances[stone.config.applianceId] || stone.config.applianceId; }
  else                          { localDataForCloud.config['cloudApplianceId'] = null; }

  if (stone.config.locationId)  { localDataForCloud.config['cloudLocationId']  = MapProvider.local2cloudMap.locations[stone.config.locationId]   || stone.config.locationId;  }
  else                          { localDataForCloud.config['cloudLocationId'] = null; }


  transferStones.updateOnCloud({
    localId:       action.stoneId,
    localData:     localDataForCloud,
    localSphereId: action.sphereId,
    cloudSphereId: sphere.config.cloudId || action.sphereId, // we used to have the same ids locally and in the cloud.
    cloudId:       stone.config.cloudId  || action.stoneId,
  }).catch(() => {});
}

function handleStoneLocationUpdateInCloud(action, state, oldState) {
  let sphereId   = action.sphereId;
  let stoneId    = action.stoneId;
  let locationId = action.data.locationId;
  let updatedAt  = state.spheres[sphereId].stones[stoneId].config.updatedAt;

  let data = { locationId: MapProvider.local2cloudMap.locations[locationId] || locationId };
  CLOUD.forSphere(sphereId).updateStone(stoneId, data).catch(() => {});

  let prevLocationId = oldState.spheres[sphereId] && oldState.spheres[sphereId].stones[stoneId] && oldState.spheres[sphereId].stones[stoneId].config.locationId || null;

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
  let sphere   = state.spheres[action.sphereId];
  let appliance = sphere.appliances[action.applianceId];

  transferAppliances.updateOnCloud({
    localId:       action.stoneId,
    localData:     appliance,
    localSphereId: action.sphereId,
    cloudSphereId: sphere.config.cloudId     || action.sphereId, // we used to have the same ids locally and in the cloud.
    cloudId:       appliance.config.cloudId  || action.applianceId,
  }).catch(() => {});
}

function handleApplianceBehaviourInCloud(action, state) {
  let sphere    = state.spheres[action.sphereId];
  let appliance = sphere.appliances[action.applianceId];

  if (Permissions.inSphere(action.sphereId).setBehaviourInCloud) {
    transferAppliances.updateOnCloud({
      localId:       action.stoneId,
      localData:     appliance,
      localSphereId: action.sphereId,
      cloudSphereId: sphere.config.cloudId       || action.sphereId, // we used to have the same ids locally and in the cloud.
      cloudId:       appliance.config.cloudId    || action.applianceId,
    }).catch(() => {});
  }
}

function handleLocationInCloud(action, state) {
  let sphere   = state.spheres[action.sphereId];
  let location = sphere.locations[action.locationId];

  transferLocations.updateOnCloud({
    localId:       action.stoneId,
    localData:     location,
    localSphereId: action.sphereId,
    cloudSphereId: sphere.config.cloudId    || action.sphereId, // we used to have the same ids locally and in the cloud.
    cloudId:       location.config.cloudId  || action.locationId,
  }).catch(() => {});
}

function handleSphereInCloud(action, state) {
  let sphere = state.spheres[action.sphereId];

  transferSpheres.updateOnCloud({
    localData: sphere,
    cloudId:   sphere.config.cloudId || action.sphereId,
  }).catch(() => {})
}

function handleSphereUserInCloud(action, state) {

}

function handleSphereStateOnDevice(action, state) {
  let deviceId = Util.data.getCurrentDeviceId(state);
  if (deviceId) {
    if (state.user.uploadLocation === true) {
      if (action.data.present === true) {
        CLOUD.forDevice(deviceId).updateDeviceSphere(action.sphereId).catch(() => {});
      }
      else {
        CLOUD.forDevice(deviceId).updateDeviceSphere(null).catch(() => {});
        CLOUD.forDevice(deviceId).updateDeviceLocation(null).catch(() => {});
      }
    }
    else {
      CLOUD.forDevice(deviceId).updateDeviceSphere(null).catch(() => {});
      CLOUD.forDevice(deviceId).updateDeviceLocation(null).catch(() => {});
    }
  }
}
function handleUserLocationEnter(action, state) {
  if (state.user.uploadLocation === true) {
    let deviceId = Util.data.getCurrentDeviceId(state);
    if (deviceId) {
      CLOUD.forDevice(deviceId).updateDeviceLocation(action.locationId).catch(() => { });
      CLOUD.forDevice(deviceId).updateDeviceSphere(action.sphereId).catch(() => {});
    }
  }
}

function handleUserLocationExit(action, state) {
  // if (state.user.uploadLocation === true) {
  //   let deviceId = Util.data.getCurrentDeviceId(state);
  //   if (deviceId) {
  //     CLOUD.forDevice(deviceId).updateDeviceLocation(null).catch(() => { });
  //   }
  // }
}


function handleStoneState(action, state, oldState, pureSwitch = false) {
  let sphereId = action.sphereId;
  let stoneId = action.stoneId;

  if (state.user.uploadSwitchState === true && pureSwitch === true) {
    let stone = state.spheres[sphereId].stones[stoneId];
    let data  = {
      switchState: stone.state.state,
      updatedAt:   stone.updatedAt,
    };

    CLOUD.forSphere(sphereId).updateStone(stoneId, data).catch(() => {});
  }

  if (state.user.uploadPowerUsage === true && state.user.uploadHighFrequencyPowerUsage === true) {
    let stone = state.spheres[sphereId].stones[stoneId];
    let data  = { power: stone.state.currentUsage, timestamp: action.updatedAt };

    let dayIndex = Util.getDateFormat(action.updatedAt);

    // get the index the new item will have. This is used to mark them as synced. If there is no previous item, it is 0.
    let oldStone = oldState.spheres[sphereId] && oldState.spheres[sphereId].stones[stoneId] || null;
    let indexOfNewItem = oldStone && oldStone.powerUsage[dayIndex] && oldStone.powerUsage[dayIndex].data.length || 0;

    if (stone.config.applianceId) {
      data['applianceId'] = MapProvider.local2cloudMap.appliances[stone.config.applianceId] || stone.config.applianceId;
    }
    BatchUploader.addPowerData(dayIndex, sphereId, stoneId, indexOfNewItem, data);
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

  if (state.user.uploadDeviceDetails) {
    data["os"] = deviceConfig.os;
    data["deviceType"] = deviceConfig.deviceType;
    data["model"] = deviceConfig.model;
    data["userAgent"] = deviceConfig.userAgent;
    data["locale"] = deviceConfig.locale;
  }

  CLOUD.updateDevice(deviceId, data).catch(() => {});
}



function handleInstallation(action, state) {
  let installationId = action.installationId;
  if (!installationId) {
    LOG.error("handleDeviceInCloud: invalid installationId: ", installationId);
    return;
  }
  let installationConfig = state.installations[installationId];
  let data = {
    deviceToken: installationConfig.deviceToken,
    updatedAt: installationConfig.updatedAt
  };

  CLOUD.updateInstallation(installationId, data).catch(() => {});
}

function handleMessageReceived(action, state) {
  let message = state.spheres[action.sphereId].messages[action.messageId];
  eventBus.emit("submitCloudEvent", {
    type: 'CLOUD_EVENT_SPECIAL_MESSAGES',
    sphereId: action.sphereId,
    id: action.messageId + '_' + 'receivedMessage',
    localId: action.messageId,
    cloudId: message.config.cloudId,
    specialType: 'receivedMessage'
  });
}

function handleMessageRead(action, state) {
  let message = state.spheres[action.sphereId].messages[action.messageId];
  eventBus.emit("submitCloudEvent", {
    type: 'CLOUD_EVENT_SPECIAL_MESSAGES',
    sphereId: action.sphereId,
    id: action.messageId + '_' + 'readMessage',
    localId: action.messageId,
    cloudId: message.config.cloudId,
    specialType: 'readMessage'
  })
}

function handleMessageRemove(action, state, oldState) {
  let message = oldState.spheres[action.sphereId].messages[action.messageId];
  if (!message.config.cloudId) {
    return;
  }

  // if user is sender, delete in cloud.
  if (message.config.senderId === oldState.user.userId) {
    eventBus.emit("submitCloudEvent", {
      type: 'CLOUD_EVENT_REMOVE_MESSAGES',
      sphereId: action.sphereId,
      id: action.messageId,
      localId: action.messageId,
      cloudId: message.config.cloudId
    });
  }
}


function handleStoneScheduleAdd(action, state) {
  let sphere = state.spheres[action.sphereId];
  let stone = sphere.stones[action.stoneId];
  let newSchedule = stone.schedules[action.scheduleId];

  let actions = [];

  let payload = {
    localId: action.scheduleId,
    localStoneId: action.stoneId,
    localSphereId: action.sphereId,
    localData: newSchedule,
    cloudSphereId: sphere.config.cloudId || action.sphereId,
    cloudStoneId: stone.config.cloudId || action.stoneId,
  };

  transferSchedules.createOnCloud(actions, payload)
    .then(() => {
      eventBus.emit("submitCloudEvent", actions);
    }).catch((err) => {});

}


function handleStoneScheduleUpdate(action, state) {
  let sphere = state.spheres[action.sphereId];
  let stone = sphere.stones[action.stoneId];
  let newSchedule = stone.schedules[action.scheduleId];

  if (!newSchedule.cloudId) {
    return handleStoneScheduleAdd(action, state);
  }

  let payload = {
    localId: action.scheduleId,
    localData: newSchedule,
    cloudSphereId: sphere.config.cloudId || action.sphereId,
    cloudStoneId: stone.config.cloudId || action.stoneId,
    cloudId: newSchedule.cloudId,
  };

  transferSchedules.updateOnCloud(payload).catch(() => {});

}

function handleStoneScheduleRemoval(action, state, oldState) {
  let oldSchedule = oldState.spheres[action.sphereId].stones[action.stoneId].schedules[action.scheduleId];

  let payload = {
    type: 'CLOUD_EVENT_REMOVE_SCHEDULES',
    sphereId: action.sphereId,
    stoneId: action.stoneId,
    id: action.scheduleId,
    localId: action.scheduleId,
    cloudId: oldSchedule && oldSchedule.cloudId || null, // if old does not exist, this is a create event which does not have a cloudId
  };

  eventBus.emit("submitCloudEvent", payload);
}