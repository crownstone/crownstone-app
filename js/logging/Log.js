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
import { safeDeleteFile } from '../util/util'
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
    let args = ['LOG ERROR !!! -- :'];
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
    let args = ['LOG Debug ------ :'];
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

function getFilename(timestamp) {
  let dateStamp = new Date(timestamp).getFullYear() + "-" + (new Date(timestamp).getMonth()+1) + "-" + (new Date(timestamp).getDate());
  return 'ConsumerAppLog' + dateStamp + '.log';;
}

function cleanLogs(logPath, amountOfDaysStored = 3) {
  let allowedLogFiles = {};
  for (let i = 0; i < amountOfDaysStored; i++) {
    let timestamp = new Date().valueOf() - i*86400000;
    allowedLogFiles[getFilename(timestamp)] = true;
  }

  let flagForRemoval = [];
  RNFS.readdir(logPath)
    .then((files) => {
      for (let i = 0; i < files.length; i++) {
        if (files[i].substr(0,14) === "ConsumerAppLog" && allowedLogFiles[files[i]] !== true) {
          flagForRemoval.push(files[i]);
        }
      }
      for (let i = 0; i < flagForRemoval.length; i++) {
        safeDeleteFile(logPath + "/" + flagForRemoval[i]);
      }
    })
    .catch((err) => {
    });
}

export function clearLogs() {
  // create a path you want to write to
  let logPath = RNFS.DocumentDirectoryPath;
  if (Platform.OS === 'android') {
    logPath = RNFS.ExternalDirectoryPath;
  }

  cleanLogs(logPath,0);
}

function logToFile() {
  if (LOG_TO_FILE || LogProcessor.writeToFile === true) {
    // create a path you want to write to
    let logPath = RNFS.DocumentDirectoryPath;
    if (Platform.OS === 'android') {
      logPath = RNFS.ExternalDirectoryPath;
    }

    // clean log files that are older than X days
    let amountOfDaysStored = 3;
    cleanLogs(logPath, amountOfDaysStored);

    // generate filename based on current date.
    let filename = getFilename(new Date().valueOf());
    let filePath = logPath + '/' + filename;

    // create string
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
    RNFS.appendFile(filePath, str, 'utf8')
      .then((success) => {})
      .catch((err) => {});
  }
}

class LogProcessorClass {
  constructor() {
    this.store = undefined;
    this.writeToFile = false;
  }

  loadStore(store) {
    this.store = store;
    eventBus.on("databaseChange", (data) => {
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