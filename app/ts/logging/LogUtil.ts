import {FileUtil} from "../util/FileUtil";
import {LOG_MAX_STORAGE_TIME_DAYS} from "../ExternalConfig";

const RNFS = require('react-native-fs');

export const APP_LOG_PREFIX = 'CrownstoneAppLog';
export const IOS_LIB_LOG_PREFIX = 'BluenetLog';
export const IOS_BRIDGE_LOG_PREFIX = 'BridgeLog';
export const ANDROID_NATIVE_LOG_PREFIX = 'log_';

export function getLoggingFilename(timestamp, prefix, time: boolean = false) {
  let month = new Date(timestamp).getMonth()+1;
  let day = new Date(timestamp).getDate();

  let dateStamp = new Date(timestamp).getFullYear() + "-" + padd(month) + "-" + padd(day);
  if (time) {
    dateStamp += ` ${new Date(timestamp).getHours()}:${padd(new Date(timestamp).getMinutes())}:${padd(new Date(timestamp).getSeconds())}`
  }
  return prefix + dateStamp + '.log';
}

export async function cleanLogs() {
  // create a path you want to write to
  let logPath = FileUtil.getPath();

  await _cleanLogs(logPath);
}

async function _cleanLogs(logPath, amountOfDaysStored = LOG_MAX_STORAGE_TIME_DAYS) {
  let allowedLogFiles = {};
  for (let i = 0; i < amountOfDaysStored; i++) {
    let timestamp = Date.now() - i*86400000;
    allowedLogFiles[getLoggingFilename(timestamp, APP_LOG_PREFIX)] = true;
  }

  let flagForRemoval = [];
  try {
    let files = await RNFS.readdir(logPath)

    for (let i = 0; i < files.length; i++) {
      if (files[i].substr(0, APP_LOG_PREFIX.length) === APP_LOG_PREFIX && allowedLogFiles[files[i]] !== true) {
        flagForRemoval.push(files[i]);
      }
    }

    for (let i = 0; i < flagForRemoval.length; i++) {
      await FileUtil.safeDeleteFile(logPath + "/" + flagForRemoval[i]).catch((err) => {
      });
    }
  }
  catch (err : any) {
    console.log("Failed to clean logs", amountOfDaysStored);
  }
}

export async function getAppLogFileData() {
  let logPath = FileUtil.getPath();

  let results = []

  try {
    let files = await RNFS.readdir(logPath)
    for (let i = 0; i < files.length; i++) {
      if (files[i].substr(0, APP_LOG_PREFIX.length) === APP_LOG_PREFIX) {
        let path = logPath + "/" + files[i];
        let stat = await RNFS.stat(path);
        results.push({filename: files[i], size: stat.size, date: files[i].substr(APP_LOG_PREFIX.length, 10), path})
      }
    }
  }
  catch (err : any) {
    console.log("Failed to get data", err);
  }

  results.sort((a,b) => {
    return a.date > b.date ? -1 : 1})
  return results;
}

export async function getAllLogData() {
  let app     = await getLogData(APP_LOG_PREFIX);
  let lib     = await getLogData(IOS_LIB_LOG_PREFIX);
  let bridge  = await getLogData(IOS_BRIDGE_LOG_PREFIX);
  let android = await getLogData(ANDROID_NATIVE_LOG_PREFIX);

  let results = app.concat(lib,bridge,android);

  results.sort((a,b) => {return a.date > b.date ? -1 : 1});

  return results;
}

export async function getLogData(prefix) {
  let logPath = FileUtil.getPath();

  let results = []

  try {
    let files = await RNFS.readdir(logPath)
    for (let i = 0; i < files.length; i++) {
      if (files[i].substr(0, prefix.length) === prefix) {
        let path = logPath + "/" + files[i];
        let stat = await RNFS.stat(path);
        results.push({filename: files[i], size: stat.size, date: stat.mtime, path})
      }
    }
  }
  catch (err : any) {
    console.log("Failed to get data", err);
  }

  results.sort((a,b) => {return a.date > b.date ? -1 : 1})
  return results;
}

export async function clearLogs() {
  // create a path you want to write to
  let logPath = FileUtil.getPath();

  await _cleanLogs(logPath,0);
}


/**
 * RN does not appreciate many outstanding callbacks to the native side. This class will condense all logging to a single outstanding callback.
 */
export class FileLoggerClass {

  _logPath: string;
  _writeQueue = [];
  _writing = false;

  blocked = false;

  constructor() {
    this._logPath = FileUtil.getPath();
  }

  static generateStringFromArgs(args: any[]) : string {
    // create string
    let str = '' + Date.now() + ' - ' + new Date() + " -";
    for (let i = 0; i < args.length; i++) {
      if (typeof args[i] === 'object' || Array.isArray(args[i])) {
        str += " " + JSON.stringify(args[i])
      }
      else {
        str += " " + args[i]
      }
    }
    str += " \n";
    return str;
  }

  log(args: any[]) {
    if (this.blocked) { return; }

    // generate filename based on current date.
    let filename = getLoggingFilename(Date.now(), APP_LOG_PREFIX);

    // create string
    let str = FileLoggerClass.generateStringFromArgs(args);

    this._writeQueue.push([this._logPath + '/' + filename, str]);
    this._write();
  }

  async _write() {
    if (this._writeQueue.length === 0) {
      return
    }

    if (this._writing === false) {
      this._writing = true;

      if (this._writeQueue.length > 0) {
        // check if we can combine entries.
        let [filename, combinedEntries] = this._combineLogEntryCalls();
        await RNFS.appendFile(filename, combinedEntries, 'utf8').catch((err) => {})
      }

      this._writing = false;

      if (this._writeQueue.length > 0) {
        this._write();
      }
    }
  }

  _combineLogEntryCalls() : [string, string] {
    let filename = this._writeQueue[0][0];
    let str = this._writeQueue[0][1];
    let count = 1;

    for (let i = 1; i < this._writeQueue.length; i++) {
      if (this._writeQueue[i][0] == filename) {
        str += this._writeQueue[i][1];
        count += 1;
      }
      else {
        break;
      }
    }

    this._writeQueue.splice(0,count);

    return [filename, str];
  }

  async clearLogFiles() {
    this.blocked = true;
    await clearLogs().catch(()=>{});
    this.blocked = false;
  }
}

function padd(input: number | string) : string {
  let str = String(input);
  if (str.length < 2) {
    return '0' + str;
  }
  return str;
}