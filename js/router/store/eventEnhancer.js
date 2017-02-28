import { eventBus } from '../../util/eventBus'
import { BATCH } from './storeManager'
import { LOG } from '../../logging/Log'


/**
 * This will emit an event which explains what has been changed in broad lines.
 *
 * The eventData is an object with keys of kinds of changes.
 * Each on of these keys (example: updateApplianceBehaviour) has an object of the ids of the items it is affecting:
 *    eventData["updateApplianceBehaviour"] = {
 *      locationIds:{},
 *      sphereIds:{xxx: true},
 *      stoneIds:{},
 *      applianceIds:{xxx: true}
 *    }
 * The concept is that you can clearly check the sort of change and if it affects you.
 *
 * Finally, if you dont want to check what type of operation it is and only want to check if your ID is affected, there
 * is a key called totalAffectedIds inside the eventData.
 *
 * This event is only triggered once for each database update, batch or normal.
 *
 * @param getState
 * @returns {function(*): function(*=)}
 * @constructor
 */
export function EventEnhancer({ getState }) {
  return (next) => (action) => {
    // Call the next dispatch method in the middleware chain.
    let returnValue = next(action);
    let eventData = {};
    let affectedIds = {locationIds:{}, sphereIds:{}, stoneIds:{}, applianceIds:{}};
    if (action.type === BATCH && action.payload && Array.isArray(action.payload)) {
      action.payload.forEach((action) => {
        let { data, ids } = checkAction(action, affectedIds);
        affectedIds = ids;
        eventData = {...eventData, ...data};
      })
    }
    else {
      let { data, ids } = checkAction(action, affectedIds);
      affectedIds = ids;
      eventData = {...eventData, ...data};
    }

    eventBus.emit("databaseChange", {...action, change: eventData});

    // This will likely be the action itself, unless
    // a middleware further in chain changed it.
    return returnValue
  }
}

function checkAction(action, affectedIds) {
  let eventStatus = {};

  if (action.locationId)  { affectedIds.locationIds[action.locationId] = true; }
  if (action.sphereId)    { affectedIds.sphereIds[action.sphereId] = true; }
  if (action.stoneId)     { affectedIds.stoneIds[action.stoneId] = true; }
  if (action.applianceId) { affectedIds.applianceIds[action.applianceId] = true; }

  switch (action.type) {
    case 'SET_ACTIVE_SPHERE':
    case 'CLEAR_ACTIVE_SPHERE':
      eventStatus.updateActiveSphere = affectedIds; break;
    case 'UPDATE_APP_STATE':
      eventStatus.updateAppState = affectedIds; break;
    case 'ADD_APPLIANCE':
      eventStatus.addAppliance = affectedIds;
      eventStatus.changeAppliances = affectedIds;
    case 'UPDATE_APPLIANCE_CONFIG':
      eventStatus.updateApplianceConfig = affectedIds; break;
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
      eventStatus.updateApplianceBehaviour = affectedIds; break;
    case 'ADD_APPLIANCE_SCHEDULE':
    case 'UPDATE_APPLIANCE_SCHEDULE':
    case 'REMOVE_APPLIANCE_SCHEDULE':
      break;
    case 'REMOVE_APPLIANCE':
      eventStatus.removeAppliance = affectedIds;
      eventStatus.changeAppliances = affectedIds;
      eventStatus.updateApplianceConfig = affectedIds;
      break;
    case 'USER_ENTER_LOCATION':
    case 'USER_EXIT_LOCATION':
      eventStatus.userPositionUpdate = affectedIds;
      break;
    case 'CLEAR_USERS':
      eventStatus.changeUsers = affectedIds;
      break;
    case 'UPDATE_LOCATION_FINGERPRINT':
      eventStatus.changeFingerprint = affectedIds; break;
    case 'ADD_LOCATION':
      eventStatus.addLocation = affectedIds;
      eventStatus.changeLocations = affectedIds;
    case 'UPDATE_LOCATION_CONFIG':
      eventStatus.updateLocationConfig = affectedIds; break;
    case 'REMOVE_LOCATION':
      eventStatus.removeLocation = affectedIds;
      eventStatus.changeLocations = affectedIds;
      eventStatus.updateLocationConfig = affectedIds; break;
    case 'SET_SPHERE_STATE':
      eventStatus.changeSphereState = affectedIds; break;
    case 'SET_SPHERE_KEYS': break;
    case 'ADD_SPHERE':
      eventStatus.addSphere = affectedIds;
      eventStatus.changeSpheres = affectedIds;
    case 'UPDATE_SPHERE_CONFIG':
      eventStatus.changeSphereConfig = affectedIds; break;
    case 'REMOVE_SPHERE':
      eventStatus.removeSphere = affectedIds;
      eventStatus.changeSpheres = affectedIds;
      eventStatus.changeSphereConfig = affectedIds; break;
    case 'ADD_SPHERE_USER':
      eventStatus.addSphereUser = affectedIds;
      eventStatus.changeSphereUsers = affectedIds;
    case 'UPDATE_SPHERE_USER':
      eventStatus.updateSphereUser = affectedIds;
      break;
    case 'REMOVE_SPHERE_USER':
      eventStatus.removeSphereUser = affectedIds;
      eventStatus.changeSphereUsers = affectedIds;
      eventStatus.updateSphereUser = affectedIds;
      break;
    case 'USER_ENTER_SPHERE':
    case 'USER_EXIT_SPHERE':
      eventStatus.changeSphereUserPresence = affectedIds; break;
    case 'UPDATE_STONE_HANDLE':
      eventStatus.changeStoneHandle = affectedIds; break;
    case 'UPDATE_STONE_DISABILITY':
      eventStatus.changeStoneState = affectedIds; break;
    case 'ADD_STONE':
      eventStatus.addStone = affectedIds;
      eventStatus.changeStones = affectedIds;
    case 'UPDATE_STONE_CONFIG':
      eventStatus.updateStoneConfig = affectedIds; break;
    case 'UPDATE_STONE_LOCATION':
      eventStatus.stoneLocationUpdated = affectedIds; break;
    case 'CLEAR_STONE_USAGE':
    case 'UPDATE_STONE_STATE':
    case 'UPDATE_STONE_SWITCH_STATE':
      eventStatus.powerUsageUpdated = affectedIds;
      eventStatus.stoneUsageUpdated = affectedIds; break;
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeEnter':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeExit':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomEnter':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomExit':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onNear':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onAway':
      eventStatus.updateStoneBehaviour = affectedIds; break;
      break;
    case "UPDATE_STONE_RSSI":
      eventStatus.stoneRssiUpdated = affectedIds; break;
    case 'ADD_STONE_SCHEDULE':
    case 'UPDATE_STONE_SCHEDULE':
    case 'REMOVE_STONE_SCHEDULE':
      break;
    case 'REMOVE_STONE':
      eventStatus.removeStone = affectedIds;
      eventStatus.changeStones = affectedIds;
      eventStatus.updateStoneConfig = affectedIds; break;
    case 'USER_LOG_IN':
      eventStatus.userLogin = affectedIds; break;
    case 'USER_SEEN_TAP_TO_TOGGLE':
    case 'USER_UPDATE':
    case 'USER_APPEND': // append means filling in the data without updating the cloud.
      eventStatus.changeUserData = affectedIds; break;
      break;
    case "SET_DEVELOPER_MODE":
    case "SET_LOGGING":
      eventStatus.changeUserDeveloperStatus = true; break;
    case "ADD_DEVICE":
    case "UPDATE_DEVICE_CONFIG":
    case "REMOVE_DEVICE":
    case "HYDRATE":
    case "USER_LOGGED_OUT_CLEAR_STORE":
    case "CREATE_APP_IDENTIFIER":
    case 'SET_TAP_TO_TOGGLE_CALIBRATION':
    case 'SET_DEVELOPER_MODE':
    case 'SET_LOGGING':
    case 'SET_BETA_ACCESS':
    case 'RESET_SPHERE_STATE':
    case 'USER_SEEN_TAP_TO_TOGGLE_ALERT':
    case 'REFRESH_DEFAULTS':
    case 'UPDATE_MESH_NETWORK_ID':
      break;
    default:
      LOG.warn("UNKNOWN ACTION TYPE:", action);
  }

  eventStatus.totalAffectedIds = affectedIds;

  return { data: eventStatus , ids: affectedIds };
}