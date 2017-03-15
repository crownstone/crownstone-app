const DeviceInfo = require('react-native-device-info');

// refer to the DEV cloud
export let CLOUD_ADDRESS = 'https://crownstone-cloud-dev.herokuapp.com/api/';

export let DEBUG          = true;   // enabling Debug behaviour throughout the app.
export let LOG_SCHEDULER  = false;  // enabling LOG.scheduler  commands to be shown.
export let LOG_BLE        = false;   // enabling LOG.ble        commands to be shown.
export let LOG_EVENTS     = true;   // enabling LOG.event      commands to be shown.
export let LOG_STORE      = false;   // enabling LOG.store      commands to be shown.
export let LOG_MESH       = true;   // enabling LOG.mesh       commands to be shown.
export let LOG_CLOUD      = true;  // enabling LOG.cloud      commands to be shown.
export let LOG_DEBUG      = true;   // enabling LOG.debug      commands to be shown.
export let LOGGING        = true;   // enabling LOG.info       commands to be shown.

export let LOG_ERRORS     = true;  // enabling LOG.warn      commands to be shown.
export let LOG_WARNINGS   = true;  // enabling LOG.warn      commands to be shown.
export let LOG_VERBOSE    = true; // enabling LOG.verbose  commands to be shown.

export let LOG_TO_FILE    = false; // log everything that is logged to a file.

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

// in the event that only an away event (or only a near event) is configured,
// reset the trigger if you spend this amount of milliseconds in the other zone.
export const RESET_TIMER_FOR_NEAR_AWAY_EVENTS = 20000; // ms

// WHEN RELEASING: SET THIS TO TRUE
export const RELEASE_MODE = false && DeviceInfo.getModel() !== "Simulator";

export const TESTING_IN_PROCESS : boolean = true;

export let LOCAL_TESTING = false;

if (RELEASE_MODE) {

  if (!TESTING_IN_PROCESS) {
    CLOUD_ADDRESS = 'https://cloud.crownstone.rocks/api/';
  }

  LOCAL_TESTING = false;

  DEBUG           = false;
  LOG_STORE       = false;
  LOG_SCHEDULER   = false;
  LOG_MESH        = false;
  LOG_EVENTS      = false;
  LOG_BLE         = false;
  LOG_CLOUD       = false;
  LOG_DEBUG       = false;
  LOG_TO_FILE     = false;

  LOGGING         = true;
  LOG_VERBOSE     = true;
  LOG_WARNINGS    = true;
  LOG_ERRORS      = true;
  DISABLE_NATIVE  = false;
  SILENCE_CLOUD   = false;
  OVERRIDE_DATABASE = false;
  ENCRYPTION_ENABLED = true;
}
else {
  if (LOCAL_TESTING) {
    CLOUD_ADDRESS = 'http://0.0.0.0:3000/api/';
  }
}
