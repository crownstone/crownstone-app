import { Alert } from 'react-native';
import { DEBUG } from '../ExternalConfig'
import { store } from '../router/store/store'
import RNFS from 'react-native-fs'
import { Actions } from 'react-native-router-flux';

export const validateEmail = function(email) {
  let reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return reg.test(email);
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