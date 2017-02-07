import { LOG } from './logging/Log'
import { Platform } from 'react-native'

export const VERSION = '0.8.0:D0.0.0';


const DeviceInfo = require('react-native-device-info');

// refer to the DEV cloud
export let CLOUD_ADDRESS = 'https://crownstone-cloud-dev.herokuapp.com/api/';

export let DEBUG           = true;  // enabling Debug behaviour throughout the app.
export let DEBUG_STORE     = true;  // enabling LOGStore      commands to be shown.
export let DEBUG_SCHEDULER = false; // enabling LOGScheduler  commands to be shown.
export let DEBUG_BLE       = false; // enabling LOGBle        commands to be shown.
export let DEBUG_CLOUD     = true;  // enabling LOGCloud      commands to be shown.
export let DEBUG_LOGGING   = true;  // enabling LOGDebug      commands to be shown.
export let LOGGING         = true;  // enabling LOG           commands to be shown.

export let LOG_TO_FILE     = false; // log everything that is logged to a file.

export let ERROR_LOGGING   = true;  // enabling LOGError      commands to be shown.

export let DISABLE_NATIVE = DeviceInfo.getModel() === "Simulator"; // this will disable the native calls.
export let SILENCE_CLOUD  = false; // this will silently cancel all calls to the cloud.
export let OVERRIDE_DATABASE = false;

export let NO_LOCATION_NAME = 'None'; // this is a let because localization may change it.

export let ENCRYPTION_ENABLED = true;

export const AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION = 4;

export const NETWORK_REQUEST_TIMEOUT = 15000; //ms
export const HIGH_FREQUENCY_SCAN_MAX_DURATION = 15000; //ms
export const DISABLE_TIMEOUT = 30000; //ms

export const KEEPALIVE_INTERVAL = 60; // s !
export const KEEPALIVE_REPEAT_ATTEMPTS = 1;
export const KEEPALIVE_REPEAT_INTERVAL = 5000; // ms

// in the event that only an away event (or only a near event) is configured,
// reset the trigger if you spend this amount of milliseconds in the other zone.
export const RESET_TIMER_FOR_NEAR_AWAY_EVENTS = 20000; // ms

// WHEN RELEASING: SET THIS TO TRUE
export const RELEASE_MODE = true && DeviceInfo.getModel() !== "Simulator";

if (RELEASE_MODE) {
  LOG.info("====================   ============================   ===================");
  LOG.info("====================   === RUNNING RELEASE MODE ===   ===================");
  LOG.info("====================   ============================   ===================");
  CLOUD_ADDRESS = 'https://cloud.crownstone.rocks/api/';

  DEBUG           = false;
  DEBUG_STORE     = false;
  DEBUG_SCHEDULER = false;
  DEBUG_BLE       = false;
  DEBUG_CLOUD     = false;
  DEBUG_LOGGING   = false;
  LOG_TO_FILE     = false;

  LOGGING         = true;
  ERROR_LOGGING   = true;
  DISABLE_NATIVE  = false;
  SILENCE_CLOUD   = false;
  OVERRIDE_DATABASE = false;
  ENCRYPTION_ENABLED = true;
}
else {
  LOG.info("!!!!!!!!!!!!!!!!!!   !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!   !!!!!!!!!!!!!!!!!");
  LOG.info("!!!!!!!!!!!!!!!!!!   !!! RUNNING DEVELOPMENT MODE !!!   !!!!!!!!!!!!!!!!!");
  LOG.info("!!!!!!!!!!!!!!!!!!   !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!   !!!!!!!!!!!!!!!!!");
}