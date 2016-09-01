import { CLOUD } from '../../cloud/cloudAPI'
import { getMyLevelInGroup } from '../../util/dataUtil'
import { BATCH } from './storeManager'

export function CloudEnhancer({ getState }) {
  return (next) => (action) => {
    console.log('will dispatch', action);

    // Call the next dispatch method in the middleware chain.
    let returnValue = next(action);

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
    case 'UPDATE_GROUP_CONFIG':
      handleGroupInCloud(action, newState);
      break;
    case 'UPDATE_GROUP_USER':
      handleGroupUserInCloud(action, newState);
      break;
  }
}


// user in this case is self, the owner of the phone
function handleUserInCloud(action, state) {
  let userId = state.user.userId;
  CLOUD.forUser(userId);
  if (action.data.picture) {
    CLOUD.uploadProfileImage(action.data.picture).then((data) => {console.log(data)});
  }
  else if (action.data.picture === null) {
    CLOUD.removeProfileImage();
  }

  if (action.data.firstName || action.data.lastName) {
    CLOUD.updateUserData({background: true, data: {firstName: state.user.firstName, lastName: state.user.lastName}});
  }
}

function handleStoneBehaviourInCloud(action, state) {
  let groupId = action.groupId;
  let stoneId = action.stoneId;

  if (getMyLevelInGroup(state, groupId) === 'admin') {
    let behaviourJSON = JSON.stringify(state.groups[groupId].stones[stoneId].behaviour);
    CLOUD.forStone(stoneId).updateStone({json:behaviourJSON});
  }
}

function handleStoneInCloud(action, state) {
  let groupId = action.groupId;
  let stoneId = action.stoneId;

  let stoneConfig = state.groups[groupId].stones[stoneId].config;
  let data = {
    name: stoneConfig.name,
    address: stoneConfig.address,
    deviceType: stoneConfig.icon,
    id: stoneId,
    applianceId: stoneConfig.applianceId,
    locationId: stoneConfig.locationId
  };
  
  CLOUD.forStone(stoneId).updateStone(data);
}

function handleApplianceInCloud(action, state) {
  let groupId = action.groupId;
  let applianceId = action.applianceId;

  let applianceConfig = state.groups[groupId].appliances[applianceId].config;
  let data = {
    name: applianceConfig.name,
    icon: applianceConfig.icon,
    id: applianceId,
    groupId: groupId,
  };

  CLOUD.forAppliance(applianceId).updateAppliance(data);
}

function handleApplianceBehaviourInCloud(action, state) {
  let groupId = action.groupId;
  let applianceId = action.applianceId;

  if (getMyLevelInGroup(state, groupId) === 'admin') {
    let behaviourJSON = JSON.stringify(state.groups[groupId].appliances[applianceId].behaviour);
    CLOUD.forAppliance(applianceId).updateAppliance({json:behaviourJSON});
  }
}


function handleLocationInCloud(action, state) {
  let groupId = action.groupId;
  let locationId = action.locationId;

  let locationConfig = state.groups[groupId].locations[locationId].config;
  let data = {
    name: locationConfig.name,
    icon: locationConfig.icon,
    id: locationId,
    groupId: groupId,
  };

  CLOUD.forGroup(groupId).updateLocation(locationId, data);
}

function handleGroupInCloud(action, state) {
  // these are handled by the views, cloud update for these things is mandatory
}

function handleGroupUserInCloud(action, state) {

}