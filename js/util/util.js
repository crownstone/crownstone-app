import { Alert, Platform } from 'react-native';
import { DEBUG } from '../ExternalConfig'
import { StoreManager } from '../router/store/storeManager'
import { Bluenet, BleActions } from '../native/Proxy'
import { Actions } from 'react-native-router-flux';
import { LOG, LOGError } from '../logging/Log'
import { styles, colors , screenWidth, screenHeight, pxRatio } from '../views/styles'
import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs'

export const getUUID = function() {
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
};

export const mixin = function(base, section) {
  for (let key in section) {
    if (section.hasOwnProperty(key))
      base[key] = section[key]
  }
};

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

export const APPERROR = function (err) {
  if (DEBUG === true) {
    LOG("APP ERROR FROM PROMISE:", err);
    Alert.alert("APP ERROR", err.message);
  }
};

export const removeAllFiles = function() {
  RNFS.readDir(RNFS.DocumentDirectoryPath)
    .then((result) => {
      result.forEach((file) => {
        // we only want to remove files, not folders
        // removing folders breaks the async storage.
        RNFS.stat(file.path).then((fileData) => {
          if (fileData.isDirectory() !== true) {
            RNFS.unlink(file.path);
          }
        })
      })
    })
    .catch(APPERROR)
};

export const logOut = function() {
  BleActions.clearTrackedBeacons();
  Bluenet.stopScanning();
  Actions.loginSplash();
  StoreManager.userLogOut();
};

export const quitApp = function() {
  Bluenet.quitApp();
};

export const resetBle = function() {
  Bluenet.resetBle();
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

      ImageResizer.createResizedImage(picture, screenWidth * pxRatio * 0.5, screenHeight * pxRatio * 0.5, 'JPEG', 90, undefined, resizedPath)
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

String.prototype.capitalize = function() {
  return this[0].toUpperCase() + this.substring(1);
};


export const addDistanceToRssi = function(rssi, distanceInMeters) {
  let newDistance = Math.pow(10,(-(rssi + 60)/(10 * 2))) + distanceInMeters; // the + 0.5 meter makes sure the user is not defining a place where he will sit: on the threshold.
  let newRssi = -(10*2)*Math.log10(newDistance) - 60;
  return newRssi;
};


