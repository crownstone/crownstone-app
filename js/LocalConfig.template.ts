const DeviceInfo = require('react-native-device-info');

/******************** RELEASE FLAGS ********************/

  // USED TO FAKE RELEASE MODE BUT WITH DEBUGGING
  const IGNORE_LOCAL_CONFIG = true;

  // ONLY CHANGE THIS LINE IF YOU WANT TO DISABLE RELEASE MODE
  export const FALLBACKS_ENABLED = true;

  // this is the name of the app in the database. It has to be exactly this to match the database entry for push notifications.
  // it is used to link an installation to a specific App.
  export const APP_NAME = 'Crownstone.consumer';

/******************** /RELEASE FLAGS ********************/




/******************** APP ********************/

  /**
   * enabling Debug behaviour throughout the app.
   */
  export let DEBUG = false;

  /**
   * Disable Native will automatically mock all BLE commands so the app can run in the simulator.
   * Silence cloud will silently reject all cloud calls.
   */
  export let SILENCE_CLOUD  = false;

  /**
   * IMPORTANT: ENCRYPTION_ENABLED determines how the app communicates with the crownstone
   * IMPORTANT: AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION sets the limit before indoor localization is allowed.
   */
  export let ENCRYPTION_ENABLED = true;   // Enable encryption for the app and the libs
  export const AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION = 4;


  /**
   * Switch to disable the usage of the mesh in the app
   */
  export const MESH_ENABLED = false;

  /**
   * Switch to disable the usage of the mesh in the app
   */
  export const HARDWARE_ERROR_REPORTING = false;

  /**
   * Switch to enable/disable the Dimming functionality
   */
  export const DIMMING_ENABLED = false;

  /**
   * Point to the production cloud.
   */
  // export let CLOUD_ADDRESS = 'https://cloud.crownstone.rocks/api/';            // point to the production cloud.
  export let CLOUD_ADDRESS = 'https://crownstone-cloud-dev.herokuapp.com/api/';   // point to the dev cloud.

  // point to the local cloud when using a phone
  // export let CLOUD_ADDRESS = DeviceInfo.getModel() !== "Simulator" ? 'http://10.27.8.130:3000/api/' : 'http://0.0.0.0:3000/api/';

/******************** /APP ********************/




/******************** LOGGING ********************/

  /**
   * Main logging settings.
   * These will override developer settings only if true but they are currently on by default in developer settings.
   */
  export let LOG_INFO       = true;    // enabling LOG.info       commands to be shown.
  export let LOG_WARNINGS   = true;    // enabling LOG.warn       commands to be shown.
  export let LOG_ERRORS     = true;    // enabling LOG.error      commands to be shown.
  export let LOG_MESH       = true;    // enabling LOG.mesh       commands to be shown.

  /**
   * Specific logging settings used for debugging mostly. These will override developer settings only if true.
   */
  export let LOG_VERBOSE    = false;   // enabling LOG.verbose    commands to be shown.
  export let LOG_SCHEDULER  = false;   // enabling LOG.scheduler  commands to be shown.
  export let LOG_BLE        = false;   // enabling LOG.ble        commands to be shown.
  export let LOG_EVENTS     = false;   // enabling LOG.event      commands to be shown.
  export let LOG_STORE      = true;    // enabling LOG.store      commands to be shown.
  export let LOG_CLOUD      = true;    // enabling LOG.cloud      commands to be shown.
  export let LOG_DEBUG      = false;   // enabling LOG.debug      commands to be shown.

  /**
   * Log to file. Even if this is false, if the user configures it in the user profile through the developer mode, logging to file will still be used.
   * This flag is meant to just always log to file, regardless of the user input. Used for debugging.
   */
  export let LOG_TO_FILE    = false;   // log everything that is logged to a file.

/******************** /LOGGING ********************/




/******************** TIMINGS ********************/

  // Network request handles the calls the cloud. If they take longer than 15 seconds, the requests will reject.
  export const NETWORK_REQUEST_TIMEOUT = 15000; //ms

  // Max duration of HF scanning. Meant to clean up in case the user does not. HF scanning is expensive for the battery.
  export const HIGH_FREQUENCY_SCAN_MAX_DURATION = 15000; //ms

  // The disable timeout determines how long we will keep showing the crownstone active (instead of searching...) since we last heard from it.
  export const DISABLE_TIMEOUT = 30000; //ms

  // settings for the keepAlive. The interval determines how often the keep alive fires, the attemps are the times it will try in total. 2 means 1 retry.
  export const KEEPALIVE_INTERVAL = 70; // s !
  export const KEEPALIVE_ATTEMPTS = 2;

  // in the event that only an away event (or only a near event) is configured,
  // reset the trigger if you spend this amount of milliseconds in the other zone.
  export const RESET_TIMER_FOR_NEAR_AWAY_EVENTS = 20000; // ms

  // Time until a scanned crownstone in setup mode is regarded to be gone.
  export const SETUP_MODE_TIMEOUT = 15000; // ms

  // Time until a scanned crownstone in DFU mode is regarded to be gone
  export const DFU_MODE_TIMEOUT = 15000; // ms

  // interval for syncing with the cloud.
  export const SYNC_INTERVAL = 60*10; // s

  // interval for syncing sphere users with the cloud so you see their faces in the app.
  export const SPHERE_USER_SYNC_INTERVAL = 10; // s --> 10 seconds

  // The amount of time to wait until the promise manager gives up on a pending promise.
  export const PROMISE_MANAGER_FALLBACK_TIMEOUT = 60000; // ms --> 1 minute

  // The amount of time the scheduler tick (setTimeout) waits between ticks. The normal heartbeat is by the ibeacon messages (once a second)
  export const SCHEDULER_FALLBACK_TICK = 4000; // ms --> 1 minute

  // the amount of time between the near/far switching. If you go from near->far, it will ignore the messages for the next TRIGGER_TIME_BETWEEN_SWITCHING_NEAR_AWAY ms
  export const TRIGGER_TIME_BETWEEN_SWITCHING_NEAR_AWAY = 2000; // ms

  // the amount of time we wait before accepting another tap to toggle to the same crownstone.
  export const TIME_BETWEEN_TAP_TO_TOGGLES = 5000; // ms

  // The time between batch uploads to the cloud.
  export const CLOUD_BATCH_UPDATE_INTERVAL = 10; // s

  // The amount of time to store the history of the power usage of stones.
  export const HISTORY_PERSISTENCE = 24*3600*1000; // ms

  // Interval in which the phone tells the Crownstone what time it is!
  export const STONE_TIME_REFRESH_INTERVAL = 5 * 3600 * 1000; // 5 hours in ms

/******************** /TIMINGS ********************/



/********************  DEV EXCEPTIONS ********************/

  // if this is enabled, you will always have the option to update the firmware and bootloader,
  // and all of them will be installed and a hard reset follows. This is to test the DFU.
  export const ALWAYS_DFU_UPDATE = false;

/******************** /DEV EXCEPTIONS ********************/