import { CLOUD }         from '../../cloud/cloudAPI'
import { Util }          from '../../util/Util'
import { LOGd, LOGi, LOGv, LOGe, LOGw} from '../../logging/Log'
import { transferUser} from "../../cloud/transferData/transferUser";
import { transferStones} from "../../cloud/transferData/transferStones";
import { transferSpheres} from "../../cloud/transferData/transferSpheres";
import { Permissions} from "../../backgroundProcesses/PermissionManager";
import { LOG_LEVEL} from "../../logging/LogLevels";
import { MapProvider} from "../../backgroundProcesses/MapProvider";
import { transferLocations} from "../../cloud/transferData/transferLocations";
import { core } from "../../core";
import { BATCH } from "./reducers/BatchReducer";
import { transferBehaviours } from "../../cloud/transferData/transferBehaviours";
import { PICTURE_GALLERY_TYPES } from "../../views/scenesViews/ScenePictureGallery";
import { transferScenes } from "../../cloud/transferData/transferScenes";

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
        LOGi.store('will dispatch', action);
    }

    // required for some of the actions
    let oldState = getState();

    // Call the next dispatch method in the middleware chain.
    let returnValue = next(action);

    // state after update
    let newState = getState();

    //LOGd.info("isNew state:", getState())
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
  if (action.triggeredBySync === true || action.__test === true || action.__purelyLocal === true || action.__noEvents === true) {
    return returnValue;
  }

  switch (action.type) {
    case 'USER_APPEND':
      break;
    case 'USER_UPDATE':
      handleUserInCloud(action, newState);
      break;


    case 'ADD_SCENE':
    case 'UPDATE_SCENE':
      handleSceneInCloud(action, newState);
      break;
    case 'REMOVE_SCENE':
      removeSceneInCloud(action, newState);
      break;

    case 'ADD_STONE':
    case 'UPDATE_STONE_CONFIG':
    // case 'UPDATE_MESH_NETWORK_ID':
      handleStoneInCloud(action, newState);
      break;
    case 'UPDATE_STONE_LOCATION':
      handleStoneLocationUpdateInCloud(action, newState, oldState);
      break;
    case 'UPDATE_LOCATION_CONFIG':
      handleLocationInCloud(action, newState);
      break;
    case 'SET_SPHERE_GPS_COORDINATES':
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
    case 'UPDATE_DEVICE_CONFIG':
      handleDeviceInCloud(action, newState);
      break;

    case 'ADD_STONE_RULE':
    case 'UPDATE_STONE_RULE':
    case 'MARK_STONE_RULE_FOR_DELETION':
      handleBehaviourInCloud(action, newState);
      break;
    case 'REMOVE_STONE_RULE':
      removeBehaviourInCloud(action, newState, oldState);
      break;
    case 'REMOVE_ALL_RULES_OF_STONE':
      removeAllBehavioursForStoneInCloud(action, newState);
      break;

    case "UPDATE_STONE_STATE":
      handleStoneState(action, newState, oldState);
      break;
    case "UPDATE_STONE_SWITCH_STATE":
      handleStoneState(action, newState, oldState, true);
      break;

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
    core.eventBus.emit("submitCloudEvent",{type: 'FINISHED_SPECIAL_USER', id: 'removeProfilePicture' });
    core.eventBus.emit("submitCloudEvent", {
      type: 'CLOUD_EVENT_SPECIAL_USER',
      id: 'uploadProfilePicture',
      specialType: 'uploadProfilePicture'
    });
  }
  else if (action.data.picture === null) {
    core.eventBus.emit("submitCloudEvent",{type: 'FINISHED_SPECIAL_USER', id: 'uploadProfilePicture' });
    core.eventBus.emit("submitCloudEvent", {
      type: 'CLOUD_EVENT_SPECIAL_USER',
      id: 'removeProfilePicture',
      specialType: 'removeProfilePicture'
    });
  }

  transferUser.updateOnCloud({localData: state.user, cloudId: state.user.userId})
}



function handleStoneInCloud(action, state) {
  _handleStone(action, state);
}

function _handleStone(action, state) {
  if (!Permissions.inSphere(action.sphereId).canUpdateCrownstone) { return; }

  let sphere = state.spheres[action.sphereId];
  let stone  = sphere.stones[action.stoneId];

  let localDataForCloud = {...stone};

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

  if (MapProvider.local2cloudMap.locations[locationId] === undefined) {
    // console.log("NO CLOUD ID FOR THIS ENTRY");
    // the location is not synced to the cloud yet... We should wait for a sync to properly handle this.
    return;
  }

  let data = { locationId: MapProvider.local2cloudMap.locations[locationId] || locationId };
  CLOUD.forSphere(sphereId).updateStone(stoneId, data).catch(() => {});
}


function handleLocationInCloud(action, state) {
  if (action.data.picture) {
    // in case the user has a pending delete location picture request, we will finish this immediately so a new
    // picture will not be deleted.
    core.eventBus.emit("submitCloudEvent",{type: 'FINISHED_SPECIAL_LOCATIONS', id: 'removeLocationPicture' + action.locationId });
    core.eventBus.emit("submitCloudEvent", {
      type: 'CLOUD_EVENT_SPECIAL_LOCATIONS',
      id: 'uploadLocationPicture' + action.locationId,
      localId: action.locationId,
      localSphereId: action.sphereId,
      specialType: 'uploadLocationPicture'
    });
  }
  else if (action.data.picture === null) {
    // in case the user has a pending upload location picture request, we will finish this immediately so a new
    // picture will not be uploaded.
    core.eventBus.emit("submitCloudEvent",{type: 'FINISHED_SPECIAL_LOCATIONS', id: 'uploadLocationPicture' + action.locationId });
    core.eventBus.emit("submitCloudEvent", {
      type: 'CLOUD_EVENT_SPECIAL_LOCATIONS',
      id: 'removeLocationPicture'+ action.locationId,
      localId: action.locationId,
      localSphereId: action.sphereId,
      specialType: 'removeLocationPicture'
    });
  }


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



function handleSceneInCloud(action, state) {
  let existingSphere = state.spheres[action.sphereId];
  if (!existingSphere) { return }
  let existingScene = existingSphere.scenes[action.sceneId];

  if (action.data.picture && action.data.pictureSource === PICTURE_GALLERY_TYPES.CUSTOM) {
    // in case the user has a pending delete scene picture request, we will finish this immediately so a new
    // picture will not be deleted.
    core.eventBus.emit("submitCloudEvent",{type: 'FINISHED_SPECIAL_SCENES', id: 'removeScenePicture' + action.sceneId });
    core.eventBus.emit("submitCloudEvent", {
      type: 'CLOUD_EVENT_SPECIAL_SCENES',
      id: 'uploadScenePicture' + action.sceneId,
      localId: action.sceneId,
      localSphereId: action.sphereId,
      specialType: 'uploadScenePicture'
    });
  }
  else if (existingScene &&
           existingScene.pictureSource === PICTURE_GALLERY_TYPES.CUSTOM &&
           (action.data.picture === null || action.data.pictureSource === PICTURE_GALLERY_TYPES.STOCK)
  ) {
    // in case the user has a pending upload scene picture request, we will finish this immediately so a new
    // picture will not be uploaded.
    // This is only in the case of an existing scene and picture.
    core.eventBus.emit("submitCloudEvent",{type: 'FINISHED_SPECIAL_SCENES', id: 'uploadScenePicture' + action.sceneId });
    core.eventBus.emit("submitCloudEvent", {
      type: 'CLOUD_EVENT_SPECIAL_SCENES',
      id: 'removeScenePicture'+ action.sceneId,
      localId: action.sceneId,
      localSphereId: action.sphereId,
      specialType: 'removeScenePicture'
    });
  }


  let sphere = state.spheres[action.sphereId];

  if (action.type === "ADD_SCENE") {
    let actions = [];
    transferScenes.createOnCloud(actions, {
      localId: action.sceneId,
      localData: action.data,
      localSphereId: action.sphereId,
      cloudSphereId: sphere.config.cloudId || action.sphereId, // we used to have the same ids locally and in the cloud.
    })
      .then(() => {
        if (actions.length > 0) {
          core.store.batchDispatch(actions);
        }
      })
      .catch(() => {});
  }
  else {
    let scene = sphere.scenes[action.sceneId];
    transferScenes.updateOnCloud({
      localId: action.sceneId,
      localData: scene,
      localSphereId: action.sphereId,
      cloudSphereId: sphere.config.cloudId || action.sphereId, // we used to have the same ids locally and in the cloud.
      cloudId: scene.cloudId || action.sceneId,
    }).catch(() => {
    });
  }
}


function removeSceneInCloud(action, state) {
  let existingSphere = state.spheres[action.sphereId];
  if (existingSphere) {
    let existingScene = existingSphere.scenes[action.sceneId];

    if (existingScene && existingScene.cloudId) {
      core.eventBus.emit("submitCloudEvent", {
        type: 'CLOUD_EVENT_REMOVE_SCENES',
        id: 'remove'+ action.sceneId,
        localId: action.sceneId,
        localSphereId: action.sphereId,
        cloudId: existingScene.cloudId,
      });
    }
  }
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
        CLOUD.forDevice(deviceId).inSphere(action.sphereId).catch(() => {});
      }
      else {
        CLOUD.forDevice(deviceId).exitSphere(action.sphereId).catch(() => { });  // will also clear location
      }
    }
    else {
      CLOUD.forDevice(deviceId).exitSphere("*").catch(() => { });  // will also clear location
    }
  }
}


function handleUserLocationEnter(action, state) {
  // only update the cloud if this is from the ACTIVE user
  if (action.data.userId === state.user.userId) {
    if (state.user.uploadLocation === true) {
      let deviceId = Util.data.getCurrentDeviceId(state);
      if (deviceId) {
        CLOUD.forDevice(deviceId).inLocation(action.sphereId, action.locationId).catch(() => {});
      }
    }
  }
}

function handleUserLocationExit(action, state) {
  // we do not need to do anything here since the user leaving is the user entering another room. On sphere exit, both are cleared.
}


function handleStoneState(action, state, oldState, pureSwitch = false) {
  let sphereId = action.sphereId;
  let stoneId = action.stoneId;

  if (state.user.uploadSwitchState === true && pureSwitch === true) {
    let stone = state.spheres[sphereId].stones[stoneId];

    CLOUD.forStone(stoneId).updateStoneSwitchState(stone.state.state).catch(() => {});
  }
}

function removeBehaviourInCloud(action, state, oldState) {
  let sphereId = action.sphereId;
  let stoneId = action.stoneId;
  let ruleId = action.ruleId;

  let sphere = oldState.spheres[sphereId];
  if (!sphere) { return }
  let stone = sphere.stones[stoneId];
  if (!stone) { return }
  let rule = stone.rules[ruleId];
  if (!rule) { return }

  if (rule.cloudId !== undefined && rule.cloudId !== null) {
    core.eventBus.emit("submitCloudEvent", {
      type: 'CLOUD_EVENT_REMOVE_BEHAVIOURS',
      id: 'remove'+ action.ruleId,
      localId: action.ruleId,
      localSphereId: action.sphereId,
      cloudId: rule.cloudId,
    });
  }
}

function removeAllBehavioursForStoneInCloud(action, state) {
  let stoneId = action.stoneId;
  CLOUD.forStone(stoneId).deleteAllBehaviours();
}

function handleBehaviourInCloud(action, state) {
  let sphereId = action.sphereId;
  let stoneId = action.stoneId;
  let ruleId = action.ruleId;

  let sphere = state.spheres[sphereId];
  if (!sphere) { return }
  let stone = sphere.stones[stoneId];
  if (!stone) { return }
  let rule = stone.rules[ruleId];
  if (!rule) { return }

  if (rule.cloudId !== null) {
    transferBehaviours.updateOnCloud({
      localId: ruleId,
      localData: rule,
      cloudStoneId: stone.config.cloudId,
      cloudSphereId: sphere.config.cloudId,
      cloudId: rule.cloudId
    })
  }
  else {
    if (action.type === "ADD_STONE_RULE") {
      let actions = [];
      transferBehaviours.createOnCloud(actions, {
        localId: ruleId,
        localData: rule,
        localSphereId: sphereId,
        localStoneId: stoneId,
        cloudStoneId: stone.config.cloudId,
        cloudSphereId: sphere.config.cloudId,
      })
        .then(() => {
          core.store.batchDispatch(actions);
        })
        .catch((err) => {
          console.log("Error handleBehaviourInCloud",err)
        })
    }
  }
}

function handleDeviceInCloud(action, state) {
  let deviceId = action.deviceId;
  if (!deviceId) {
    LOGe.store("handleDeviceInCloud: invalid device id: ", deviceId);
    return;
  }  
  let deviceConfig = state.devices[deviceId];
  let data = {
    name: deviceConfig.name,
    address: deviceConfig.address,
    description: deviceConfig.description,
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
    LOGe.store("handleDeviceInCloud: invalid installationId: ", installationId);
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
  core.eventBus.emit("submitCloudEvent", {
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
  core.eventBus.emit("submitCloudEvent", {
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
    core.eventBus.emit("submitCloudEvent", {
      type: 'CLOUD_EVENT_REMOVE_MESSAGES',
      sphereId: action.sphereId,
      id: action.messageId,
      localId: action.messageId,
      cloudId: message.config.cloudId
    });
  }
}

