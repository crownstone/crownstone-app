import { FileUtil } from "../util/FileUtil";
import { LOG_MAX_STORAGE_TIME_DAYS } from "../ExternalConfig";

const RNFS = require('react-native-fs');

export const LOG_PREFIX = 'CrownstoneAppLog';

export function getLoggingFilename(timestamp, prefix, time: boolean = false) {
  let month = new Date(timestamp).getMonth()+1;
  let day = new Date(timestamp).getDate();

  let dateStamp = new Date(timestamp).getFullYear() + "-" + padd(month) + "-" + padd(day);
  if (time) {
    dateStamp += ` ${new Date(timestamp).getHours()}:${padd(new Date(timestamp).getMinutes())}:${padd(new Date(timestamp).getSeconds())}`
  }
  return prefix + dateStamp + '.log';
}

export function cleanLogs() {
  // create a path you want to write to
  let logPath = FileUtil.getPath();

  _cleanLogs(logPath);
}

function _cleanLogs(logPath, amountOfDaysStored = LOG_MAX_STORAGE_TIME_DAYS) {
  let allowedLogFiles = {};
  for (let i = 0; i < amountOfDaysStored; i++) {
    let timestamp = Date.now() - i*86400000;
    allowedLogFiles[getLoggingFilename(timestamp, LOG_PREFIX)] = true;
  }

  let flagForRemoval = [];
  RNFS.readdir(logPath)
    .then((files) => {
      for (let i = 0; i < files.length; i++) {
        if (files[i].substr(0,LOG_PREFIX.length) === LOG_PREFIX && allowedLogFiles[files[i]] !== true) {
          flagForRemoval.push(files[i]);
        }
      }
      for (let i = 0; i < flagForRemoval.length; i++) {
        FileUtil.safeDeleteFile(logPath + "/" + flagForRemoval[i]).catch(()=>{});
      }
    })
    .catch((err) => {
    });
}

export function clearLogs() {
  // create a path you want to write to
  let logPath = FileUtil.getPath();

  _cleanLogs(logPath,0);
}


/**
 * RN does not appreciate many outstanding callbacks to the native side. This class will condense all logging to a single outstanding callback.
 */
export class FileLoggerClass {

  _logPath: string;
  _writeQueue = [];
  _writing = false;

  constructor() {
    this._logPath = FileUtil.getPath();
  }

  log(args: any[]) {
    // generate filename based on current date.
    let filename = getLoggingFilename(Date.now(), LOG_PREFIX);

    // create string
    let str = '' + Date.now() + ' - ' + new Date() + " -";
    for (let i = 0; i < arguments.length; i++) {
      if (typeof arguments[i] === 'object' || Array.isArray(arguments[i])) {
        str += " " + JSON.stringify(arguments[i])
      }
      else {
        str += " " + arguments[i]
      }
    }
    str += " \n"


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
        let [filename, combinedEntries] = this._combineLogEntryCalls()

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
}

function padd(input: number | string) : string {
  let str = String(input);
  if (str.length < 2) {
    return '0' + str;
  }
  return str;
}