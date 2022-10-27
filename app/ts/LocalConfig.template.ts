import {LOG_LEVEL} from "./logging/LogLevels";

import DeviceInfo from 'react-native-device-info';
import { Platform } from "react-native";

/******************** RELEASE FLAGS ********************/


  // ONLY CHANGE THIS LINE IF YOU WANT TO DISABLE RELEASE MODE
  const RELEASE_MODE = false;

  // IF TRUE, USED TO FAKE RELEASE MODE BUT WITH DEBUGGING
  const IGNORE_LOCAL_CONFIG = false;

  export const FALLBACKS_ENABLED = true;

  // possiblity to block Sentry
  export let USE_ERROR_REPORTING = true;

  // DO NOT CHANGE THIS LINE.
  // the global is meant as a last resort, forcing release to true when compiled in release mode.
  // @ts-ignore
  export const RELEASE_MODE_USED = (RELEASE_MODE && DeviceInfo.getModel() !== "Simulator") || global.__DEV__ !== true;

  // this is the name of the app in the database. It has to be exactly this to match the database entry for push notifications.
  // it is used to link an installation to a specific App.
  export const APP_NAME = 'Crownstone.consumer';

  // WHEN DOING A RELEASE, MAKE SURE THIS FLAG IS SET TO FALSE
  export const DEBUG_MODE_ENABLED = false;

/******************** /RELEASE FLAGS ********************/


/**
 *  DO NOT CHANGE THESE VALUES BELOW THIS LINE. YOU CAN CHANGE THEM IN THE LOCAL CONFIG FILE!
 *
 *  To use local config, create a file called LocalConfig.ts next to this file. Any value you put in there will overwrite the matching one here.
 *  The local file is ignored if RELEASE_MODE is set to true.
 */


/******************** APP ********************/

  /**
   * enabling Debug behaviour throughout the app.
   */
  export let DEBUG = false;

  /**
   * Disable Native will automatically mock all BLE commands so the app can run in the simulator.
   * Silence cloud will silently reject all cloud calls.
   */
  export let DISABLE_NATIVE = DeviceInfo.isEmulatorSync();
  export let SILENCE_CLOUD  = false;

  /**
   * IMPORTANT: ENCRYPTION_ENABLED determines how the app communicates with the crownstone
   * IMPORTANT: AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION sets the limit before indoor localization is allowed.
   */
  export let ENCRYPTION_ENABLED = true;   // Enable encryption for the app and the libs
  export const AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION = 4;


  /**
   * Point to the production cloud.
   */
  export let CLOUD_ADDRESS    = 'https://cloud.crownstone.rocks/api/';
  export let CLOUD_V2_ADDRESS = 'https://next.crownstone.rocks/api/';

  /**
   * The app will not allow usage of crownstones with a lower version than this.
   */
  export let MINIMUM_REQUIRED_FIRMWARE_VERSION = '2.0.0';

  export let MINIMUM_FIRMWARE_VERSION_BROADCAST = '3.0.0';

/******************** /APP ********************/




/******************** LOGGING ********************/

  /**
   * Main logging settings.
   * These will override developer settings only if true but they are currently on by default in developer settings.
   */
  export let LOG_INFO            = LOG_LEVEL.ERROR;   // enabling LOG.info          commands to be shown.
  export let LOG_CONSTELLATION   = LOG_LEVEL.ERROR;    // enabling LOG.constellation commands to be shown.
  export let LOG_NOTIFICATIONS   = LOG_LEVEL.info;    // enabling LOG.notifications commands to be shown.
  export let LOG_WARNINGS        = LOG_LEVEL.ERROR;   // enabling LOG.warn          commands to be shown.
  export let LOG_ERRORS          = LOG_LEVEL.ERROR;   // enabling LOG.error         commands to be shown.
  export let LOG_MESSAGES        = LOG_LEVEL.ERROR;   // enabling LOG.mesh          commands to be shown.
  export let LOG_ADVERTISEMENTS  = LOG_LEVEL.ERROR;   // enabling LOG.advertisement commands to be shown.
  export let LOG_DFU             = LOG_LEVEL.ERROR;    // enabling LOG.dfu commands to be shown.
  export let LOG_NAVIGATION      = LOG_LEVEL.ERROR;    // enabling LOG.nav commands to be shown.



  /**
   * Specific logging settings used for debugging mostly. These will override developer settings only if true.
   */
  export let LOG_SCHEDULER  = LOG_LEVEL.ERROR;      // enabling LOG.scheduler  commands to be shown.
  export let LOG_BLE        = LOG_LEVEL.ERROR;      // enabling LOG.ble        commands to be shown.
  export let LOG_EVENTS     = LOG_LEVEL.ERROR;      // enabling LOG.event      commands to be shown.
  export let LOG_STORE      = LOG_LEVEL.ERROR;      // enabling LOG.store      commands to be shown.
  export let LOG_CLOUD      = LOG_LEVEL.ERROR;      // enabling LOG.cloud      commands to be shown.
  export let LOG_NATIVE     = LOG_LEVEL.ERROR;      // enabling LOG.native     commands to be shown.

  export let STREAM_FULL_LOGS   = false;         // DEBUG ONLY Set to true for logstreaming.
  export let LOG_TIMESTAMPS     = false;         // DEBUG ONLY add timestamps to console.logs. Files always have timestamps.
  export let LOG_TIME_DIFFS     = false;         // DEBUG ONLY add dt since last log to logs.

/******************** /LOGGING ********************/




/******************** TIMINGS ********************/

  // Network request handles the calls the cloud. If they take longer than 15 seconds, the requests will reject.
  export const NETWORK_REQUEST_TIMEOUT = 15000; //ms

  // Max duration of HF scanning. Meant to clean up in case the user does not. HF scanning is expensive for the battery.
  export const HIGH_FREQUENCY_SCAN_MAX_DURATION = 15000; //ms

  // The disable timeout determines how long we will keep showing the crownstone active (instead of searching...) since we last heard from it.
  export const DISABLE_TIMEOUT = 120000; //ms == 2 min

  // settings for the keepAlive. The interval determines how often the keep alive fires, the attemps are the times it will try in total. 2 means 1 retry.
  export const KEEPALIVE_INTERVAL = 70; // s !
  export const KEEPALIVE_ATTEMPTS = 2;

  // Time until a scanned crownstone in setup mode is regarded to be gone.
  export const SETUP_MODE_TIMEOUT = 15000; // ms

  // Time until a scanned crownstone in DFU mode is regarded to be gone
  export const DFU_MODE_TIMEOUT = 15000; // ms

  // interval for syncing with the cloud.
  export const SYNC_INTERVAL = 60*10; // s --> 10 minutes

  // interval for syncing sphere users with the cloud so you see their faces in the app.
  export const CLOUD_POLLING_INTERVAL = 15; // s --> 10 seconds

  // The amount of time to wait until the promise manager gives up on a pending promise.
  export const PROMISE_MANAGER_FALLBACK_TIMEOUT = 60000; // ms --> 1 minute

  // The amount of time the scheduler tick (setTimeout) waits between ticks. The normal heartbeat is by the ibeacons messages (once a second)
  export const SCHEDULER_FALLBACK_TICK = 4000; // ms --> 1 minute

  // the amount of time between the near/far switching. If you go from near->far, it will ignore the messages for the next TRIGGER_TIME_BETWEEN_SWITCHING_NEAR_AWAY ms
  export const TRIGGER_TIME_BETWEEN_SWITCHING_NEAR_AWAY = 2000; // ms

  // the amount of time we wait before accepting another tap to toggle to the same crownstone.
  export const TIME_BETWEEN_TAP_TO_TOGGLES = 5000; // ms

  // The time between batch uploads to the cloud.
  export const CLOUD_BATCH_UPDATE_INTERVAL = 10; // s

  // Interval in which the phone tells the Crownstone what time it is!
  export const STONE_TIME_REFRESH_INTERVAL = 5 * 3600 * 1000; // 5 hours in ms

  // Minimum interval between broadcast elements.
  export let BROADCAST_THROTTLE_TIME;
  if (Platform.OS === 'android') { BROADCAST_THROTTLE_TIME = 100; }
  else                           { BROADCAST_THROTTLE_TIME = 100; }

/******************** /TIMINGS ********************/




/********************  DEV EXCEPTIONS ********************/

  // if this is enabled, you will always have the option to update the firmware and bootloader,
  // and all of them will be installed and a hard reset follows. This is to test the DFU.
  export const ALWAYS_DFU_UPDATE_BOOTLOADER = false;
  export const ALWAYS_DFU_UPDATE_FIRMWARE = false;

/******************** /DEV EXCEPTIONS ********************/




/******************** LOCAL OVERRIDE ********************/

// force flags based on release modes
if (RELEASE_MODE_USED === false && !IGNORE_LOCAL_CONFIG) {
  //override settings with local config, if it exists
  try {
  let localConfig = require('./LocalConfig');
  let localKeys = Object.keys(localConfig);
  for (let i = 0; i < localKeys.length; i++) {
    if (module.exports[localKeys[i]] !== undefined && module.exports[localKeys[i]] !== localConfig[localKeys[i]]) {
    console.log("LOCAL CONFIG OVERRIDE", localKeys[i], module.exports[localKeys[i]], 'to', localConfig[localKeys[i]]);
    module.exports[localKeys[i]] = localConfig[localKeys[i]];
    }
  }
  console.log("USING CONFIG", module.exports);
  } catch (err : any) {
  // cant find local config. ignore import.
  }
}


/******************** /LOCAL OVERRIDE ********************/
