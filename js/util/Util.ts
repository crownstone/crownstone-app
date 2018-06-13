import { Alert, Platform } from 'react-native';
import ImageResizer from 'react-native-image-resizer';
const RNFS = require('react-native-fs');

import { screenWidth, screenHeight, pxRatio } from '../views/styles'

import { MeshUtil } from './MeshUtil'
import { DataUtil } from './DataUtil'
import {EventUtil} from "./EventUtil";
import {ALWAYS_DFU_UPDATE} from "../ExternalConfig";
import {Permissions} from "../backgroundProcesses/PermissionManager";

export const emailChecker = function(email) {
  let reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return reg.test(email);
};

export const characterChecker = function (value) {
  let reg = /[\D]/g;
  return reg.test(value);
};
export const numberChecker = function (value) {
  let reg = /[0-9]/g;
  return reg.test(value);
};

export const getImageFileFromUser = function(email) {
  return email.replace(/[^\w\s]/gi, '') + '.jpg';
};


export const processImage = function(pictureURI, targetFilename, scaleFactor = 0.5) {
  return new Promise((resolve, reject) => {
    if (pictureURI !== undefined) {
      let targetPath = Util.getPath(targetFilename);

      ImageResizer.createResizedImage(pictureURI, screenWidth * pxRatio * scaleFactor, screenHeight * pxRatio * scaleFactor, 'JPEG', 90)
        .then(({uri}) => {
          return safeMoveFile(uri, targetPath);
        })
        .then(() => {
          resolve(targetPath);
        })
        .catch((err) => {
          reject("picture resizing error:" + err.message);
        });
    }
    else {
      resolve();
    }
  })
};

export const safeMoveFile = function(from,to) {
  return safeDeleteFile(to)
    .then(() => {
      return new Promise((resolve, reject) => {
        RNFS.moveFile(from, to)
          .then(() => {
            resolve(to);
          });
      })
    })
};

export const safeDeleteFile = function(uri) {
  return new Promise((resolve, reject) => {
    RNFS.exists(uri)
      .then((fileExists) => {
        if (fileExists) {
          return RNFS.unlink(uri)
        }
      })
      .then(() => {
        resolve()
      })
      .catch((err) => {
        reject(err);
      })
  })
};

export const preparePictureURI = function(picture, cacheBuster = true) {
  if (typeof picture === 'object') {
    if (picture.uri) {
      return picture.uri;
    }
    else if (picture.path) {
      picture = picture.path;
    }
  }

  let pictureUri = picture;

  // check if the image is an location on the disk or if it is from the assets.
  if (
    picture.substr(0, 4) !== 'file' &&
    picture.substr(0, 6) !== 'assets' &&
    picture.substr(0, 4) !== 'http' &&
    picture.substr(0, 7) !== 'content'
     ) {
    pictureUri = 'file://' + picture;
  }

  if (cacheBuster) {
    pictureUri += '?r=' + Math.random(); // cache buster
  }

  return pictureUri;
};


export const addDistanceToRssi = function(rssi, distanceInMeters) {
  let newDistance = Math.pow(10,(-(rssi + 60)/(10 * 2))) + distanceInMeters; // the + 0.5 meter makes sure the user is not defining a place where he will sit: on the threshold.
  let newRssi = -(10*2)*Math.log10(newDistance) - 60;
  return newRssi;
};




export const Util = {
  mesh: MeshUtil,
  data: DataUtil,
  events: EventUtil,

  getDateHourId: function(timestamp)  {
    if (timestamp === 0) {
      return 'unknown';
    }
    let date = new Date(timestamp);
    let month = pad(date.getMonth() + 1);
    let day = pad(date.getDate());
    let hours = pad(date.getHours());

    return date.getFullYear() + '/' + month + '/' + day + ' ' + hours + ':00:00'
  },

  getDateFormat: function(timestamp)  {
    if (timestamp === 0) {
      return 'unknown';
    }
    let date = new Date(timestamp);
    let month = pad(date.getMonth() + 1);
    let day = pad(date.getDate());

    return date.getFullYear() + '/' + month + '/' + day
  },

  getDateTimeFormat: function(timestamp)  {
    if (timestamp === 0) {
      return 'unknown';
    }
    let date = new Date(timestamp);

    let month = pad(date.getMonth() + 1);
    let day = pad(date.getDate());
    let hours = pad(date.getHours());
    let minutes = pad(date.getMinutes());
    let seconds = pad(date.getSeconds());

    return date.getFullYear() + '/' + month + '/' + day + ' ' + hours + ':' + minutes + ':' + seconds
  },

  getTimeFormat: function(timestamp, showSeconds = true)  {
    if (timestamp === 0) {
      return 'unknown';
    }

    let date = new Date(timestamp);

    let hours = date.getHours();
    let minutes = pad(date.getMinutes());

    if (showSeconds === false) {
      return hours + ':' + minutes;
    }

    let seconds = pad(date.getSeconds());

    return hours + ':' + minutes + ':' + seconds
  },

  getUUID : () : string => {
    const S4 = function () {
      return Math.floor(Math.random() * 0x10000 /* 65536 */).toString(16);
    };

    return (
      S4() + S4() + '-' +
      S4() + '-' +
      S4() + '-' +
      S4() + '-' +
      S4() + S4() + S4()
    );
  },


  getToken : () : string => {
    return Math.floor(Math.random() * 1e8 /* 65536 */).toString(36);
  },


  mixin: function(base, section) {
    for (let key in section) {
      if (section.hasOwnProperty(key))
        base[key] = section[key]
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
    isHigher: function(version, compareWithVersion) {
      if (!version || !compareWithVersion) {
        return false;
      }

      let [versionClean, versionRc] = getRC(version);
      let [compareWithVersionClean, compareWithVersionRc] = getRC(compareWithVersion);

      if (checkSemVer(versionClean) === false || checkSemVer(compareWithVersionClean) === false) {
        return false;
      }

      let A = versionClean.split('.');
      let B = compareWithVersionClean.split('.');

      if (A[0] < B[0]) return false;
      else if (A[0] > B[0]) return true;
      else { // A[0] == B[0]
        if (A[1] < B[1]) return false;
        else if (A[1] > B[1]) return true;
        else { // A[1] == B[1]
          if (A[2] < B[2]) return false;
          else if (A[2] > B[2]) return true;
          else { // A[2] == B[2]
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
          }
        }
      }
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

      return Util.versions.isHigherOrEqual(myVersionClean, minimumRequiredVersionClean);
    },

    isHigherOrEqual: function(version, compareWithVersion) {
      if (!version || !compareWithVersion) {
        return false;
      }

      let [versionClean, versionRc] = getRC(version);
      let [compareWithVersionClean, compareWithVersionRc] = getRC(compareWithVersion);

      if (checkSemVer(versionClean) === false || checkSemVer(compareWithVersionClean) === false) {
        return false;
      }

      if (version === compareWithVersion && version && compareWithVersion) {
        return true;
      }

      return Util.versions.isHigher(version, compareWithVersion);
    },

    isLower: function(version, compareWithVersion) {
      if (!version || !compareWithVersion) {
        return false;
      }

      let [versionClean, versionRc] = getRC(version);
      let [compareWithVersionClean, compareWithVersionRc] = getRC(compareWithVersion);

      if (checkSemVer(versionClean) === false || checkSemVer(compareWithVersionClean) === false) {
        return false;
      }

      // Do not allow compareWithVersion to be semver
      if (compareWithVersion.split(".").length !== 3) {
        return false;
      }

      // if version is NOT semver, is higher will be false so is lower is true.
      return !Util.versions.isHigherOrEqual(version, compareWithVersion);
    },

    canUpdate: function(stone, state) {
      // only admins are allowed to update
      if (Permissions.activeSphere().seeUpdateCrownstone) {
        if (ALWAYS_DFU_UPDATE)
          return true;

        let firmwareVersionsAvailable = state.user.firmwareVersionsAvailable || {};
        return Util.versions.isLower(stone.config.firmwareVersion, firmwareVersionsAvailable[stone.config.hardwareVersion]);
      }
      return false;
    }
  },


  deepExtend: function (a, b, protoExtend = false, allowDeletion = false) {
    for (let prop in b) {
      if (b.hasOwnProperty(prop) || protoExtend === true) {
        if (b[prop] && b[prop].constructor === Object) {
          if (a[prop] === undefined) {
            a[prop] = {};
          }
          if (a[prop].constructor === Object) {
            Util.deepExtend(a[prop], b[prop], protoExtend);
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
              a[prop].push(Util.deepExtend({},b[prop][i]));
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

  promiseBatchPerformer: function(arr : any[], method : PromiseCallback) {
    if (arr.length === 0) {
      return new Promise((resolve, reject) => { resolve() });
    }
    return Util._promiseBatchPerformer(arr, 0, method);
  },

  _promiseBatchPerformer: function(arr : any[], index : number, method : PromiseCallback) {
    return new Promise((resolve, reject) => {
      if (index < arr.length) {
        method(arr[index])
          .then(() => {
            return Util._promiseBatchPerformer(arr, index+1, method);
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

  getPath(filename? : string) {
    let targetPath = Platform.OS === 'android' ? RNFS.ExternalDirectoryPath : RNFS.DocumentDirectoryPath;

    if (filename) {
      if (targetPath[targetPath.length-1] !== '/') {
        targetPath += '/';
      }
      targetPath += filename;
    }
    return targetPath;
  }


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

let checkSemVer = (str) => {
  if (!str) { return false; }

  // a git commit hash is longer than 12, we pick 12 so 123.122.1234 is the max semver length.
  if (str.length > 12) {
    return false;
  }

  let A = str.split('.');

  // further ensure only semver is compared
  if (A.length !== 3) {
    return false;
  }

  return true;
};

let pad = (base) => {
  if (Number(base) < 10) {
    return '0' + base;
  }
  return base;
};