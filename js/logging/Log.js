import { Platform } from 'react-native';
import {
  LOGGING,
  ERROR_LOGGING,
  DEBUG_LOGGING,
  DEBUG_CLOUD,
  DEBUG_BLE,
  DEBUG_STORE,
  DEBUG_SCHEDULER,
  RELEASE_MODE,
  LOG_TO_FILE,
} from '../ExternalConfig'
import RNFS from 'react-native-fs'
import { eventBus } from '../util/eventBus'
const DeviceInfo = require('react-native-device-info');

export const LOG = function() {
  if (LOGGING) {
    let args = ['LOG ------------ :'];
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    logToFile.apply(this, args);

    if (RELEASE_MODE === false)
      console.log.apply(this, args);
  }
};


export const LOGError = function() {
  if (ERROR_LOGGING) {
    let args = ['LOG ERROR !!!!! -- :'];
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    logToFile.apply(this, args);

    if (RELEASE_MODE === false)
      console.log.apply(this, args);
  }
};


export const LOGDebug = function() {
  if (DEBUG_LOGGING) {
    let args = ['LOG Debug ------- :'];
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    logToFile.apply(this, args);

    if (RELEASE_MODE === false)
      console.log.apply(this, args);
  }
};

export const LOGCloud = function() {
  if (DEBUG_CLOUD) {
    let args = ['LOG Cloud ------ :'];
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    logToFile.apply(this, args);

    if (RELEASE_MODE === false)
      console.log.apply(this, args);
  }
};

export const LOGBle = function() {
  if (DEBUG_BLE) {
    let args = ['LOG BLE -------- :'];
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    logToFile.apply(this, args);

    if (RELEASE_MODE === false)
      console.log.apply(this, args);
  }
};


export const LOGStore = function() {
  if (DEBUG_STORE) {
    let args = ['LOG Store ------ :'];
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    logToFile.apply(this, args);

    if (RELEASE_MODE === false)
      console.log.apply(this, args);
  }
};


export const LOGScheduler = function() {
  if (DEBUG_SCHEDULER) {
    let args = ['LOG Scheduler --- :'];
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    logToFile.apply(this, args);

    if (RELEASE_MODE === false)
      console.log.apply(this, args);
  }
};


function logToFile() {
  if (LOG_TO_FILE || LogProcessor.writeToFile === true) {
    // create a path you want to write to
    // TODO: move to util
    let path = RNFS.DocumentDirectoryPath + '/consumerAppLog.log';
    if (Platform.OS === 'android') {
      path = RNFS.ExternalDirectoryPath + '/consumerAppLog.log';
    }

    //create string
    let str = '' + new Date().valueOf() + ' - ' + new Date() + " -";
    for (let i = 0; i < arguments.length; i++) {
      if (typeof arguments[i] === 'object' || Array.isArray(arguments[i])) {
        str += " " + JSON.stringify(arguments[i])
      }
      else {
        str += " " + arguments[i]
      }
    }
    str += " \n";

    // write the file
    RNFS.appendFile(path, str, 'utf8')
      .then((success) => {
        // console.log('logWritten');
      })
      .catch((err) => {
        // console.log(err.message);
      });
  }
}

class LogProcessorClass {
  constructor() {
    this.store = undefined;
    this.eventListener = undefined;
    this.writeToFile = false;
  }

  loadStore(store) {
    this.store = store;
    this.eventListener = eventBus.on("databaseChange", (data) => {
      if (data.change.changeUserDeveloperStatus === true) {
        this.refreshData();
      }
    });
    this.refreshData();

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
  }

  refreshData() {
    if (this.store) {
      let state = this.store.getState();
      this.writeToFile = state.user.developer === true && state.user.logging === true;
    }
  }
}

export const LogProcessor = new LogProcessorClass();