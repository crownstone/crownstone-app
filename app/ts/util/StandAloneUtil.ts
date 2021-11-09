import { base_core } from "../Base_core";

export const xUtil = {

  nextTick: function() {
    return new Promise<void>((resolve, reject) => {
      setImmediate(() => { resolve() });
    })
  },

  pad: function(str) {
    if (Number(str) < 10) {
      return '0' + str;
    }
    return str;
  },

  getDurationFormat: function(ms) {
    let days = Math.floor(ms / (24*3600*1000))
    let hours = Math.floor(ms / (3600*1000))%24;
    let minutes = Math.floor(ms / (60*1000))%60;
    let seconds = Math.floor(ms / (1000))% 60
    if (ms > 24*3600*1000) {
      return days + "d " + hours + "h " + minutes + "m " + seconds + 's';
    }
    else if (ms > 3600*1000) {
      // show hours
      return hours + "h " + minutes + "m " + seconds + 's';
    }
    else if (ms > 60*1000) {
      return minutes + "m " + seconds + 's';
    }
    else {
      return seconds + 's';
    }
  },

  getDateHourId: function(timestamp)  {
    if (timestamp === 0) {
      return 'unknown';
    }
    let date = new Date(timestamp);
    let month = xUtil.pad(date.getMonth() + 1);
    let day = xUtil.pad(date.getDate());
    let hours = xUtil.pad(date.getHours());

    return date.getFullYear() + '/' + month + '/' + day + ' ' + hours + ':00:00'
  },

  getDateFormat: function(timestamp)  {
    if (timestamp === 0) {
      return 'unknown';
    }
    let date = new Date(timestamp);
    let month = xUtil.pad(date.getMonth() + 1);
    let day = xUtil.pad(date.getDate());

    return date.getFullYear() + '/' + month + '/' + day
  },

  getDateTimeFormat: function(timestamp)  {
    if (timestamp === 0) {
      return 'unknown';
    }
    let date = new Date(timestamp);

    let month   = xUtil.pad(date.getMonth() + 1);
    let day     = xUtil.pad(date.getDate());
    let hours   = xUtil.pad(date.getHours());
    let minutes = xUtil.pad(date.getMinutes());
    let seconds = xUtil.pad(date.getSeconds());

    return date.getFullYear() + '/' + month + '/' + day + ' ' + hours + ':' + minutes + ':' + seconds
  },

  getTimeFormat: function(timestamp, showSeconds = true)  {
    if (timestamp === 0) {
      return 'unknown';
    }

    let date = new Date(timestamp);

    let hours = date.getHours();
    let minutes = xUtil.pad(date.getMinutes());

    if (showSeconds === false) {
      return hours + ':' + minutes;
    }

    let seconds = xUtil.pad(date.getSeconds());

    return hours + ':' + minutes + ':' + seconds
  },


  getHubHexToken : () : string => {
    let str = '';
    for (let i = 0; i < 64; i++) {
      str += xUtil.getRandomByte();
    }
    return str;
  },

  getRandomByte: () : string => {
    let byteValue = Math.floor(Math.random()*255);
    let str = byteValue.toString(16);
    if (byteValue < 16) {
      return '0'+str;
    }
    return str
  },

  getToken : () : string => {
    return Math.floor(Math.random() * 1e8 /* 65536 */).toString(36);
  },


  generateLocalId() : string {
    let localID = xUtil.getUUID();
    return localID;
  },

  mixin: function(base, section, context) {
    for (let key in section) {
      if (section.hasOwnProperty(key)) {
        if (typeof section[key] === 'function') {
          base[key] = section[key].bind(context)
        }
        else {
          base[key] = section[key]
        }
      }
    }
  },

  spreadString: function(string) {
    let result = '';
    for (let i = 0; i < string.length; i++) {
      result += string[i];
      if (i !== (string.length-1) && string[i] !== ' ') {
        result += ' '
      }

      if (string[i] === ' ') {
        result += '   ';
      }
    }
    return result;
  },



  getPromiseContainer<T>() : PromiseContainer<T> {
    let promiseContainer : PromiseContainer<T> = { promise: undefined, resolve: undefined, reject: undefined }
    let promise = new Promise<T>((resolve, reject) => {
      promiseContainer.resolve = resolve;
      promiseContainer.reject = reject;
    });
    promiseContainer.promise = promise;
    return promiseContainer;
  },


  getUUID : () : string => {
    return (
      S4() + S4() + '-' +
      S4() + '-' +
      S4() + '-' +
      S4() + '-' +
      S4() + S4() + S4()
    );
  },

  getShortUUID : () : string => {
    return (
      S4() + S4() + '-' +
      S4()
    );
  },

  crownstoneTimeToTimestamp: function(csTimestamp) : number {
    let now = Date.now();
    if ((now / csTimestamp) < 10) {
      csTimestamp = csTimestamp / 1000;
    }
    let jsTimestamp = 1000*csTimestamp;
    let timezoneOffsetMinutes = new Date(jsTimestamp).getTimezoneOffset();

    return jsTimestamp + timezoneOffsetMinutes*60000;
  },

  timestampToCrownstoneTime: function(utcTimestamp) : number {
    // for holland in summer, timezoneOffsetMinutes is -120, winter will be -60
    let timezoneOffsetMinutes = new Date(utcTimestamp).getTimezoneOffset();

    return (utcTimestamp - timezoneOffsetMinutes*60000)/1000;
  },

  nowToCrownstoneTime: function() : number {
    return xUtil.timestampToCrownstoneTime(Date.now())
  },

  getDelayLabel: function(delay, fullLengthText = false) {
    if (delay < 60) {
      return Math.floor(delay) + ' seconds';
    }
    else {
      if (fullLengthText === true) {
        return Math.floor(delay / 60) + ' minutes';
      }
      else {
        return Math.floor(delay / 60) + ' min';
      }
    }
  },

  versions: {
    isHigher: function(version, compareWithVersion, semverSize = 3) {
      if (!version || !compareWithVersion) {
        return false;
      }

      let [versionClean, versionRc] = getRC(version);
      let [compareWithVersionClean, compareWithVersionRc] = getRC(compareWithVersion);

      if (checkSemVer(versionClean, semverSize) === false || checkSemVer(compareWithVersionClean, semverSize) === false) {
        return false;
      }

      let A = versionClean.split('.');
      let B = compareWithVersionClean.split('.');

      for (let i = 0; i < semverSize; i++) {
        if (A[i] < B[i]) { return false; }
        if (A[i] > B[i]) { return true;  }
      }
      if (versionRc === null && compareWithVersionRc === null) {
        return false;
      }
      else if (versionRc !== null && compareWithVersionRc !== null) {
        return (versionRc > compareWithVersionRc);
      }
      else if (versionRc !== null) {
        // 2.0.0.rc0 is smaller than 2.0.0
        return false;
      }
      else {
        return true;
      }


      // if (A[0] < B[0]) return false;
      // else if (A[0] > B[0]) return true;
      // else { // A[0] == B[0]
      //   if (A[1] < B[1]) return false;
      //   else if (A[1] > B[1]) return true;
      //   else { // A[1] == B[1]
      //     if (A[2] < B[2]) return false;
      //     else if (A[2] > B[2]) return true;
      //     else { // A[2] == B[2]
      //       if (versionRc === null && compareWithVersionRc === null) {
      //         return false;
      //       }
      //       else if (versionRc !== null && compareWithVersionRc !== null) {
      //         return (versionRc > compareWithVersionRc);
      //       }
      //       else if (versionRc !== null) {
      //         // 2.0.0.rc0 is smaller than 2.0.0
      //         return false;
      //       }
      //       else {
      //         return true;
      //       }
      //     }
      //   }
      // }
    },


    /**
     * This is the same as the isHigherOrEqual except it allows access to githashes. It is up to the dev to determine what it can and cannot do.
     * @param myVersion
     * @param minimumRequiredVersion
     * @returns {any}
     */
    canIUse: function(myVersion, minimumRequiredVersion) {
      if (!myVersion)              { return false; }
      if (!minimumRequiredVersion) { return false; }

      let [myVersionClean, myVersionRc] = getRC(myVersion);
      let [minimumRequiredVersionClean, minimumRequiredVersionRc] = getRC(minimumRequiredVersion);

      if (checkSemVer(myVersionClean) === false) {
        return true;
      }

      return xUtil.versions.isHigherOrEqual(myVersionClean, minimumRequiredVersionClean);
    },

    isHigherOrEqual: function(version, compareWithVersion, semverSize = 3) {
      if (!version || !compareWithVersion) {
        return false;
      }

      let [versionClean, versionRc] = getRC(version);
      let [compareWithVersionClean, compareWithVersionRc] = getRC(compareWithVersion);

      if (checkSemVer(versionClean, semverSize) === false || checkSemVer(compareWithVersionClean, semverSize) === false) {
        return false;
      }

      if (version === compareWithVersion && version && compareWithVersion) {
        return true;
      }

      if (versionClean === compareWithVersionClean && versionClean && compareWithVersionClean && versionRc === compareWithVersionRc) {
        return true;
      }

      return xUtil.versions.isHigher(version, compareWithVersion);
    },

    isLower: function(version, compareWithVersion, semverSize = 3) {
      if (!version || !compareWithVersion) {
        return false;
      }

      let [versionClean, versionRc] = getRC(version);
      let [compareWithVersionClean, compareWithVersionRc] = getRC(compareWithVersion);

      if (checkSemVer(versionClean, semverSize) === false || checkSemVer(compareWithVersionClean, semverSize) === false) {
        return false;
      }

      // Require both versions to be semver with this size
      if (compareWithVersionClean.split(".").length !== semverSize) {
        return false;
      }

      // if version is NOT semver, is higher will be false so is lower is true.
      return !xUtil.versions.isHigherOrEqual(version, compareWithVersion, semverSize);
    },
  },


  deepCopy(object) {
    return xUtil.deepExtend({}, object);
  },

  deepExtend: function (a, b, protoExtend = false, allowDeletion = false) {
    for (let prop in b) {
      if (b.hasOwnProperty(prop) || protoExtend === true) {
        if (b[prop] && b[prop].constructor === Object) {
          if (a[prop] === undefined) {
            a[prop] = {};
          }
          if (a[prop].constructor === Object) {
            xUtil.deepExtend(a[prop], b[prop], protoExtend);
          }
          else {
            if ((b[prop] === null) && a[prop] !== undefined && allowDeletion === true) {
              delete a[prop];
            }
            else {
              a[prop] = b[prop];
            }
          }
        }
        else if (Array.isArray(b[prop])) {
          a[prop] = [];
          for (let i = 0; i < b[prop].length; i++) {
            if (b[prop][i] && b[prop][i].constructor === Object) {
              a[prop].push(xUtil.deepExtend({},b[prop][i]));
            }
            else {
              a[prop].push(b[prop][i]);
            }
          }
        }
        else {
          if ((b[prop] === null) && a[prop] !== undefined && allowDeletion === true) {
            delete a[prop];
          }
          else {
            a[prop] = b[prop];
          }
        }
      }
    }
    return a;
  },

  arrayCompare: function (a,b) {
    if (a.length !== b.length) { return false; }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  },

  deepCompare: function (a, b, d=0) : boolean {
    let iterated = false;
    for (let prop in b) {
      iterated = true;
      if (b.hasOwnProperty(prop)) {
        if (a[prop] === undefined) {
          return false;
        }
        else if (b[prop] && !a[prop] || a[prop] && !b[prop]) {
          return false;
        }
        else if (!b[prop] && !a[prop] && a[prop] != b[prop]) {
          return false;
        }
        else if (!b[prop] && !a[prop] && a[prop] == b[prop]) {
          continue;
        }
        else if (b[prop].constructor === Object) {
          if (a[prop].constructor === Object) {
            if (xUtil.deepCompare(a[prop], b[prop], d+1) === false) {
              return false
            }
          }
          else {
            return false;
          }
        }
        else if (Array.isArray(b[prop])) {
          if (Array.isArray(a[prop]) === false) {
            return false;
          }
          else if (a[prop].length !== b[prop].length) {
            return false;
          }

          for (let i = 0; i < b[prop].length; i++) {
            if (xUtil.deepCompare(a[prop][i], b[prop][i]) === false) {
              return false;
            }
          }
        }
        else {
          if (a[prop] !== b[prop]) {
            return false;
          }
        }
      }
    }

    if (!iterated) {
      return a === b;
    }

    return true;
  },

  promiseBatchPerformer: function(arr : any[], method : PromiseCallback) : Promise<void> {
    if (arr.length === 0) {
      return new Promise((resolve, reject) => { resolve() });
    }
    return xUtil._promiseBatchPerformer(arr, 0, method);
  },

  _promiseBatchPerformer: function(arr : any[], index : number, method : PromiseCallback) : Promise<void> {
    return new Promise((resolve, reject) => {
      if (index < arr.length) {
        method(arr[index])
          .then(() => {
            return xUtil._promiseBatchPerformer(arr, index+1, method);
          })
          .then(() => {
            resolve()
          })
          .catch((err) => reject(err))
      }
      else {
        resolve();
      }
    })
  },

  capitalize: function(inputStr: string) {
    if (!inputStr) { return "" }

    return inputStr[0].toUpperCase() + inputStr.substr(1)
  },


  stringify: function(obj, space = 2) {
    let allKeys = [];
    JSON.stringify( obj, function( key, value ){ allKeys.push( key ); return value; } )
    allKeys.sort();
    return JSON.stringify( obj, allKeys, space);
  },



  preparePictureURI: function(picture, cacheBuster = true) {
    if (typeof picture === 'object') {
      if (picture.uri) {
        return picture.uri;
      }
      else if (picture.path) {
        picture = picture.path;
      }
    }
    if (typeof picture === 'number') {
      return picture
    }

    let pictureUri = picture;

    // check if the image is an location on the disk or if it is from the assets.
    if (
      picture.substr(0, 4) !== 'file' &&
      picture.substr(0, 2) !== 'ph' &&
      picture.substr(0, 6) !== 'assets' &&
      picture.substr(0, 4) !== 'http' &&
      picture.substr(0, 7) !== 'content'
    ) {
      pictureUri = 'file://' + picture;
    }

    if (cacheBuster) {
      pictureUri += '?r=' + base_core.sessionMemory.cacheBusterUniqueElement
    }

    return pictureUri;
  },


  getCallStack: function(ignoreList = {}) : string[] {
    var err = new Error();

    let stackArray = err.stack.split("\n");
    // remove code position
    let functionArray = stackArray.map((v) => { return v.split("@")[0]})

    let cleanedArray = [];
    for (let fn of functionArray) {
      switch (fn) {
        case "getCallStack":
        case "construct":
        case "_createSuperInternal":
        case "tryCatch":
        case "invoke":
        case "tryCallTwo":
        case "callFunctionReturnFlushedQueue":
        case "__callFunction":
        case "doResolve":
        case "Promise":
        case "":
        case "emit":
        case "__guard":
          break;
        default:
          if (fn.substr(0,7) == "_callee") {
            break;
          }
          else if (ignoreList[fn] === undefined) {
            cleanedArray.push(fn);
          }
      }
    }

    console.log("CALL STACK", JSON.stringify(cleanedArray,undefined,2))
    return cleanedArray
  }

};


const S4 = function () {
  return Math.floor(Math.random() * 0x10000 /* 65536 */).toString(16);
};


function getRC(version) {
  let lowerCaseVersion = version.toLowerCase();
  let lowerCaseRC_split = lowerCaseVersion.split("-rc");
  let RC = null;
  if (lowerCaseRC_split.length > 1) {
    RC = lowerCaseRC_split[1];
  }

  return [lowerCaseRC_split[0], RC];
}

let checkSemVer = (str, semverSize = 3) => {
  if (!str) { return false; }

  // max 3 length items, with size-1 dots in between
  if (str.length > semverSize*3+(semverSize-1)) {
    return false;
  }

  let A = str.split('.');

  // further ensure only semver is compared
  if (A.length !== semverSize) {
    return false;
  }

  return true;
};