import { Alert, Platform } from 'react-native';
import ImageResizer from 'react-native-image-resizer';
const RNFS = require('react-native-fs');

import { styles, colors , screenWidth, screenHeight, pxRatio } from '../views/styles'

import { MeshUtil } from './MeshUtil'
import { DataUtil } from './DataUtil'

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
  if (picture.substr(0, 4) !== 'file' &&
    picture.substr(0, 6) !== 'assets' &&
    picture.substr(0, 4) !== 'http')
    pictureUri = 'file://' + picture;

  if (cacheBuster)
    pictureUri += '?r=' + Math.random(); // cache buster

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
};
