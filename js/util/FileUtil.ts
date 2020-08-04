import { Platform } from 'react-native';
import { xUtil } from "./StandAloneUtil";
import { base_core } from "../base_core";
const RNFS = require('react-native-fs');

export const FileUtil = {

  index: function() {
    return RNFS.readDir(FileUtil.getPath())
  },

  getPath: function(filename? : string) {
    let targetPath = Platform.OS === 'android' ? RNFS.ExternalDirectoryPath : RNFS.DocumentDirectoryPath;

    if (filename) {
      if (targetPath[targetPath.length-1] !== '/') {
        targetPath += '/';
      }
      targetPath += filename;
    }
    return targetPath;
  },


  safeMoveFile: function(from,to) {
    // we update the session memory to make sure all pictures are reloaded.
    base_core.sessionMemory.cacheBusterUniqueElement = Math.random();

    return FileUtil.safeDeleteFile(to)
      .then(() => {
        return new Promise((resolve, reject) => {
          RNFS.moveFile(from, to)
            .then(() => {
              resolve(to);
            });
        })
      })
  },

  safeDeleteFile: function(uri) {
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
  },

  copyCameraRollPictureToTempLocation: function(fileData) {
    let tmpFileName = FileUtil.getPath(xUtil.getShortUUID() + ".jpg");

    if (Platform.OS === 'ios') {
      let assetUri = 'assets-library://asset/asset.JPG?id=' + fileData.uri.substr(5)
      return RNFS.copyAssetsFileIOS(assetUri, tmpFileName, fileData.width, fileData.height)
        .then((newPath) => {
          return newPath;
        })
        .catch((err) => {
          // console.log("got erry", err);
        })
    }
    else {
      return RNFS.copyFile(fileData.uri, tmpFileName)
        .then(() => {
          // console.log("TEMP FILENAME", tmpFileName)
          return tmpFileName;
        })
        .catch((err) => {
          // console.log("ERROR DURING COPY", err)
        })
    }
  },

  fileExists: function(path) {
    return RNFS.exists(path)
  }

};
