import { CLOUD } from '../../cloud/cloudAPI'
import { getMyLevelInSphere } from '../../util/dataUtil'
import { BATCH } from './storeManager'
import { LOG } from '../../logging/Log'

export function CloudEnhancer({ getState }) {
  return (next) => (action) => {
    LOG('will dispatch', action);

    // Call the next dispatch method in the middleware chain.
    let returnValue = next(action);

    LOG("new state:", getState())
    if (action.type === BATCH && action.payload && Array.isArray(action.payload)) {
      action.payload.forEach((action) => {
        handleAction(action, returnValue, getState);
      })
    }
    else {
      handleAction(action, returnValue, getState);
    }

    // This will likely be the action itself, unless
    // a middleware further in chain changed it.
    return returnValue
  }
}

function handleAction(action, returnValue, getState) {
  // do not sync actions that have been triggered BY the cloud sync mechanism.
  if (action.triggeredBySync === true) {
    return returnValue;
  }

  let newState = getState();
  switch (action.type) {
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


    case 'UPDATE_LOCATION_CONFIG':
      handleLocationInCloud(action, newState);
      break;
    case 'UPDATE_SPHERE_CONFIG':
      handleSphereInCloud(action, newState);
      break;
    case 'UPDATE_SPHERE_USER':
      handleSphereUserInCloud(action, newState);
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
    CLOUD.removeProfileImage().catch(() => {});
  }

  if (action.data.firstName || action.data.lastName) {
    CLOUD.updateUserData({background: true, data: {firstName: state.user.firstName, lastName: state.user.lastName}}).catch(() => {});
  }
}

function handleStoneBehaviourInCloud(action, state) {
  let sphereId = action.sphereId;
  let stoneId = action.stoneId;

  if (getMyLevelInSphere(state, sphereId) === 'admin') {
    let behaviourJSON = JSON.stringify(state.spheres[sphereId].stones[stoneId].behaviour);
    CLOUD.forStone(stoneId).updateStone({json:behaviourJSON}).catch(() => {});
  }
}

function handleStoneInCloud(action, state) {
  let sphereId = action.sphereId;
  let stoneId = action.stoneId;

  let stoneConfig = state.spheres[sphereId].stones[stoneId].config;
  let data = {
    name: stoneConfig.name,
    address: stoneConfig.macAddress,
    deviceType: stoneConfig.icon,
    id: stoneId,
    applianceId: stoneConfig.applianceId,
    locationId: stoneConfig.locationId,
    sphereId: sphereId,
  };
  
  CLOUD.forStone(stoneId).updateStone(data).catch(() => {});
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
  };

  CLOUD.forAppliance(applianceId).updateAppliance(data).catch(() => {});
}

function handleApplianceBehaviourInCloud(action, state) {
  let sphereId = action.sphereId;
  let applianceId = action.applianceId;

  if (getMyLevelInSphere(state, sphereId) === 'admin') {
    let behaviourJSON = JSON.stringify(state.spheres[sphereId].appliances[applianceId].behaviour);
    CLOUD.forAppliance(applianceId).updateAppliance({json:behaviourJSON}).catch(() => {});
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
  };

  CLOUD.forSphere(sphereId).updateLocation(locationId, data).catch(() => {});
}

function handleSphereInCloud(action, state) {
  // these are handled by the views, cloud update for these things is mandatory
}

function handleSphereUserInCloud(action, state) {

}