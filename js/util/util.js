import { Alert } from 'react-native';
import { DEBUG } from '../ExternalConfig'
import { store } from '../router/store/store'
import { Actions } from 'react-native-router-flux';
import { styles, colors , width, height, pxRatio } from '../views/styles'
import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs'

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
    console.log("APP ERROR FROM PROMISE:", err);
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
  Actions.loginSplash();
  store.dispatch({
    type:'USER_LOG_OUT'
  });
  removeAllFiles();
};

export const processImage = function(picture, targetFilename) {
  return new Promise((resolve, reject) => {
    if (picture !== undefined) {
      let path = RNFS.DocumentDirectoryPath + '/' + targetFilename;
      let resizedUri = undefined;
      ImageResizer.createResizedImage(picture, width * pxRatio * 0.5, height * pxRatio * 0.5, 'JPEG', 90)
        .then((resizedImageUri) => {
          resizedUri = resizedImageUri;
          return safeDeleteFile(path);
        })
        .then(() => {
          return RNFS.moveFile(resizedUri, path);
        })
        .then(() => {
          resolve(path);
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
      }).done()
  })
};

export const preparePictureURI = function(picture, cacheBuster = true) {
  if (typeof picture === 'object') {
    if (picture.uri) {
      return picture.uri;
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
}