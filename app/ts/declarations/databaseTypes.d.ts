interface SyncEvent {
  id: string,
  localId: string,
  sphereId: string,
  stoneId: string,
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

interface SceneData {
  id:            string,
  name:          string,
  picture:       string,
  pictureId:     string,
  pictureSource: "STOCK" | "CUSTOM", // PICTURE_GALLERY_TYPES
  cloudId:       string | null,
  data:          { [key: number] : number }, // stoneUID: switchState
  updatedAt:     number
};

interface EncryptionKeyData {
  id: string,
  key: string,
  keyType: string,
  createdAt: number,
  ttl: number
}

interface DatabaseAction {
  type: ACTION_TYPE | 'NOT_REQUIRED',
  sphereId?    : string,
  locationId?  : string,
  sceneId?     : string,
  messageId?   : string,
  stoneId?     : string,
  keyId?       : string,
  hubId?       : string,
  ruleId?      : string,
  abilityId?   : string,
  propertyId?  : string,
  userId?      : string,
  toonId?      : string,
  triggeredBySync? : boolean,
  __test?          : boolean,
  __purelyLocal?   : boolean,
  __noEvents?      : boolean,
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
                      'FINISHED_REMOVE_DEVICES'             |                            
                      'FINISHED_REMOVE_MESSAGES'            |                              
                      'FINISHED_SPECIAL_USER'               |                          
                      'FINISHED_SPECIAL_LOCATIONS'          |                                
                      'FINISHED_SPECIAL_STONES'             |                            
                      'FINISHED_SPECIAL_INSTALLATIONS'      |                                    
                      'FINISHED_SPECIAL_DEVICES'            |                              
                      'FINISHED_SPECIAL_MESSAGES'           |                              
                      'FINISHED_SPECIAL_SCENES'                                         

type ACTION_TYPE = SYSTEM_ACTION_TYPES | EVENT_ACTION_TYPES     |
                      'INJECT_IDS'                              |
                      'ADD_STONE_KEY'                           |
                      'UPDATE_STONE_KEY'                        |
                      'REFRESH_DEFAULTS'                        |
                      'REMOVE_STONE_KEY'                        |
                      'UPDATED_STONE_TIME'                      |
                      'REFRESH_DEFAULTS'                        |
                      'UPDATE_STONE_REACHABILITY'               |
                      'REFRESH_DEFAULTS'                        |
                      'UPDATE_ABILITY_AS_SYNCED_FROM_CLOUD'     |
                      'ADD_STONE'                               |
                      'ADD_ABILITY'                             |
                      'UPDATE_ABILITY'                          |
                      'MARK_ABILITY_AS_SYNCED'                  |
                      'UPDATE_ABILITY_CLOUD_ID'                 |
                      'REMOVE_ABILITY_CLOUD_ID'                 |
                      'REFRESH_ABILITIES'                       |
                      'REFRESH_DEFAULTS'                        |
                      'ADD_STONE'                               |
                      'UPDATE_ABILITY_PROPERTY_AS_SYNCED_FROM_CLOUD' |
                      'ADD_ABILITY_PROPERTY'                    |
                      'UPDATE_ABILITY_PROPERTY'                 |
                      'UPDATE_ABILITY_PROPERTY_CLOUD_ID'        |
                      'REMOVE_ABILITY_PROPERTY_CLOUD_ID'        |
                      'MARK_ABILITY_PROPERTY_AS_SYNCED'         |
                      'REFRESH_ABILITIES'                       |
                      'REFRESH_DEFAULTS'                        |
                      'REMOVE_ALL_ABILITY_PROPERTIES'           |
                      'ADD_STONE'                               |
                      'REMOVE_ALL_ABILITIES'                    |
                      'REFRESH_DEFAULTS'                        |
                      'REFRESH_ABILITIES'                       |
                      'REFRESH_DEFAULTS'                        |
                      'REFRESH_ABILITIES'                       |
                      'REFRESH_DEFAULTS'                        |
                      'REFRESH_ABILITIES'                       |
                      'REFRESH_DEFAULTS'                        |
                      'UPDATE_RULE_CLOUD_ID'                    |
                      'INJECT_IDS'                              |
                      'ADD_STONE_RULE'                          |
                      'UPDATE_STONE_RULE'                       |
                      'REFRESH_BEHAVIOURS'                      |
                      'MARK_STONE_RULE_FOR_DELETION'            |
                      'MARK_STONE_RULE_AS_SYNCED'               |
                      'REFRESH_DEFAULTS'                        |
                      'REMOVE_ALL_RULES_OF_STONE'               |
                      'REMOVE_STONE_RULE'                       |
                      'USER_ENTER_LOCATION'                     |
                      'USER_EXIT_LOCATION'                      |
                      'CLEAR_USERS_IN_LOCATION'                 |
                      'UPDATE_LOCATION_CLOUD_ID'                |
                      'REMOVE_LOCATION_FINGERPRINT'             |
                      'UPDATE_LOCATION_FINGERPRINT'             |
                      'UPDATE_NEW_LOCATION_FINGERPRINT'         |
                      'UPDATE_LOCATION_FINGERPRINT_CLOUD_ID'    |
                      'ADD_LOCATION'                            |
                      'UPDATE_LOCATION_CONFIG'                  |
                      'LOCATION_UPDATE_PICTURE'                 |
                      'LOCATION_REPAIR_PICTURE'                 |
                      'REFRESH_DEFAULTS'                        |
                      'SET_LOCATION_POSITIONS'                  |
                      'CLEAR_LOCATION_POSITIONS'                |
                      'REFRESH_DEFAULTS'                        |
                      'REMOVE_SPHERE_USER'                      |
                      'REMOVE_LOCATION'                         |
                      'INJECT_IDS'                              |
                      'UPDATE_DEVICE_CLOUD_ID'                  |
                      'SET_RSSI_OFFSET'                         |
                      'TRY_NEW_DEVICE_TOKEN'                    |
                      'CYCLE_RANDOM_DEVICE_TOKEN'               |
                      'SET_ACTIVE_RANDOM_DEVICE_TOKEN'          |
                      'SET_TRACKING_NUMBER'                     |
                      'ADD_DEVICE'                              |
                      'CLEAR_DEVICE_DETAILS'                    |
                      'UPDATE_DEVICE_CONFIG'                    |
                      'REFRESH_DEFAULTS'                        |
                      'REMOVE_DEVICE'                           |
                      'INJECT_IDS'                              |
                      'UPDATE_HUE_BRIDGE_CLOUD_ID'              |
                      'ADD_HUE_BRIDGE'                          |
                      'UPDATE_HUE_BRIDGE'                       |
                      'REFRESH_DEFAULTS'                        |
                      'INJECT_IDS'                              |
                      'UPDATE_HUE_LIGHT_CLOUD_ID'               |
                      'ADD_HUE_LIGHT'                           |
                      'UPDATE_HUE_LIGHT'                        |
                      'UPDATE_HUE_LIGHT_STATE'                  |
                      'UPDATE_HUE_LIGHT_AVAILABILITY'           |
                      'REFRESH_DEFAULTS'                        |
                      'REMOVE_HUE_LIGHT'                        |
                      'REMOVE_ALL_HUE_LIGHTS'                   |
                      'REMOVE_HUE_BRIDGE'                       |
                      'REMOVE_ALL_HUE_BRIDGES'                  |
                      'INJECT_IDS'                              |
                      'UPDATE_TOON_CLOUD_ID'                    |
                      'ADD_TOON'                                |
                      'UPDATE_TOON'                             |
                      'TOON_UPDATE_SETTINGS'                    |
                      'TOON_UPDATE_SCHEDULE'                    |
                      'REFRESH_DEFAULTS'                        |
                      'REMOVE_TOON'                             |
                      'REMOVE_ALL_TOONS'                        |
                      'INJECT_IDS'                              |
                      'UPDATE_SORTED_LIST_CLOUD_ID'             |
                      'ADD_SORTED_LIST'                         |
                      'UPDATE_SORTED_LIST'                      |
                      'REFRESH_DEFAULTS'                        |
                      'REMOVE_SORTED_LIST'                      |
                      'UPDATE_STONE_CLOUD_ID'                   |
                      'UPDATE_MESH_NETWORK_ID'                  |
                      'UPDATE_STONE_HANDLE'                     |
                      'UPDATE_STONE_DFU_RESET'                  |
                      'UPDATE_STONE_LOCAL_CONFIG'               |
                      'ADD_STONE'                               |
                      'UPDATE_STONE_CONFIG'                     |
                      'UPDATE_STONE_CONFIG_TRANSIENT'           |
                      'UPDATE_STONE_LOCATION'                   |
                      'REFRESH_DEFAULTS'                        |
                      'CLEAR_STONE_USAGE'                       |
                      'UPDATE_STONE_TIME_STATE'                 |
                      'UPDATED_STONE_TIME'                      |
                      'UPDATE_STONE_STATE'                      |
                      'UPDATE_STONE_SWITCH_STATE'               |
                      'UPDATE_STONE_SWITCH_STATE_TRANSIENT'     |
                      'REFRESH_DEFAULTS'                        |
                      'UPDATE_STONE_ERRORS'                     |
                      'RESET_STONE_ERRORS'                      |
                      'CLEAR_STONE_ERRORS'                      |
                      'REFRESH_DEFAULTS'                        |
                      'REMOVE_STONE'                            |
                      'INJECT_IDS'                              |
                      'UPDATE_MESSAGE_CLOUD_ID'                 |
                      'ADD_MESSAGE'                             |
                      'APPEND_MESSAGE'                          |
                      'ADD_CLOUD_MESSAGE'                       |
                      'I_RECEIVED_MESSAGE'                      |
                      'REFRESH_DEFAULTS'                        |
                      'ADD_CLOUD_MESSAGE'                       |
                      'ADD_MESSAGE'                             |
                      'I_RECEIVED_MESSAGE'                      |
                      'RECEIVED_MESSAGE'                        |
                      'I_READ_MESSAGE'                          |
                      'READ_MESSAGE'                            |
                      'REMOVE_MESSAGE'                          |
                      'RESET_APP_SETTINGS'                      |
                      'SET_NOTIFICATION_TOKEN'                  |
                      'SET_ACTIVE_SPHERE'                       |
                      'CLEAR_ACTIVE_SPHERE'                     |
                      'UPDATE_APP_STATE'                        |
                      'UPDATE_APP_SETTINGS'                     |
                      'REFRESH_DEFAULTS'                        |
                      'INJECT_IDS'                              |
                      'UPDATE_SCENE_CLOUD_ID'                   |
                      'ADD_SCENE'                               |
                      'UPDATE_SCENE'                            |
                      'SPHERE_SCENE_REPAIR_PICTURE'             |
                      'REFRESH_DEFAULTS'                        |
                      'REMOVE_ALL_SCENES'                       |
                      'REMOVE_SCENE'                            |
                      'INJECT_IDS'                              |
                      'ADD_SPHERE_KEY'                          |
                      'UPDATE_SPHERE_KEY'                       |
                      'REFRESH_DEFAULTS'                        |
                      'REMOVE_SPHERE_KEY'                       |
                      'UPDATE_HUB_CLOUD_ID'                     |
                      'UPDATE_HUB_LOCATION'                     |
                      'ADD_HUB'                                 |
                      'UPDATE_HUB_CONFIG'                       |
                      'REFRESH_DEFAULTS'                        |
                      'UPDATE_HUB_STATE'                        |
                      'REFRESH_DEFAULTS'                        |
                      'UPDATE_HUB_REACHABILITY'                 |
                      'REFRESH_DEFAULTS'                        |
                      'REMOVE_ALL_HUBS'                         |
                      'REMOVE_HUB'                              |
                      'SET_LOGGING'                             |
                      'CHANGE_DEV_SETTINGS'                     |
                      'DEFINE_LOGGING_DETAILS'                  |
                      'REVERT_LOGGING_DETAILS'                  |
                      'REFRESH_DEFAULTS'                        |
                      'DEV_USER_UPDATE'                         |
                      'REVERT_LOGGING_DETAILS'                  |
                      'REFRESH_DEFAULTS'                        |
                      'INJECT_IDS'                              |
                      'REMOVE_ALL_EVENTS'                       |
                      'INJECT_IDS'                              |
                      'ADD_INSTALLATION'                        |
                      'UPDATE_INSTALLATION_CONFIG'              |
                      'REFRESH_DEFAULTS'                        |
                      'REMOVE_INSTALLATION'                     |
                      'UPDATE_SPHERE_CLOUD_ID'                  |
                      'SET_SPHERE_GPS_COORDINATES'              |
                      'ADD_SPHERE'                              |
                      'UPDATE_SPHERE_CONFIG'                    |
                      'REFRESH_DEFAULTS'                        |
                      'RESET_SPHERE_PRESENCE_STATE'             |
                      'SET_SPHERE_MESSAGE_STATE'                |
                      'SET_SPHERE_SMART_HOME_STATE'             |
                      'SET_SPHERE_STATE'                        |
                      'REFRESH_DEFAULTS'                        |
                      'REMOVE_SPHERE'                           |
                      'SET_DEVELOPER_MODE'                      |
                      'SET_BETA_ACCESS'                         |
                      'SET_NEW_BOOTLOADER_VERSIONS'             |
                      'SET_NEW_FIRMWARE_VERSIONS'               |
                      'CREATE_APP_IDENTIFIER'                   |
                      'SET_APP_IDENTIFIER'                      |
                      'USER_SEEN_TAP_TO_TOGGLE_ALERT'           |
                      'USER_SEEN_TAP_TO_TOGGLE_DISABLED_ALERT'  |
                      'USER_LOG_IN'                             |
                      'USER_APPEND'                             |
                      'USER_UPDATE'                             |
                      'USER_UPDATE_PICTURE'                     |
                      'USER_REPAIR_PICTURE'                     |
                      'REFRESH_DEFAULTS'                        |
                      'INJECT_IDS'                              |
                      'USER_ENTER_SPHERE'                       |
                      'USER_EXIT_SPHERE'                        |
                      'ADD_SPHERE_USER'                         |
                      'UPDATE_SPHERE_USER'                      |
                      'SPHERE_USER_REPAIR_PICTURE'              |
                      'REFRESH_DEFAULTS'                        |
                      'REMOVE_SPHERE_USER'                      
  




