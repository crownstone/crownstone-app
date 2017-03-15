import { Platform } from 'react-native';
import {
  LOGGING,
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
  RELEASE_MODE,
  LOG_TO_FILE,
  LOCAL_TESTING,
  TESTING_IN_PROCESS
} from '../ExternalConfig'
import { Scheduler } from '../logic/Scheduler'
import { eventBus } from '../util/EventBus'
import { safeDeleteFile } from '../util/Util'

const DeviceInfo = require('react-native-device-info');
const RNFS = require('react-native-fs');

export const LOG : any = {
  info: function() {
    this._log('------------', LOGGING, arguments);
  },

  verbose: function() {
    this._log('VERBOSE ----', LOG_VERBOSE, arguments);
  },

  warn: function() {
    this._log('WARNING ! --', LOG_WARNINGS, arguments);
  },

  event: function() {
    this._log('EVENT ------', LOG_EVENTS, arguments);
  },

  error: function() {
    this._log('ERROR !!! --', LOG_ERRORS, arguments);
  },

  debug: function() {
    this._log('Debug ------', LOG_DEBUG, arguments);
  },

  cloud: function() {
    this._log('Cloud ------', LOG_CLOUD, arguments);
  },

  ble: function() {
    this._log('BLE --------', LOG_BLE, arguments);
  },

  store: function() {
    this._log('Store ------', LOG_STORE, arguments);
  },

  scheduler: function() {
    this._log('Scheduler --', LOG_SCHEDULER, arguments);
  },

  mesh: function() {
    this._log('Mesh -------', LOG_MESH, arguments);
  },

  _log: function(type, check, allArguments) {
    if (check) {
      let args = ['LOG ' + type + ' :'];
      for (let i = 0; i < allArguments.length; i++) {
        args.push(allArguments[i]);
      }
      logToFile.apply(this, args);

      if (RELEASE_MODE === false) {
        console.log.apply(this, args);
      }
    }
  }
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
        safeDeleteFile(logPath + "/" + flagForRemoval[i]).catch(()=>{});
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
      .catch((err) => {})
  }
}

class LogProcessorClass {
  store : any;
  writeToFile : boolean;

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

export const LogProcessor : any = new LogProcessorClass();


let notifiedCloudEndpoint = false;
if (RELEASE_MODE) {
  if (!TESTING_IN_PROCESS) {
    LOG.info("------------------   --------------------------------   -----------------");
    LOG.info("------------------   ----- USING RELEASE CLOUD ------   -----------------");
    LOG.info("------------------   --------------------------------   -----------------");
    notifiedCloudEndpoint = true;
  }
  LOG.info("====================   ============================   ===================");
  LOG.info("====================   === RUNNING RELEASE MODE ===   ===================");
  LOG.info("====================   ============================   ===================");
}
else {
  LOG.info("!!!!!!!!!!!!!!!!!!   !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!   !!!!!!!!!!!!!!!!!");
  LOG.info("!!!!!!!!!!!!!!!!!!   !!! RUNNING DEVELOPMENT MODE !!!   !!!!!!!!!!!!!!!!!");
  LOG.info("!!!!!!!!!!!!!!!!!!   !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!   !!!!!!!!!!!!!!!!!");

  if (LOCAL_TESTING) {
    LOG.info("------------------   --------------------------------   -----------------");
    LOG.info("------------------   ------ USING LOCAL CLOUD -------   -----------------");
    LOG.info("------------------   --------------------------------   -----------------");
    notifiedCloudEndpoint = true;
  }
}

if (notifiedCloudEndpoint === false) {
  LOG.info("------------------   --------------------------------   -----------------");
  LOG.info("------------------   ------- USING DEV CLOUD --------   -----------------");
  LOG.info("------------------   --------------------------------   -----------------");
}
