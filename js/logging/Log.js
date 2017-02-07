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
import { Scheduler } from '../logic/Scheduler'
import { eventBus } from '../util/eventBus'
import { safeDeleteFile } from '../util/Util'
const DeviceInfo = require('react-native-device-info');

export const LOG = {
  info: function() {
    if (LOGGING) {
      let args = ['LOG ------------ :'];
      for (let i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      logToFile.apply(this, args);

      if (RELEASE_MODE === false)
        console.log.apply(this, args);
    }
  },

  error: function() {
    if (ERROR_LOGGING) {
      let args = ['LOG ERROR !!! -- :'];
      for (let i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      logToFile.apply(this, args);

      if (RELEASE_MODE === false)
        console.log.apply(this, args);
    }
  },

  debug: function() {
    if (DEBUG_LOGGING) {
      let args = ['LOG Debug ------ :'];
      for (let i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      logToFile.apply(this, args);

      if (RELEASE_MODE === false)
        console.log.apply(this, args);
    }
  },

  cloud: function() {
    if (DEBUG_CLOUD) {
      let args = ['LOG Cloud ------ :'];
      for (let i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      logToFile.apply(this, args);

      if (RELEASE_MODE === false)
        console.log.apply(this, args);
    }
  },

  ble: function() {
    if (DEBUG_BLE) {
      let args = ['LOG BLE -------- :'];
      for (let i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      logToFile.apply(this, args);

      if (RELEASE_MODE === false)
        console.log.apply(this, args);
    }
  },

  store: function() {
    if (DEBUG_STORE) {
      let args = ['LOG Store ------ :'];
      for (let i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      logToFile.apply(this, args);

      if (RELEASE_MODE === false)
        console.log.apply(this, args);
    }
  },

  scheduler: function() {
    if (DEBUG_SCHEDULER) {
      let args = ['LOG Scheduler --- :'];
      for (let i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      logToFile.apply(this, args);

      if (RELEASE_MODE === false)
        console.log.apply(this, args);
    }
  },
};


function getFilename(timestamp) {
  let dateStamp = new Date(timestamp).getFullYear() + "-" + (new Date(timestamp).getMonth()+1) + "-" + (new Date(timestamp).getDate());
  return 'ConsumerAppLog' + dateStamp + '.log';;
}

export function cleanLogs() {
  // create a path you want to write to
  let logPath = RNFS.DocumentDirectoryPath;
  if (Platform.OS === 'android') {
    logPath = RNFS.ExternalDirectoryPath;
  }

  _cleanLogs(logPath);
}

function _cleanLogs(logPath, amountOfDaysStored = 3) {
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

  _cleanLogs(logPath,0);
}



function logToFile() {
  if (LOG_TO_FILE || LogProcessor.writeToFile === true) {
    // create a path you want to write to
    let logPath = RNFS.DocumentDirectoryPath;
    if (Platform.OS === 'android') {
      logPath = RNFS.ExternalDirectoryPath;
    }

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

    // use periodic events to clean the logs.
    let triggerId = "LOG_CLEANING_TRIGGER";
    Scheduler.setRepeatingTrigger(triggerId, {repeatEveryNSeconds: 5*3600});
    Scheduler.loadCallback(triggerId,() => { cleanLogs() }, true);

    eventBus.on("databaseChange", (data) => {
      if (data.change.changeUserDeveloperStatus === true) {
        this.refreshData();
      }
    });
    this.refreshData();

    LOG.info("Device Manufacturer", DeviceInfo.getManufacturer());  // e.g. Apple
    LOG.info("Device Brand", DeviceInfo.getBrand());  // e.g. Apple / htc / Xiaomi
    LOG.info("Device Model", DeviceInfo.getModel());  // e.g. iPhone 6
    LOG.info("Device ID", DeviceInfo.getDeviceId());  // e.g. iPhone7,2 / or the board on Android e.g. goldfish
    LOG.info("System Name", DeviceInfo.getSystemName());  // e.g. iPhone OS
    LOG.info("System Version", DeviceInfo.getSystemVersion());  // e.g. 9.0
    LOG.info("Bundle ID", DeviceInfo.getBundleId());  // e.g. com.learnium.mobile
    LOG.info("Build Number", DeviceInfo.getBuildNumber());  // e.g. 89
    LOG.info("App Version", DeviceInfo.getVersion());  // e.g. 1.1.0
    LOG.info("App Version (Readable)", DeviceInfo.getReadableVersion());  // e.g. 1.1.0.89
    LOG.info("Device Name", DeviceInfo.getDeviceName());  // e.g. Becca's iPhone 6
    LOG.info("User Agent", DeviceInfo.getUserAgent()); // e.g. Dalvik/2.1.0 (Linux; U; Android 5.1; Google Nexus 4 - 5.1.0 - API 22 - 768x1280 Build/LMY47D)
    LOG.info("Device Locale", DeviceInfo.getDeviceLocale()); // e.g en-US
    LOG.info("Device Country", DeviceInfo.getDeviceCountry()); // e.g US
    LOG.info("App Instance ID", DeviceInfo.getInstanceID()); // ANDROID ONLY - see https://developers.google.com/instance-id/
  }

  refreshData() {
    if (this.store) {
      let state = this.store.getState();
      this.writeToFile = state.user.developer === true && state.user.logging === true;
    }
  }
}

export const LogProcessor = new LogProcessorClass();