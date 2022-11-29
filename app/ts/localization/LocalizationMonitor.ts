import { FileUtil } from "../util/FileUtil";
import { LOCALIZATION_LOG_MAX_STORAGE_TIME_DAYS } from "../ExternalConfig";
import { getLoggingFilename } from "../logging/LogUtil";
import { core } from "../Core";

const RNFS = require('react-native-fs');

const Localization_TRIGGER_ID = "Localization_MONITOR"
export const Localization_LOG_PREFIX = 'LocalizationLog';


const MAX_STORAGE_TIME = 5*60*1000; // 5 minutes


/**
 * This class keeps a history of the localization state.
 */
class LocalizationMonitorClass {
  _history : iBeaconHistory[] = [];
  _initialized : boolean = false;

  init() {
    if (this._initialized === false) {
      core.nativeBus.on(core.nativeBus.topics.iBeaconAdvertisement,(data: ibeaconPackage[]) => { this.storeMeasurement(data); })
      core.nativeBus.on(core.nativeBus.topics.enterSphere,  (sphereId) => { this.storeLocalization({region: sphereId, location: 'str:Enter Sphere.'}); })
      core.nativeBus.on(core.nativeBus.topics.exitSphere,   (sphereId) => { this.storeLocalization({region: sphereId, location: 'str:Exit Sphere.'}); })
      core.eventBus.on('enterRoom' ,(data) => {
        this.storeLocalization(data);
      }); // data = {sphereId: sphereId, locationId: locationId}
    }
    this._initialized = true;
  }


  storeLocalization(data) {
    let state = core.store.getState();
    if (state.user.developer) {
      cleanLogs();
      writeLocalization(data);
    }
  }


  storeMeasurement(data: ibeaconPackage[]) {
    this._history.push([Date.now(), data]);

    // check if the oldest entry is older than the max storage time.
    if (this._history.length > 0 && this._history[0][0] < Date.now() - MAX_STORAGE_TIME) {
      this._history.shift();
    }
  }

  getHistory(since: timestamp) : ibeaconPackage[][] {
    // select the slice of history that matches the "since" timestamp.
    return this._history
      .filter((entry) => { return entry[0] >= since; })
      .map((entry) => { return entry[1]; });
  }


  clear() {
    return clearLogs()
  }
}

export const LocalizationMonitor = new LocalizationMonitorClass();

function cleanLogs() {
  // create a path you want to write to
  let logPath = FileUtil.getPath();

  _cleanLogs(logPath);
}

function _cleanLogs(logPath, amountOfDaysStored = LOCALIZATION_LOG_MAX_STORAGE_TIME_DAYS) {
  let allowedLogFiles = {};

  for (let i = 0; i < amountOfDaysStored; i++) {
    let timestamp = Date.now() - i*86400000;
    allowedLogFiles[getLoggingFilename(timestamp, Localization_LOG_PREFIX)] = true;
  }

  let flagForRemoval = [];
  return RNFS.readdir(logPath)
    .then((files) => {
      for (let i = 0; i < files.length; i++) {
        if (files[i].substr(0, Localization_LOG_PREFIX.length) === Localization_LOG_PREFIX && allowedLogFiles[files[i]] !== true) {
          flagForRemoval.push(files[i]);
        }
      }
      for (let i = 0; i < flagForRemoval.length; i++) {
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


function writeLocalization(data) {
  // create a path you want to write to
  let logPath = FileUtil.getPath();

  // generate filename based on current date.
  let filename = getLoggingFilename(Date.now(), Localization_LOG_PREFIX);
  let filePath = logPath + '/' + filename;



  // create string
  let str = data.sphereId + ";" + data.locationId + ";" + Date.now() + "\n";

  // write the file
  RNFS.appendFile(filePath, str, 'utf8').catch((err) => {})
}




