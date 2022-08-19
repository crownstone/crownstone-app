type sphereId               = string; // this is the localId
type locationId             = string; // this is the localId
type stoneId                = string; // this is the localId
type sceneId                = string; // this is the localId
type hubId                  = string; // this is the localId
type messageId              = string; // this is the localId
type userId                 = string; // this is the localId
type sphereUserId           = string; // this is the localId
type databaseId             = string; // this is the localId
type fingerprintId          = string; // this is the localId
type processedFingerprintId = string; // this is the localId

type spherecloudId               = string; // this is the cloudId
type locationcloudId             = string; // this is the cloudId
type stonecloudId                = string; // this is the cloudId
type scenecloudId                = string; // this is the cloudId
type hubcloudId                  = string; // this is the cloudId
type messagecloudId              = string; // this is the cloudId
type usercloudId                 = string; // this is the cloudId
type sphereUsercloudId           = string; // this is the cloudId
type databasecloudId             = string; // this is the cloudId
type fingerprintcloudId          = string; // this is the cloudId
type processedFingerprintcloudId = string; // this is the cloudId

interface SyncEventData {
  id: string,
  localId: string,
  sphereId: string,
  locationId?: string,
  stoneId?: string,
  cloudId: string,
  specialType: string,
}

interface SortedListData {
  id: string,
  viewKey: string,
  referenceId: string,
  sortedList: string[],
  cloudId: string,
  updatedAt: number,
}

interface EncryptionKeyData {
  id: string,
  key: string,
  keyType: string,
  createdAt: number,
  ttl: number
}

interface DatabaseAction {
  type?: ACTION_TYPE | 'NOT_REQUIRED',
  sphereId?               : string,
  locationId?             : string,
  fingerprintId?          : string,
  fingerprintProcessedId? : string,
  sceneId?                : string,
  messageId?              : string,
  messageStateId?         : 'read' | 'deleted',
  hueBridgeId?            : string,
  deviceId?               : string,
  sortedListId?           : string,
  installationId?         : string,
  stoneId?                : string,
  keyId?                  : string,
  hubId?                  : string,
  behaviourId?            : string,
  abilityId?              : string,
  propertyId?             : string,
  userId?                 : string,
  toonId?                 : string,

  eventId?                : string,

  __sphereOnly?           : boolean,
  __triggeredBySync?      : boolean,
  __test?                 : boolean,
  __logLevel?             : number,
  __purelyLocal?          : boolean,
  __noEvents?             : boolean,
  data?
}


type SYSTEM_ACTION_TYPES = 'HYDRATE' | 'USER_LOGGED_OUT_CLEAR_STORE' | 'TESTS_CLEAR_STORE';
type EVENT_ACTION_TYPES = 'CLOUD_EVENT_REMOVE_LOCATIONS'    |                                      
                      'CLOUD_EVENT_REMOVE_STONES'           |                              
                      'CLOUD_EVENT_REMOVE_USER'             |                            
                      'CLOUD_EVENT_REMOVE_INSTALLATIONS'    |                                      
                      'CLOUD_EVENT_REMOVE_DEVICES'          |                                
                      'CLOUD_EVENT_REMOVE_MESSAGES'         |                                
                      'CLOUD_EVENT_REMOVE_SCENES'           |                              
                      'CLOUD_EVENT_REMOVE_BEHAVIOURS'       |                                  
                      'CLOUD_EVENT_SPECIAL_USER'            |                              
                      'CLOUD_EVENT_SPECIAL_SCENES'          |                                
                      'CLOUD_EVENT_SPECIAL_BEHAVIOURS'      |                                    
                      'CLOUD_EVENT_SPECIAL_LOCATIONS'       |                                  
                      'CLOUD_EVENT_SPECIAL_STONES'          |                                
                      'CLOUD_EVENT_SPECIAL_INSTALLATIONS'   |                                      
                      'CLOUD_EVENT_SPECIAL_DEVICES'         |                                
                      'CLOUD_EVENT_SPECIAL_MESSAGES'        |                                  
                      'FINISHED_CREATE_LOCATIONS'           |                              
                      'FINISHED_CREATE_STONES'              |                            
                      'FINISHED_CREATE_INSTALLATIONS'       |                                  
                      'FINISHED_CREATE_DEVICES'             |                            
                      'FINISHED_CREATE_MESSAGES'            |                              
                      'FINISHED_UPDATE_LOCATIONS'           |                              
                      'FINISHED_UPDATE_STONES'              |                            
                      'FINISHED_UPDATE_INSTALLATIONS'       |                                  
                      'FINISHED_UPDATE_DEVICES'             |                            
                      'FINISHED_UPDATE_MESSAGES'            |                              
                      'FINISHED_REMOVE_LOCATIONS'           |                              
                      'FINISHED_REMOVE_STONES'              |                            
                      'FINISHED_REMOVE_INSTALLATIONS'       |                                  
                      'FINISHED_REMOVE_BEHAVIOURS'          |
                      'FINISHED_REMOVE_DEVICES'             |
                      'FINISHED_REMOVE_MESSAGES'            |
                      'FINISHED_REMOVE_FINGERPRINTS'        |
                      'FINISHED_REMOVE_SCENES'              |
                      'FINISHED_SPECIAL_USER'               |
                      'FINISHED_SPECIAL_LOCATIONS'          |
                      'FINISHED_SPECIAL_STONES'             |
                      'FINISHED_SPECIAL_INSTALLATIONS'      |
                      'FINISHED_SPECIAL_DEVICES'            |
                      'FINISHED_SPECIAL_MESSAGES'           |
                      'FINISHED_SPECIAL_SCENES'

type ACTION_TYPE = SYSTEM_ACTION_TYPES | EVENT_ACTION_TYPES      |
  'ADD_ABILITY'                                  |
  'ADD_ABILITY_PROPERTY'                         |
  'ADD_DEVICE'                                   |
  'ADD_FINGERPRINT_V2'                           |
  'ADD_HUB'                                      |
  'ADD_HUE_BRIDGE'                               |
  'ADD_HUE_LIGHT'                                |
  'ADD_INSTALLATION'                             |
  'ADD_LOCATION'                                 |
  'ADD_MESSAGE'                                  |
  'ADD_PROCESSED_FINGERPRINT'                    |
  'ADD_SCENE'                                    |
  'ADD_SORTED_LIST'                              |
  'ADD_SPHERE'                                   |
  'ADD_SPHERE_KEY'                               |
  'ADD_SPHERE_USER'                              |
  'ADD_STONE'                                    |
  'ADD_STONE_BEHAVIOUR'                          |
  'ADD_STONE_KEY'                                |
  'ADD_TOON'                                     |
  'APPEND_MESSAGE'                               |
  'CHANGE_DEV_SETTINGS'                          |
  'CLEAR_ACTIVE_SPHERE'                          |
  'CLEAR_DEVICE_DETAILS'                         |
  'CLEAR_LOCATION_POSITIONS'                     |
  'CLEAR_STONE_ERRORS'                           |
  'CLEAR_STONE_USAGE'                            |
  'CLEAR_USERS_IN_LOCATION'                      |
  'CLOUD_EVENT_'                                 |
  'CREATE_APP_IDENTIFIER'                        |
  'CYCLE_RANDOM_DEVICE_TOKEN'                    |
  'DEFINE_LOGGING_DETAILS'                       |
  'DEV_USER_UPDATE'                              |
  'FINISHED_'                                    |
  'INJECT_IDS'                                   |
  'LOCATION_REPAIR_PICTURE'                      |
  'LOCATION_UPDATE_PICTURE'                      |
  'MARK_ABILITY_AS_SYNCED'                       |
  'MARK_ABILITY_PROPERTY_AS_SYNCED'              |
  'MARK_MESSAGE_AS_DELETED'                      |
  'MARK_MESSAGE_AS_READ'                         |
  'MARK_STONE_BEHAVIOUR_AS_SYNCED'               |
  'MARK_STONE_BEHAVIOUR_FOR_DELETION'            |
  'REFRESH_ABILITIES'                            |
  'REFRESH_BEHAVIOURS'                           |
  'REFRESH_DEFAULTS'                             |
  'REMOVE_ABILITY_CLOUD_ID'                      |
  'REMOVE_ABILITY_PROPERTY_CLOUD_ID'             |
  'REMOVE_ALL_ABILITIES'                         |
  'REMOVE_ALL_ABILITY_PROPERTIES'                |
  'REMOVE_ALL_BEHAVIOURS_OF_STONE'               |
  'REMOVE_ALL_EVENTS'                            |
  'REMOVE_ALL_FINGERPRINTS_V2'                   |
  'REMOVE_ALL_HUBS'                              |
  'REMOVE_ALL_HUE_BRIDGES'                       |
  'REMOVE_ALL_HUE_LIGHTS'                        |
  'REMOVE_ALL_PROCESSED_FINGERPRINTS'            |
  'REMOVE_ALL_SCENES'                            |
  'REMOVE_ALL_TOONS'                             |
  'REMOVE_DEVICE'                                |
  'REMOVE_FINGERPRINT_V2'                        |
  'REMOVE_HUB'                                   |
  'REMOVE_HUE_BRIDGE'                            |
  'REMOVE_HUE_LIGHT'                             |
  'REMOVE_INSTALLATION'                          |
  'REMOVE_LOCATION'                              |
  'REMOVE_LOCATION_FINGERPRINT'                  |
  'REMOVE_MESSAGE'                               |
  'REMOVE_MESSAGE_DELETED'                       |
  'REMOVE_MESSAGE_READ'                          |
  'REMOVE_PROCESSED_FINGERPRINT'                 |
  'REMOVE_SCENE'                                 |
  'REMOVE_SORTED_LIST'                           |
  'REMOVE_SPHERE'                                |
  'REMOVE_SPHERE_KEY'                            |
  'REMOVE_SPHERE_USER'                           |
  'REMOVE_STONE'                                 |
  'REMOVE_STONE_BEHAVIOUR'                       |
  'REMOVE_STONE_KEY'                             |
  'REMOVE_TOON'                                  |
  'REMOVE_USER_FROM_ALL_LOCATIONS'               |
  'RESET_APP_SETTINGS'                           |
  'RESET_SPHERE_PRESENCE_STATE'                  |
  'RESET_STONE_ERRORS'                           |
  'REVERT_LOGGING_DETAILS'                       |
  'SET_ACTIVE_RANDOM_DEVICE_TOKEN'               |
  'SET_ACTIVE_SPHERE'                            |
  'SET_APP_IDENTIFIER'                           |
  'SET_BETA_ACCESS'                              |
  'SET_DEVELOPER_MODE'                           |
  'SET_LOCATION_POSITIONS'                       |
  'SET_LOGGING'                                  |
  'SET_NEW_BOOTLOADER_VERSIONS'                  |
  'SET_NEW_FIRMWARE_VERSIONS'                    |
  'SET_NOTIFICATION_TOKEN'                       |
  'SET_RSSI_OFFSET'                              |
  'SET_SPHERE_GPS_COORDINATES'                   |
  'SET_SPHERE_SMART_HOME_STATE'                  |
  'SET_SPHERE_STATE'                             |
  'SET_TRACKING_NUMBER'                          |
  'SPHERE_SCENE_REPAIR_PICTURE'                  |
  'SPHERE_USER_REPAIR_PICTURE'                   |
  'TOON_UPDATE_SCHEDULE'                         |
  'TOON_UPDATE_SETTINGS'                         |
  'TRY_NEW_DEVICE_TOKEN'                         |
  'UPDATED_STONE_TIME'                           |
  'UPDATE_ABILITY'                               |
  'UPDATE_ABILITY_AS_SYNCED_FROM_CLOUD'          |
  'UPDATE_ABILITY_CLOUD_ID'                      |
  'UPDATE_ABILITY_PROPERTY'                      |
  'UPDATE_ABILITY_PROPERTY_AS_SYNCED_FROM_CLOUD' |
  'UPDATE_ABILITY_PROPERTY_CLOUD_ID'             |
  'UPDATE_APP_SETTINGS'                          |
  'UPDATE_APP_STATE'                             |
  'UPDATE_BEHAVIOUR_CLOUD_ID'                    |
  'UPDATE_DELETE_MESSAGE'                        |
  'UPDATE_DELETE_MESSAGE_CLOUD_ID'               |
  'UPDATE_DEVICE_CLOUD_ID'                       |
  'UPDATE_DEVICE_CONFIG'                         |
  'UPDATE_FINGERPRINT_V2'                        |
  'UPDATE_FINGERPRINT_V2_CLOUD_ID'               |
  'UPDATE_HUB_CLOUD_ID'                          |
  'UPDATE_HUB_CONFIG'                            |
  'UPDATE_HUB_LOCATION'                          |
  'UPDATE_HUB_REACHABILITY'                      |
  'UPDATE_HUB_STATE'                             |
  'UPDATE_HUE_BRIDGE'                            |
  'UPDATE_HUE_BRIDGE_CLOUD_ID'                   |
  'UPDATE_HUE_LIGHT'                             |
  'UPDATE_HUE_LIGHT_AVAILABILITY'                |
  'UPDATE_HUE_LIGHT_CLOUD_ID'                    |
  'UPDATE_HUE_LIGHT_STATE'                       |
  'UPDATE_INSTALLATION_CONFIG'                   |
  'UPDATE_LOCATION_CLOUD_ID'                     |
  'UPDATE_LOCATION_CONFIG'                       |
  'UPDATE_LOCATION_FINGERPRINT'                  |
  'UPDATE_LOCATION_FINGERPRINT_CLOUD_ID'         |
  'UPDATE_MESSAGE_CLOUD_ID'                      |
  'UPDATE_NEW_LOCATION_FINGERPRINT'              |
  'UPDATE_PROCESSED_FINGERPRINT'                 |
  'UPDATE_READ_MESSAGE'                          |
  'UPDATE_READ_MESSAGE_CLOUD_ID'                 |
  'UPDATE_SCENE'                                 |
  'UPDATE_SCENE_CLOUD_ID'                        |
  'UPDATE_SORTED_LIST'                           |
  'UPDATE_SORTED_LIST_CLOUD_ID'                  |
  'UPDATE_SPHERE_CLOUD_ID'                       |
  'UPDATE_SPHERE_CONFIG'                         |
  'UPDATE_SPHERE_KEY'                            |
  'UPDATE_SPHERE_USER'                           |
  'UPDATE_STONE_BEHAVIOUR'                       |
  'UPDATE_STONE_CLOUD_ID'                        |
  'UPDATE_STONE_CONFIG'                          |
  'UPDATE_STONE_CONFIG_TRANSIENT'                |
  'UPDATE_STONE_DFU_RESET'                       |
  'UPDATE_STONE_ERRORS'                          |
  'UPDATE_STONE_HANDLE'                          |
  'UPDATE_STONE_KEY'                             |
  'UPDATE_STONE_LOCAL_CONFIG'                    |
  'UPDATE_STONE_LOCATION'                        |
  'UPDATE_STONE_REACHABILITY'                    |
  'UPDATE_STONE_STATE'                           |
  'UPDATE_STONE_SWITCH_STATE'                    |
  'UPDATE_STONE_SWITCH_STATE_TRANSIENT'          |
  'UPDATE_STONE_TIME_STATE'                      |
  'UPDATE_TOON'                                  |
  'UPDATE_TOON_CLOUD_ID'                         |
  'USER_APPEND'                                  |
  'USER_ENTER_LOCATION'                          |
  'USER_ENTER_SPHERE'                            |
  'USER_EXIT_LOCATION'                           |
  'USER_EXIT_SPHERE'                             |
  'USER_LOG_IN'                                  |
  'USER_REPAIR_PICTURE'                          |
  'USER_SEEN_TAP_TO_TOGGLE_ALERT'                |
  'USER_SEEN_TAP_TO_TOGGLE_DISABLED_ALERT'       |
  'USER_UPDATE'                                  |
  'USER_UPDATE_PICTURE'





interface AffectedIds {
  locationIds: Record<databaseId, true>,
  sphereIds:   Record<databaseId, true>,
  stoneIds:    Record<databaseId, true>,
  messageIds:  Record<databaseId, true>,
  toonIds:     Record<databaseId, true>,
  hubIds:      Record<databaseId, true>,
  id:          Record<databaseId, true>
}

type DatabaseEventType = 'updateActiveSphere' |
  'updateAppState'                  |
  'userPositionUpdate'              |
  'changeUsers'                     |
  'changeProcessedFingerprint'      |
  'changeFingerprint'               |
  'addLocation'                     |
  'changeLocations'                 |
  'updateLocationConfig'            |
  'removeLocation'                  |
  'changeLocationPositions'         |
  'changeSphereState'               |
  'changeSphereSmartHomeState'      |
  'addSphere'                       |
  'changeSpheres'                   |
  'changeSphereConfig'              |
  'removeSphere'                    |
  'addSphereUser'                   |
  'changeSphereUsers'               |
  'updateSphereUser'                |
  'removeSphereUser'                |
  'changeSphereUserPresence'        |
  'changeStoneHandle'               |
  'addStone'                        |
  'changeStones'                    |
  'updateStoneIdentificationConfig' |
  'updateStoneCoreConfig'           |
  'updateStoneConfig'               |
  'updateStoneErrors'               |
  'stoneLocationUpdated'            |
  'updateStoneSwitchState'          |
  'updateStoneState'                |
  'powerUsageUpdated'               |
  'stoneUsageUpdated'               |
  'removeStone'                     |
  'userLogin'                       |
  'changeUserData'                  |
  'changeUserDeveloperStatus'       |
  'changeDeveloperData'             |
  'changeDeviceData'                |
  'addedMessage'                    |
  'changeMessage'                   |
  'iChangedMessage'                 |
  'changeScenes'                    |
  'updateScene'                     |
  'changeAppSettings'               |
  'updatedToon'                     |
  'updatedCloudIds'                 |
  'stoneUsageUpdatedTransient'      |
  'updatedSphereKeys'               |
  'stoneChangeBehaviours'           |
  'stoneChangeAbilities'            |
  'stoneSyncedAbilities'            |
  'firmwareVersionsAvailable'       |
  'newTrackingNumberSet'            |
  'deviceTrackingTokenCycled'       |
  'deviceTrackingTokenTried'        |
  'hubLocationUpdated'              |
  'updateHubConfig'                 |
  'changeHubs'                      |
  'changeStoneAvailability'         |
  'totalAffectedIds'

type DatabaseChangeEventData = {
  [key in DatabaseEventType]?: AffectedIds;
};


