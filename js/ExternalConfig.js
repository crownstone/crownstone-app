// @flow

import { LOG } from './logging/Log'
import { Platform } from 'react-native'

const DeviceInfo = require('react-native-device-info');

LOG("Device Manufacturer", DeviceInfo.getManufacturer());  // e.g. Apple
LOG("Device Brand", DeviceInfo.getBrand());  // e.g. Apple / htc / Xiaomi
LOG("Device Model", DeviceInfo.getModel());  // e.g. iPhone 6
LOG("Device ID", DeviceInfo.getDeviceId());  // e.g. iPhone7,2 / or the board on Android e.g. goldfish
LOG("System Name", DeviceInfo.getSystemName());  // e.g. iPhone OS
LOG("System Version", DeviceInfo.getSystemVersion());  // e.g. 9.0
LOG("Bundle ID", DeviceInfo.getBundleId());  // e.g. com.learnium.mobile
LOG("Build Number", DeviceInfo.getBuildNumber());  // e.g. 89
LOG("App Version", DeviceInfo.getVersion());  // e.g. 1.1.0
LOG("App Version (Readable)", DeviceInfo.getReadableVersion());  // e.g. 1.1.0.89
LOG("Device Name", DeviceInfo.getDeviceName());  // e.g. Becca's iPhone 6
LOG("User Agent", DeviceInfo.getUserAgent()); // e.g. Dalvik/2.1.0 (Linux; U; Android 5.1; Google Nexus 4 - 5.1.0 - API 22 - 768x1280 Build/LMY47D)
LOG("Device Locale", DeviceInfo.getDeviceLocale()); // e.g en-US
LOG("Device Country", DeviceInfo.getDeviceCountry()); // e.g US
LOG("App Instance ID", DeviceInfo.getInstanceID()); // ANDROID ONLY - see https://developers.google.com/instance-id/

export const CLOUD_ADDRESS = 'https://crownstone-cloud.herokuapp.com/api/';


export let DEBUG           = false; // enabling Debug behaviour throughout the app.
export let DEBUG_STORE     = true;  // enabling LOGStore      commands to be shown.
export let DEBUG_SCHEDULER = false; // enabling LOGScheduler  commands to be shown.
export let DEBUG_BLE       = false; // enabling LOGBle        commands to be shown.
export let DEBUG_CLOUD     = true;  // enabling LOGCloud      commands to be shown.
export let DEBUG_LOGGING   = true;  // enabling LOGDebug      commands to be shown.
export let LOGGING         = true;  // enabling LOG           commands to be shown.

export let LOG_TO_FILE     = false; // log everything that is logged to a file.

export let ERROR_LOGGING   = true;  // enabling LOGError      commands to be shown.

export let DISABLE_NATIVE = DeviceInfo.getModel() === "Simulator"; // this will disable the native calls.
export let SILENCE_CLOUD = false; // this will silently cancel all calls to the cloud.
export let OVERRIDE_DATABASE = false;

export let NO_LOCATION_NAME = 'None'; // this is a let because localization may change it.

export let ENCRYPTION_ENABLED = true;

export const AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION = 4;

export const NETWORK_REQUEST_TIMEOUT = 15000; //ms
export const HIGH_FREQUENCY_SCAN_MAX_DURATION = 15000; //ms
export const DISABLE_TIMEOUT = 30000; //ms
export const KEEPALIVE_INTERVAL = 60; // s !

// WHEN RELEASING: SET THIS TO TRUE
export const RELEASE_MODE = true;

if (RELEASE_MODE) {
  DEBUG           = false;
  DEBUG_STORE     = false;
  DEBUG_SCHEDULER = false;
  DEBUG_BLE       = false;
  DEBUG_CLOUD     = false;
  DEBUG_LOGGING   = false;
  LOGGING         = false;
  LOG_TO_FILE     = false;
  ERROR_LOGGING   = false;
  DISABLE_NATIVE  = false;
  SILENCE_CLOUD   = false;
  OVERRIDE_DATABASE = false;
  ENCRYPTION_ENABLED = true;
}