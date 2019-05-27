import { BATCH } from './storeManager'
import {LOGw} from '../../logging/Log'
import { core } from "../../core";


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
    let affectedIds = {locationIds:{}, sphereIds:{}, stoneIds:{}, applianceIds:{}, messageIds:{} , scheduleIds:{}, activityLogIds: {}, toonIds:{}};
    if (action.type === BATCH && action.payload && Array.isArray(action.payload)) {
      action.payload.forEach((action) => {
        if (action.__noEvents !== true) {
          let {data, ids} = checkAction(action, affectedIds);
          affectedIds = ids;
          eventData = {...eventData, ...data};
        }
      })
    }
    else {
      if (action.__noEvents !== true) {
        let {data, ids} = checkAction(action, affectedIds);
        affectedIds = ids;
        eventData = {...eventData, ...data};
      }
    }

    core.eventBus.emit("databaseChange", {...action, change: eventData});

    // This will likely be the action itself, unless
    // a middleware further in chain changed it.
    return returnValue
  }
}

function checkAction(action, affectedIds) {
  let eventStatus = {};

  if (action.locationId)     { affectedIds.locationIds[action.locationId]       = true; }
  if (action.sphereId)       { affectedIds.sphereIds[action.sphereId]           = true; }
  if (action.stoneId)        { affectedIds.stoneIds[action.stoneId]             = true; }
  if (action.applianceId)    { affectedIds.applianceIds[action.applianceId]     = true; }
  if (action.messageId)      { affectedIds.messageIds[action.messageId]         = true; }
  if (action.scheduleId)     { affectedIds.scheduleIds[action.scheduleId]       = true; }
  if (action.activityLogId)  { affectedIds.activityLogIds[action.activityLogId] = true; }
  if (action.toonId)         { affectedIds.toonIds[action.toonId]               = true; }

  switch (action.type) {
    case 'SET_ACTIVE_SPHERE':
    case 'CLEAR_ACTIVE_SPHERE':
      eventStatus['updateActiveSphere'] = affectedIds; break;
    case 'UPDATE_APP_STATE':
      eventStatus['updateAppState'] = affectedIds; break;
    case 'ADD_APPLIANCE':
      eventStatus['addAppliance'] = affectedIds;
      eventStatus['changeAppliances'] = affectedIds;
    case 'UPDATE_APPLIANCE_CONFIG':
      eventStatus['updateApplianceConfig'] = affectedIds; break;
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
      eventStatus['updateApplianceBehaviour'] = affectedIds; break;
    case 'ADD_APPLIANCE_SCHEDULE':
    case 'UPDATE_APPLIANCE_SCHEDULE':
    case 'REMOVE_APPLIANCE_SCHEDULE':
      break;
    case 'REMOVE_APPLIANCE':
      eventStatus['removeAppliance'] = affectedIds;
      eventStatus['changeAppliances'] = affectedIds;
      eventStatus['updateApplianceConfig'] = affectedIds;
      break;
    case 'USER_ENTER_LOCATION':
    case 'USER_EXIT_LOCATION':
      eventStatus['userPositionUpdate'] = affectedIds;
      break;
    case 'CLEAR_USERS_IN_LOCATION':
      eventStatus['changeUsers'] = affectedIds;
      break;
    case 'UPDATE_LOCATION_FINGERPRINT':
    case 'UPDATE_NEW_LOCATION_FINGERPRINT':
      eventStatus['changeFingerprint'] = affectedIds; break;
    case 'ADD_LOCATION':
      eventStatus['addLocation'] = affectedIds;
      eventStatus['changeLocations'] = affectedIds;
    case 'UPDATE_LOCATION_CONFIG':
      eventStatus['updateLocationConfig'] = affectedIds; break;
    case 'REMOVE_LOCATION':
      eventStatus['removeLocation'] = affectedIds;
      eventStatus['changeLocations'] = affectedIds;
      eventStatus['updateLocationConfig'] = affectedIds; break;
    case 'SET_FLOATING_LAYOUT_LOCATION':
    case 'SET_LOCATION_POSITIONS':
      eventStatus['changeLocationPositions'] = affectedIds; break;
    case 'SET_SPHERE_STATE':
      eventStatus['changeSphereState'] = affectedIds; break;
    case 'SET_SPHERE_KEYS':
      eventStatus['setKeys'] = affectedIds; break;
    case 'ADD_SPHERE':
      eventStatus['addSphere'] = affectedIds;
      eventStatus['changeSpheres'] = affectedIds;
    case 'UPDATE_SPHERE_CONFIG':
      eventStatus['changeSphereConfig'] = affectedIds; break;
    case 'REMOVE_SPHERE':
      eventStatus['removeSphere'] = affectedIds;
      eventStatus['changeSpheres'] = affectedIds;
      eventStatus['changeSphereConfig'] = affectedIds; break;
    case 'ADD_SPHERE_USER':
      eventStatus['addSphereUser'] = affectedIds;
      eventStatus['changeSphereUsers'] = affectedIds;
    case 'UPDATE_SPHERE_USER':
      eventStatus['updateSphereUser'] = affectedIds;
      break;
    case 'REMOVE_SPHERE_USER':
      eventStatus['userPositionUpdate'] = affectedIds;
      eventStatus['removeSphereUser'] = affectedIds;
      eventStatus['changeSphereUsers'] = affectedIds;
      eventStatus['updateSphereUser'] = affectedIds;
      break;
    case 'USER_ENTER_SPHERE':
    case 'USER_EXIT_SPHERE':
      eventStatus['changeSphereUserPresence'] = affectedIds; break;
    case 'UPDATE_STONE_HANDLE':
      eventStatus['changeStoneHandle'] = affectedIds; break;
    case 'ADD_STONE':
      eventStatus['addStone'] = affectedIds;
      eventStatus['changeStones'] = affectedIds;
    case 'UPDATE_STONE_LOCAL_CONFIG':
    case 'UPDATE_STONE_CONFIG':
      eventStatus['updateStoneCoreConfig'] = affectedIds;
    case 'UPDATE_STONE_ERRORS':
    case 'RESET_STONE_ERRORS':
    case 'CLEAR_STONE_ERRORS':
    case "UPDATE_STONE_CONFIG_TRANSIENT":
      eventStatus['updateStoneConfig'] = affectedIds; break;
    case 'UPDATE_STONE_LOCATION':
      eventStatus['stoneLocationUpdated'] = affectedIds; break;
    case 'CLEAR_STONE_USAGE':
    case 'UPDATE_STONE_STATE':
    case 'UPDATE_STONE_SWITCH_STATE':
    case 'REMOVE_ALL_POWER_USAGE':
    case 'REMOVE_POWER_USAGE_DATE':
      eventStatus['powerUsageUpdated'] = affectedIds;
      eventStatus['stoneUsageUpdated'] = affectedIds; break;
    case 'UPDATE_STONE_REMOTE_TIME':
      eventStatus['stoneTimeUpdated'] = affectedIds; break;
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeEnter':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeExit':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomEnter':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomExit':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onNear':
    case 'UPDATE_STONE_BEHAVIOUR_FOR_onAway':
      eventStatus['updateStoneBehaviour'] = affectedIds; break;
    case 'ADD_STONE_SCHEDULE':
    case 'REMOVE_STONE_SCHEDULE':
      eventStatus['changeStoneSchedule'] = affectedIds;
    case 'UPDATE_STONE_SCHEDULE':
      eventStatus['updateStoneSchedule'] = affectedIds; break;
    case 'REMOVE_STONE':
      eventStatus['removeStone'] = affectedIds;
      eventStatus['changeStones'] = affectedIds;
      eventStatus['updateStoneConfig'] = affectedIds; break;
    case 'USER_LOG_IN':
      eventStatus['userLogin'] = affectedIds; break;
    case 'USER_SEEN_TAP_TO_TOGGLE':
    case 'USER_UPDATE':
    case 'USER_APPEND': // append means filling in the data without updating the cloud.
      eventStatus['changeUserData'] = affectedIds; break;
    case "SET_DEVELOPER_MODE":
    case "SET_BETA_ACCESS":
    case "CHANGE_DEV_SETTINGS":
      eventStatus['changeUserDeveloperStatus'] = true;
    case "SET_LOGGING":
    case 'REVERT_LOGGING_DETAILS':
    case 'DEFINE_LOGGING_DETAILS':
      eventStatus['changeDeveloperData'] = affectedIds; break;
    case "ADD_DEVICE":
    case "UPDATE_DEVICE_CONFIG":
    case "CLEAR_DEVICE_DETAILS":
    case "SET_RSSI_OFFSET":
    case "REMOVE_DEVICE":
      eventStatus['changeDeviceData'] = affectedIds; break;
    case "SET_SPHERE_MESSAGE_STATE":
      eventStatus['changeMessageState'] = affectedIds; break;
    case "ADD_MESSAGE":
    case "ADD_CLOUD_MESSAGE":
      eventStatus['addedMessage'] = affectedIds;
    case "APPEND_MESSAGE":
    case "READ_MESSAGE":
    case "RECEIVED_MESSAGE":
    case "REMOVE_MESSAGE":
    case "I_READ_MESSAGE":
      eventStatus['changeMessage'] = affectedIds; break;
    case "I_RECEIVED_MESSAGE":
      eventStatus['iChangedMessage'] = affectedIds; break;
    case "HYDRATE":
    case "USER_LOGGED_OUT_CLEAR_STORE":
    case "CREATE_APP_IDENTIFIER":
    case 'SET_TAP_TO_TOGGLE_CALIBRATION':
    case 'SET_BETA_ACCESS':
    case 'RESET_SPHERE_STATE':
    case 'SET_APP_IDENTIFIER':
    case 'USER_SEEN_TAP_TO_TOGGLE_ALERT':
    case 'USER_SEEN_ROOM_FINGERPRINT_ALERT':
    case 'SET_NEW_FIRMWARE_VERSIONS':
    case 'REFRESH_DEFAULTS':
    case 'UPDATE_STONE_DFU_RESET':
    case 'ADD_INSTALLATION':
    case 'UPDATE_INSTALLATION_CONFIG':
    case 'UPDATED_STONE_TIME':
    case 'SET_NOTIFICATION_TOKEN':
    case 'SET_BATCH_SYNC_POWER_USAGE':
    case 'SET_DAY_SYNC_POWER_USAGE':
    case 'ADD_POWER_USAGE':
    case 'ADD_BATCH_POWER_USAGE':
      break;
    case 'UPDATE_APP_SETTINGS':
      eventStatus['changeAppSettings'] = affectedIds; break;
    case 'UPDATE_MESH_NETWORK_ID':
      eventStatus['meshIdUpdated'] = affectedIds; break;
    case 'REMOVE_MESH_LINK':
    case 'SET_MESH_INDICATOR':
      eventStatus['meshIndicatorUpdated'] = affectedIds; break;
    case "CLOUD_EVENT_REMOVE_APPLIANCES":
    case "CLOUD_EVENT_REMOVE_LOCATIONS":
    case "CLOUD_EVENT_REMOVE_STONES":
    case "CLOUD_EVENT_REMOVE_USER":
    case "CLOUD_EVENT_REMOVE_SCHEDULES":
    case "CLOUD_EVENT_REMOVE_INSTALLATIONS":
    case "CLOUD_EVENT_REMOVE_DEVICES":
    case "CLOUD_EVENT_REMOVE_MESSAGES":
    case "CLOUD_EVENT_SPECIAL_USER":
    case "CLOUD_EVENT_SPECIAL_APPLIANCES":
    case "CLOUD_EVENT_SPECIAL_LOCATIONS":
    case "CLOUD_EVENT_SPECIAL_STONES":
    case "CLOUD_EVENT_SPECIAL_SCHEDULES":
    case "CLOUD_EVENT_SPECIAL_INSTALLATIONS":
    case "CLOUD_EVENT_SPECIAL_DEVICES":
    case "CLOUD_EVENT_SPECIAL_MESSAGES":
    case "FINISHED_CREATE_APPLIANCES":
    case "FINISHED_CREATE_LOCATIONS":
    case "FINISHED_CREATE_STONES":
    case "FINISHED_CREATE_SCHEDULES":
    case "FINISHED_CREATE_INSTALLATIONS":
    case "FINISHED_CREATE_DEVICES":
    case "FINISHED_CREATE_MESSAGES":
    case "FINISHED_UPDATE_APPLIANCES":
    case "FINISHED_UPDATE_LOCATIONS":
    case "FINISHED_UPDATE_STONES":
    case "FINISHED_UPDATE_SCHEDULES":
    case "FINISHED_UPDATE_INSTALLATIONS":
    case "FINISHED_UPDATE_DEVICES":
    case "FINISHED_UPDATE_MESSAGES":
    case "FINISHED_REMOVE_APPLIANCES":
    case "FINISHED_REMOVE_LOCATIONS":
    case "FINISHED_REMOVE_STONES":
    case "FINISHED_REMOVE_SCHEDULES":
    case "FINISHED_REMOVE_INSTALLATIONS":
    case "FINISHED_REMOVE_DEVICES":
    case "FINISHED_REMOVE_MESSAGES":
    case "FINISHED_SPECIAL_USER":
    case "FINISHED_SPECIAL_APPLIANCES":
    case "FINISHED_SPECIAL_LOCATIONS":
    case "FINISHED_SPECIAL_STONES":
    case "FINISHED_SPECIAL_SCHEDULES":
    case "FINISHED_SPECIAL_INSTALLATIONS":
    case "FINISHED_SPECIAL_DEVICES":
    case "FINISHED_SPECIAL_MESSAGES":
    case "UPDATE_SYNC_ACTIVITY_TIME":
    case "UPDATE_ACTIVITY_RANGE":
      break;
    case "ADD_TOON":
    case "TOON_UPDATE_SETTINGS":
    case "TOON_UPDATE_SCHEDULE":
    case "REMOVE_TOON":
    case "REMOVE_ALL_TOONS":
      eventStatus['updatedToon'] = affectedIds; break;
    case "UPDATE_SCHEDULE_CLOUD_ID":
    case "UPDATE_MESSAGE_CLOUD_ID":
    case "UPDATE_APPLIANCE_CLOUD_ID":
    case "UPDATE_LOCATION_CLOUD_ID":
    case "UPDATE_STONE_CLOUD_ID":
    case "UPDATE_SPHERE_CLOUD_ID":
    case "UPDATE_ACTIVITY_LOG_CLOUD_ID":
      eventStatus['updatedCloudIds'] = affectedIds; break;
    case "UPDATE_STONE_REACHABILITY":
    case "UPDATE_STONE_PREVIOUS_SWITCH_STATE":
      break;
    case "UPDATE_STONE_SWITCH_STATE_TRANSIENT":
      eventStatus['stoneUsageUpdatedTransient'] = affectedIds; break;
    case "USER_UPDATE_PICTURE":
      break;
    case "ADD_ACTIVITY_LOG":
    case "ADD_ACTIVITY_RANGE":
    case "REMOVE_ACTIVITY_RANGE":
    case "REMOVE_ACTIVITY_LOG":
      eventStatus['stoneChangeLogs'] = affectedIds; break;
    default:
      LOGw.store("UNKNOWN ACTION TYPE:", action);
  }

  eventStatus['totalAffectedIds'] = affectedIds;

  return { data: eventStatus , ids: affectedIds };
}