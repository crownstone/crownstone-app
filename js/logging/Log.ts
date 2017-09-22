import { Platform } from 'react-native';
import {
  LOG_INFO,
  LOG_ERRORS,
  LOG_WARNINGS,
  LOG_VERBOSE,
  LOG_DEBUG,
  LOG_EVENTS,
  LOG_CLOUD,
  LOG_BLE,
  LOG_MESH,
  LOG_STORE,
  LOG_SCHEDULER,
  LOG_TO_FILE,
  TESTING_APP,
  RELEASE_MODE_USED,
} from '../ExternalConfig'
import { Scheduler } from '../logic/Scheduler'
import { eventBus } from '../util/EventBus'
import { safeDeleteFile, Util } from '../util/Util'

const DeviceInfo = require('react-native-device-info');
const RNFS = require('react-native-fs');

export const LOG : any = {
  info: function() {
    this._log('------------', LOG_INFO || LogProcessor.log_info, arguments);
  },

  verbose: function() {
    this._log('VERBOSE ----', LOG_VERBOSE || LogProcessor.log_verbose, arguments);
  },

  warn: function() {
    this._log('WARNING ! --', LOG_WARNINGS || LogProcessor.log_warnings, arguments);
  },

  event: function() {
    this._log('EVENT ------', LOG_EVENTS || LogProcessor.log_events, arguments);
  },

  error: function() {
    this._log('ERROR !!! --', LOG_ERRORS || LogProcessor.log_errors, arguments);
  },

  debug: function() {
    this._log('Debug ------', LOG_DEBUG || LogProcessor.log_debug, arguments);
  },

  cloud: function() {
    this._log('Cloud ------', LOG_CLOUD || LogProcessor.log_cloud, arguments);
  },

  ble: function() {
    this._log('BLE --------', LOG_BLE || LogProcessor.log_ble, arguments);
  },

  store: function() {
    this._log('Store ------', LOG_STORE || LogProcessor.log_store, arguments);
  },

  scheduler: function() {
    this._log('Scheduler --', LOG_SCHEDULER || LogProcessor.log_scheduler, arguments);
  },

  mesh: function() {
    this._log('Mesh -------', LOG_MESH || LogProcessor.log_mesh, arguments);
  },

  _log: function(type, check, allArguments) {
    if (check) {
      let args = ['LOG ' + type + ' :'];
      for (let i = 0; i < allArguments.length; i++) {
        let arg = allArguments[i];
        if (TESTING_APP) {
          if (typeof arg === 'object') {
            try {
              arg = JSON.stringify(arg, undefined, 2);
            }
            catch(err) {
              // ignore
            }
          }
        }
        args.push(arg);
      }
      logToFile.apply(this, args);

      if (RELEASE_MODE_USED === false || TESTING_APP) {
        console.log.apply(this, args);
      }
    }
  }
};


function getFilename(timestamp) {
  let monthNumber = new Date(timestamp).getMonth()+1;
  let dayNumber = new Date(timestamp).getDate();

  let month = monthNumber < 10 ? '0' + monthNumber : '' + monthNumber;
  let day = dayNumber < 10 ? '0' + dayNumber : '' + dayNumber;

  let dateStamp = new Date(timestamp).getFullYear() + "-" + month + "-" +day;
  return 'ConsumerAppLog' + dateStamp + '.log';
}

export function cleanLogs() {
  // create a path you want to write to
  let logPath = Util.getPath();

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
        safeDeleteFile(logPath + "/" + flagForRemoval[i]).catch(()=>{});
      }
    })
    .catch((err) => {
    });
}

export function clearLogs() {
  // create a path you want to write to
  let logPath = Util.getPath();

  _cleanLogs(logPath,0);
}



function logToFile() {
  if (LOG_TO_FILE || LogProcessor.writeToFile === true) {
    // create a path you want to write to
    let logPath = Util.getPath();

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
      .catch((err) => {})
  }
}

class LogProcessorClass {
  store : any;
  writeToFile : boolean;
  log_info:     boolean;
  log_warnings: boolean;
  log_errors:   boolean;
  log_mesh:     boolean;
  log_scheduler:boolean;
  log_verbose:  boolean;
  log_ble:      boolean;
  log_events:   boolean;
  log_store:    boolean;
  log_cloud:    boolean;
  log_debug:    boolean;

  constructor() {
    this.store = undefined;
    this.writeToFile = false;

  }

  _loadStore(store) {
    this.store = store;

    // use periodic events to clean the logs.
    let triggerId = "LOG_CLEANING_TRIGGER";
    Scheduler.setRepeatingTrigger(triggerId, {repeatEveryNSeconds: 5*3600});
    Scheduler.loadCallback(triggerId,() => { cleanLogs() }, true);

    eventBus.on("databaseChange", (data) => {
      if (data.change.changeUserDeveloperStatus || data.change.changeDeveloperData) {
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
      let dev = state.user.developer;
      let log = state.user.logging;

      this.writeToFile = dev === true && log === true;

      this.log_info      = dev === true && log === true && state.development.log_info      === true;
      this.log_warnings  = dev === true && log === true && state.development.log_warnings  === true;
      this.log_errors    = dev === true && log === true && state.development.log_errors    === true;
      this.log_mesh      = dev === true && log === true && state.development.log_mesh      === true;
      this.log_scheduler = dev === true && log === true && state.development.log_scheduler === true;
      this.log_verbose   = dev === true && log === true && state.development.log_verbose   === true;
      this.log_ble       = dev === true && log === true && state.development.log_ble       === true;
      this.log_events    = dev === true && log === true && state.development.log_events    === true;
      this.log_store     = dev === true && log === true && state.development.log_store     === true;
      this.log_cloud     = dev === true && log === true && state.development.log_cloud     === true;
      this.log_debug     = dev === true && log === true && state.development.log_debug     === true;
    }
  }
}

export const LogProcessor : any = new LogProcessorClass();
