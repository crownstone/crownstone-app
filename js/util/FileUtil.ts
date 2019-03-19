import { Platform } from 'react-native';
const RNFS = require('react-native-fs');
import {SessionMemory} from "./SessionMemory";

export const FileUtil = {

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
    SessionMemory.cacheBusterUniqueElement = Math.random();

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
  }

};
