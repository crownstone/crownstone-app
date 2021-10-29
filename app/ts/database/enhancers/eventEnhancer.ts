import { BATCH } from "../reducers/BatchReducer";
import { core }  from "../../Core";
import { LOGw }  from "../../logging/Log";


/**
 * This will emit an event which explains what has been changed in broad lines.
 *
 * The eventData is an object with keys of kinds of changes.
 * Each on of these keys (example: updateApplianceBehaviour) has an object of the ids of the items it is affecting:
 *    eventData["updateApplianceBehaviour"] = {
 *      locationIds:{},
 *      sphereIds:{xxx: true},
 *      stoneIds:{},
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

    // required for some of the actions
    let oldState = getState();

    // Call the next dispatch method in the middleware chain.
    let returnValue = next(action);

    // state after update
    let newState = getState();

    let eventData = {};
    let affectedIds = {locationIds:{}, sphereIds:{}, stoneIds:{}, messageIds:{} , scheduleIds:{}, toonIds:{}, hubIds:{}};
    if (action.type === BATCH && action.payload && Array.isArray(action.payload)) {
      action.payload.forEach((action) => {
        if (action.__noEvents !== true) {
          let {data, ids} = checkAction(action, affectedIds, oldState, newState);
          affectedIds = ids;
          eventData = {...eventData, ...data}; 
        }
      })
    }
    else {
      if (action.__noEvents !== true) {
        let {data, ids} = checkAction(action, affectedIds, oldState, newState);
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

function checkAction(action : DatabaseAction, affectedIds, oldState, newState) {
  let eventStatus = {};

  if (action.locationId)     { affectedIds.locationIds[action.locationId]       = true; }
  if (action.sphereId)       { affectedIds.sphereIds[action.sphereId]           = true; }
  if (action.stoneId)        { affectedIds.stoneIds[action.stoneId]             = true; }
  if (action.messageId)      { affectedIds.messageIds[action.messageId]         = true; }
  if (action.toonId)         { affectedIds.toonIds[action.toonId]               = true; }
  if (action.hubId)          { affectedIds.hubIds[action.hubId]                 = true; }

  switch (action.type) {
    case 'SET_ACTIVE_SPHERE':
    case 'CLEAR_ACTIVE_SPHERE':
      eventStatus['updateActiveSphere'] = affectedIds; break;
    case 'UPDATE_APP_STATE':
      eventStatus['updateAppState'] = affectedIds; break;
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
    case 'LOCATION_UPDATE_PICTURE':
      eventStatus['updateLocationConfig'] = affectedIds; break;
    case 'REMOVE_LOCATION':
      eventStatus['removeLocation'] = affectedIds;
      eventStatus['changeLocations'] = affectedIds;
      eventStatus['updateLocationConfig'] = affectedIds; break;
    case 'SET_LOCATION_POSITIONS':
      eventStatus['changeLocationPositions'] = affectedIds; break;
    case 'SET_SPHERE_STATE':
      eventStatus['changeSphereState'] = affectedIds; break;
    case 'SET_SPHERE_SMART_HOME_STATE':
      eventStatus['changeSphereSmartHomeState'] = affectedIds; break;
    case 'ADD_SPHERE':
      eventStatus['addSphere'] = affectedIds;
      eventStatus['changeSpheres'] = affectedIds;
    case 'SET_SPHERE_GPS_COORDINATES':
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
      let oldStoneConfig = oldState?.spheres?.[action.sphereId]?.stones?.[action.stoneId]?.config ?? null;
      let newStoneConfig = newState?.spheres?.[action.sphereId]?.stones?.[action.stoneId]?.config ?? null;
      if (
        oldStoneConfig &&
        newStoneConfig &&
        (oldStoneConfig.name !== newStoneConfig.name || oldStoneConfig.uid !== newStoneConfig.uid)) {
        eventStatus['updateStoneIdentificationConfig'] = affectedIds;
      }
      eventStatus['updateStoneCoreConfig'] = affectedIds;
    case 'UPDATE_STONE_ERRORS':
    case 'RESET_STONE_ERRORS':
    case 'CLEAR_STONE_ERRORS':
    case "UPDATE_STONE_CONFIG_TRANSIENT":
      eventStatus['updateStoneConfig'] = affectedIds; break;
    case 'UPDATE_STONE_LOCATION':
      eventStatus['stoneLocationUpdated'] = affectedIds; break;
    case 'UPDATE_STONE_SWITCH_STATE':
      eventStatus['updateStoneSwitchState'] = affectedIds;
    case 'UPDATE_STONE_STATE':
    case 'CLEAR_STONE_USAGE':
      eventStatus['updateStoneState'] = affectedIds;
      eventStatus['powerUsageUpdated'] = affectedIds;
      eventStatus['stoneUsageUpdated'] = affectedIds; break;
    case 'REMOVE_STONE':
      eventStatus['removeStone'] = affectedIds;
      eventStatus['changeStones'] = affectedIds;
      eventStatus['updateStoneConfig'] = affectedIds; break;
    case 'USER_LOG_IN':
      eventStatus['userLogin'] = affectedIds; break;
    case 'USER_SEEN_TAP_TO_TOGGLE_ALERT':
    case 'USER_UPDATE':
    case "USER_UPDATE_PICTURE":
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
    case "ADD_SCENE":
    case "REMOVE_SCENE":
    case "REMOVE_ALL_SCENES":
      eventStatus['changeScenes'] = affectedIds; break;
      eventStatus['updateScene']  = affectedIds; break;
    case "UPDATE_SCENE":
      eventStatus['updateScene'] = affectedIds; break;
    case "HYDRATE":
    case "USER_LOGGED_OUT_CLEAR_STORE":
    case "CREATE_APP_IDENTIFIER":
    case 'SET_BETA_ACCESS':
    case 'RESET_SPHERE_PRESENCE_STATE':
    case 'SET_APP_IDENTIFIER':
    case 'USER_SEEN_TAP_TO_TOGGLE_ALERT':
    case 'REFRESH_DEFAULTS':
    case 'UPDATE_STONE_DFU_RESET':
    case 'ADD_INSTALLATION':
    case 'UPDATE_INSTALLATION_CONFIG':
    case 'UPDATED_STONE_TIME':
    case 'SET_NOTIFICATION_TOKEN':
      break;
    case 'UPDATE_APP_SETTINGS':
      eventStatus['changeAppSettings'] = affectedIds; break;
    case "CLOUD_EVENT_REMOVE_LOCATIONS":
    case "CLOUD_EVENT_REMOVE_STONES":
    case "CLOUD_EVENT_REMOVE_USER":
    case "CLOUD_EVENT_REMOVE_INSTALLATIONS":
    case "CLOUD_EVENT_REMOVE_DEVICES":
    case "CLOUD_EVENT_REMOVE_MESSAGES":
    case "CLOUD_EVENT_REMOVE_SCENES":
    case "CLOUD_EVENT_REMOVE_BEHAVIOURS":
    case "CLOUD_EVENT_SPECIAL_USER":
    case "CLOUD_EVENT_SPECIAL_SCENES":
    case "CLOUD_EVENT_SPECIAL_BEHAVIOURS":
    case "CLOUD_EVENT_SPECIAL_LOCATIONS":
    case "CLOUD_EVENT_SPECIAL_STONES":
    case "CLOUD_EVENT_SPECIAL_INSTALLATIONS":
    case "CLOUD_EVENT_SPECIAL_DEVICES":
    case "CLOUD_EVENT_SPECIAL_MESSAGES":
    case "FINISHED_CREATE_LOCATIONS":
    case "FINISHED_CREATE_STONES":
    case "FINISHED_CREATE_INSTALLATIONS":
    case "FINISHED_CREATE_DEVICES":
    case "FINISHED_CREATE_MESSAGES":
    case "FINISHED_UPDATE_LOCATIONS":
    case "FINISHED_UPDATE_STONES":
    case "FINISHED_UPDATE_INSTALLATIONS":
    case "FINISHED_UPDATE_DEVICES":
    case "FINISHED_UPDATE_MESSAGES":
    case "FINISHED_REMOVE_LOCATIONS":
    case "FINISHED_REMOVE_STONES":
    case "FINISHED_REMOVE_INSTALLATIONS":
    case "FINISHED_REMOVE_DEVICES":
    case "FINISHED_REMOVE_MESSAGES":
    case "FINISHED_SPECIAL_USER":
    case "FINISHED_SPECIAL_LOCATIONS":
    case "FINISHED_SPECIAL_STONES":
    case "FINISHED_SPECIAL_INSTALLATIONS":
    case "FINISHED_SPECIAL_DEVICES":
    case "FINISHED_SPECIAL_MESSAGES":
    case "FINISHED_SPECIAL_SCENES":
    case "UPDATE_STONE_TIME_STATE":
    case "LOCATION_REPAIR_PICTURE":
    case "SPHERE_USER_REPAIR_PICTURE":
    case "SPHERE_SCENE_REPAIR_PICTURE":
    case "UPDATE_SORTED_LIST":
    case "INJECT_IDS":
    case "ADD_SORTED_LIST":
    case "UPDATE_ABILITY_CLOUD_ID":
      break;
    case "ADD_TOON":
    case "TOON_UPDATE_SETTINGS":
    case "TOON_UPDATE_SCHEDULE":
    case "REMOVE_TOON":
    case "REMOVE_ALL_TOONS":
      eventStatus['updatedToon'] = affectedIds; break;
    case "UPDATE_MESSAGE_CLOUD_ID":
    case "UPDATE_LOCATION_CLOUD_ID":
    case "UPDATE_STONE_CLOUD_ID":
    case "UPDATE_RULE_CLOUD_ID":
    case "UPDATE_SCENE_CLOUD_ID":
    case "UPDATE_SPHERE_CLOUD_ID":
      eventStatus['updatedCloudIds'] = affectedIds; break;
    case "UPDATE_STONE_REACHABILITY":
      break;
    case "UPDATE_STONE_SWITCH_STATE_TRANSIENT":
      eventStatus['stoneUsageUpdatedTransient'] = affectedIds; break;
      break;
    case "ADD_SPHERE_KEY":
    case "UPDATE_SPHERE_KEY":
    case "REMOVE_SPHERE_KEY":
      eventStatus['updatedSphereKeys'] = affectedIds; break;
      break;
    case "ADD_STONE_RULE":
    case "UPDATE_STONE_RULE":
    case "MARK_STONE_RULE_FOR_DELETION":
    case "REFRESH_BEHAVIOURS":
    case "MARK_STONE_RULE_AS_SYNCED":
    case "REMOVE_STONE_RULE":
      eventStatus['stoneChangeRules'] = affectedIds; break;
    case "REMOVE_ALL_ABILITIES":
    case "ADD_ABILITY_PROPERTY":
    case "ADD_ABILITY":
    case "REFRESH_ABILITIES":
    case "UPDATE_ABILITY":
      eventStatus['stoneChangeAbilities'] = affectedIds; break;

    case "MARK_ABILITY_AS_SYNCED":
    case "UPDATE_ABILITY_AS_SYNCED_FROM_CLOUD":
      eventStatus['stoneSyncedAbilities'] = affectedIds; break;

    case 'SET_NEW_BOOTLOADER_VERSIONS':
    case 'SET_NEW_FIRMWARE_VERSIONS':
      eventStatus['firmwareVersionsAvailable'] = affectedIds; break;

    case 'SET_TRACKING_NUMBER':
      eventStatus['newTrackingNumberSet'] = affectedIds; break;
    case 'CYCLE_RANDOM_DEVICE_TOKEN':
      eventStatus['deviceTrackingTokenCycled'] = affectedIds; break;
    case 'TRY_NEW_DEVICE_TOKEN':
      eventStatus['deviceTrackingTokenTried'] = affectedIds; break;
    case "SET_ACTIVE_RANDOM_DEVICE_TOKEN":
      break;

    case "UPDATE_HUB_LOCATION":
      eventStatus['hubLocationUpdated'] = affectedIds; break;
    case "UPDATE_HUB_CONFIG":
    case "UPDATE_HUB_STATE":
      eventStatus['updateHubConfig'] = affectedIds; break;
    case "ADD_HUB":
    case "REMOVE_ALL_HUBS":
    case "REMOVE_HUB":
      eventStatus['changeHubs'] = affectedIds; break;

    case "UPDATE_ABILITY_PROPERTY":
    case "UPDATE_ABILITY_PROPERTY_AS_SYNCED_FROM_CLOUD":
      break;
    default:
      LOGw.store("UNKNOWN ACTION TYPE:", action);
  }

  eventStatus['totalAffectedIds'] = affectedIds;

  return { data: eventStatus , ids: affectedIds };
}