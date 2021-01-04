import { Scheduler } from "../logic/Scheduler";
import { FileUtil } from "../util/FileUtil";
import { LOG_MAX_STORAGE_TIME_DAYS } from "../ExternalConfig";
import { getLoggingFilename } from "../logging/LogUtil";
import { NativeBus } from "../native/libInterface/NativeBus";

const RNFS = require('react-native-fs');

const UPTIME_TRIGGER_ID = "UPTIME_MONITOR"
export const UPTIME_LOG_PREFIX = 'UptimeLog';

class UptimeMonitorClass {
  _initialized : boolean = false;

  init() {
    if (this._initialized === false) {
      Scheduler.setRepeatingTrigger(UPTIME_TRIGGER_ID, {repeatEveryNSeconds:60}, true);
      Scheduler.loadCallback(UPTIME_TRIGGER_ID, () => {this.storeUptime()}, true);

      NativeBus.on(NativeBus.topics.localizationPausedState, (state) => {
        cleanLogs();
        let str = Date.now() + `:localizationPausedState:${state}\n`;
        writeToUpTime(str);
      })
    }
    this._initialized = true;
  }

  storeUptime() {
    let str = Date.now() + "\n";
    cleanLogs();
    writeToUpTime(str);
  }

  clear() {
    return clearLogs()
  }
}

export const UptimeMonitor = new UptimeMonitorClass();

function cleanLogs() {
  // create a path you want to write to
  let logPath = FileUtil.getPath();

  _cleanLogs(logPath);
}

function _cleanLogs(logPath, amountOfDaysStored = LOG_MAX_STORAGE_TIME_DAYS) {
  let allowedLogFiles = {};

  for (let i = 0; i < amountOfDaysStored; i++) {
    let timestamp = Date.now() - i*86400000;
    allowedLogFiles[getLoggingFilename(timestamp, UPTIME_LOG_PREFIX)] = true;
  }

  let flagForRemoval = [];
  return RNFS.readdir(logPath)
    .then((files) => {
      for (let i = 0; i < files.length; i++) {
        if (files[i].substr(0, UPTIME_LOG_PREFIX.length) === UPTIME_LOG_PREFIX && allowedLogFiles[files[i]] !== true) {
          console.log("Found", files[i])
          flagForRemoval.push(files[i]);
        }
      }
      for (let i = 0; i < flagForRemoval.length; i++) {
        console.log("deleting", flagForRemoval[i])
        FileUtil.safeDeleteFile(logPath + "/" + flagForRemoval[i]).catch(()=>{});
      }
    })
    .catch((err) => {});

}

function clearLogs() {
  // create a path you want to write to
  let logPath = FileUtil.getPath();

  return _cleanLogs(logPath,0);
}



function writeToUpTime(str) {
  // create a path you want to write to
  let logPath = FileUtil.getPath();

  // generate filename based on current date.
  let filename = getLoggingFilename(Date.now(), UPTIME_LOG_PREFIX);
  let filePath = logPath + '/' + filename;

  // create string
  // write the file
  RNFS.appendFile(filePath, str, 'utf8').catch((err) => {})
}




