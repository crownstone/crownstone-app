import { Alert, Platform } from 'react-native';
import ImageResizer from 'react-native-image-resizer';
const RNFS = require('react-native-fs');

import { styles, colors , screenWidth, screenHeight, pxRatio } from '../views/styles'

import { MeshUtil } from './MeshUtil'
import { DataUtil } from './DataUtil'
import {EventUtil} from "./EventUtil";
import {Permissions} from "../backgroundProcesses/Permissions";
import {ALWAYS_DFU_UPDATE} from "../ExternalConfig";

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


export const processImage = function(picture, targetFilename) {
  return new Promise((resolve, reject) => {
    if (picture !== undefined) {
      let targetPath = RNFS.DocumentDirectoryPath + '/' + targetFilename;
      if (Platform.OS === 'android') {
        targetPath = RNFS.ExternalDirectoryPath + '/' + targetFilename;
      }
      let resizedUri = undefined;
      let resizedPath = undefined;
      if (Platform.OS === 'android') {
        // TODO: what path to use for temp?
        resizedPath = RNFS.ExternalDirectoryPath;
      }

      let pictureURI = picture.indexOf("file://") === -1 ? picture : picture;

      ImageResizer.createResizedImage(pictureURI, screenWidth * pxRatio * 0.5, screenHeight * pxRatio * 0.5, 'JPEG', 90, 0, resizedPath)
        .then((resizedImageUri) => {
          resizedUri = resizedImageUri;
          return safeDeleteFile(targetPath);
        })
        .then(() => {
          if (Platform.OS === 'android') {
            // TODO: better way to remove the "file:"
            resizedUri = resizedUri.replace("file:","");
          }
          return safeMoveFile(resizedUri, targetPath);
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
  if (picture.substr(0, 4) !== 'file' && picture.substr(0, 6) !== 'assets' && picture.substr(0, 4) !== 'http') {
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

      // a git commit hash is never higher, we pick 12 so 123.122.1234 is the max semver length.
      if (version.length > 12) {
        return false;
      }

      let A = version.split('.');

      // further ensure only semver is compared
      if (A.length !== 3) {
        return false;
      }

      let B = compareWithVersion.split('.');

      if (B.length !== 3) {
        return false;
      }

      if (A[0] < B[0]) return false;
      else if (A[0] > B[0]) return true;
      else { // A[0] == B[0]
        if (A[1] < B[1]) return false;
        else if (A[1] > B[1]) return true;
        else { // A[1] == B[1]
          return (A[2] > B[2]);
        }
      }
    },

    isHigherOrEqual: function(version, compareWithVersion) {
      if (version === compareWithVersion && version && compareWithVersion) {
        return true;
      }

      return Util.versions.isHigher(version, compareWithVersion);
    },

    isLower: function(version, compareWithVersion) {
      if (!version || !compareWithVersion) {
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
      if (Permissions.seeUpdateCrownstone) {
        if (ALWAYS_DFU_UPDATE)
          return true;

        let firmwareVersionsAvailable = state.user.firmwareVersionsAvailable || {};
        return Util.versions.isLower(stone.config.firmwareVersion, firmwareVersionsAvailable[stone.config.hardwareVersion]);
      }
      return false;
    }

  }
};
