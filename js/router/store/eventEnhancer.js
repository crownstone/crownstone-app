import { eventBus } from '../../util/eventBus'
import { BATCH } from './storeManager'
import { LOG, LOGDebug } from '../../logging/Log'

export function EventEnhancer({ getState }) {
  return (next) => (action) => {
    // Call the next dispatch method in the middleware chain.
    let returnValue = next(action);
    let eventData = {};
    if (action.type === BATCH && action.payload && Array.isArray(action.payload)) {
      action.payload.forEach((action) => {
        eventData = {...eventData, ...checkAction(action)};
      })
    }
    else {
      eventData = {...eventData, ...checkAction(action)};
    }


    eventBus.emit("databaseChange", {...action, change: eventData});

    // This will likely be the action itself, unless
    // a middleware further in chain changed it.
    return returnValue
  }
}

function checkAction(action) {
  let eventStatus = {};
  switch (action.type) {
    case 'SET_ACTIVE_SPHERE':
    case 'CLEAR_ACTIVE_SPHERE':
      eventStatus.updaceActiveSphere = true; break;
    case 'UPDATE_APP_STATE':
      eventStatus.updateAppState = true; break;
    case 'ADD_APPLIANCE':
      eventStatus.addAppliance = true;
      eventStatus.changeAppliances = true;
    case 'UPDATE_APPLIANCE_CONFIG':
      eventStatus.updateApplianceConfig = true; break;
    case 'ADD_LINKED_DEVICES':
    case 'UPDATE_LINKED_DEVICES':
    case 'REMOVE_LINKED_DEVICES':
      break;
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeEnter':
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeExit':
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomEnter':
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomExit':
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onNear':
    case 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onAway':
      eventStatus.updateApplianceBehaviour = true; break;
    case 'ADD_APPLIANCE_SCHEDULE':
    case 'UPDATE_APPLIANCE_SCHEDULE':
    case 'REMOVE_APPLIANCE_SCHEDULE':
      break;
    case 'REMOVE_APPLIANCE':
      eventStatus.removeAppliance = true;
      eventStatus.changeAppliances = true;
      eventStatus.updateApplianceConfig = true;
      break;
    case 'USER_ENTER_LOCATION':
    case 'USER_EXIT_LOCATION':
      eventStatus.userPositionUpdate = true;
      break;
    case 'CLEAR_USERS':
      eventStatus.changeUsers = true;
      break;
    case 'UPDATE_LOCATION_FINGERPRINT':
      eventStatus.changeFingerprint = true; break;
    case 'ADD_LOCATION':
      eventStatus.addLocation = true;
      eventStatus.changeLocations = true;
    case 'UPDATE_LOCATION_CONFIG':
      eventStatus.updateLocationConfig = true; break;
    case 'REMOVE_LOCATION':
      eventStatus.removeLocation = true;
      eventStatus.changeLocations = true;
      eventStatus.updateLocationConfig = true; break;
    case 'SET_SPHERE_STATE':
      eventStatus.changeSphereState = true; break;
    case 'SET_SPHERE_KEYS': break;
    case 'ADD_SPHERE':
      eventStatus.addSphere = true;
      eventStatus.changeSpheres = true;
    case 'UPDATE_SPHERE_CONFIG':
      eventStatus.changeSphereConfig = true; break;
    case 'REMOVE_SPHERE':
      eventStatus.removeSphere = true;
      eventStatus.changeSpheres = true;
      eventStatus.changeSphereConfig = true; break;
    case 'ADD_SPHERE_USER':
      eventStatus.addSphereUser = true;
      eventStatus.changeSphereUsers = true;
    case 'UPDATE_SPHERE_USER':
      eventStatus.updateSphereUser = true;
      break;
    case 'REMOVE_SPHERE_USER':
      eventStatus.removeSphereUser = true;
      eventStatus.changeSphereUsers = true;
      eventStatus.updateSphereUser = true;
      break;
    case 'USER_ENTER_SPHERE':
    case 'USER_EXIT_SPHERE':
      eventStatus.changeSphereUserPresence = true; break;
    case 'UPDATE_STONE_HANDLE':
      eventStatus.changeStoneHandle = true; break;
    case 'UPDATE_STONE_DISABILITY':
      eventStatus.changeStoneState = true; break;
    case 'ADD_STONE':
      eventStatus.addStone = true;
      eventStatus.changeStones = true;
    case 'UPDATE_STONE_CONFIG':
      eventStatus.updateStoneConfig = true; break;
    case 'UPDATE_STONE_LOCATION':
      eventStatus.stoneLocationUpdated = true; break;
    case 'CLEAR_STONE_USAGE':
    case 'UPDATE_STONE_STATE':
      eventStatus.powerUsageUpdated = true;
      eventStatus.stoneUsageUpdated = true; break;
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeEnter':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeExit':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomEnter':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomExit':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onNear':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onAway':
      eventStatus.updateStoneBehaviour = true; break;
      break;
    case 'ADD_STONE_SCHEDULE':
    case 'UPDATE_STONE_SCHEDULE':
    case 'REMOVE_STONE_SCHEDULE':
      break;
    case 'REMOVE_STONE':
      eventStatus.removeStone = true;
      eventStatus.changeStones = true;
      eventStatus.updateStoneConfig = true; break;
    case 'USER_LOG_IN':
      eventStatus.userLogin = true; break;
    case 'USER_UPDATE':
    case 'USER_APPEND': // append means filling in the data without updating the cloud.
      eventStatus.changeUserData = true; break;
      break;
    default:
      console.log("UNKNOWN ACTION TYPE:", action);
  }

  return eventStatus;
}