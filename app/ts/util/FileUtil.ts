import { Platform } from 'react-native';
import { xUtil } from "./StandAloneUtil";
import { base_core } from "../Base_core";
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


  safeMoveFile: function(from,to) : Promise<void> {
    // we update the session memory to make sure all pictures are reloaded.
    base_core.sessionMemory.cacheBusterUniqueElement = Math.random();

    return FileUtil.safeDeleteFile(to)
      .then(() => {
        return RNFS.moveFile(from, to)
      })
  },

  safeDeleteFile: async function(uri) : Promise<void>  {
    if (!uri) { return; }

    let pathBase = FileUtil.getPath();
    if (uri.indexOf(pathBase) === -1) {
      uri = FileUtil.getPath(uri);
    }

    return RNFS.exists(uri)
      .then((fileExists) => {
        if (fileExists) {
          return RNFS.unlink(uri);
        }
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
  },

  async writeToFile(filename: string, content: string) {
    let path = FileUtil.getPath(filename);
    await FileUtil.safeDeleteFile(path).catch((err) => {});
    await RNFS.appendFile(path, content, 'utf8').catch((err) => {})
  },

  async readFile(filename) : Promise<string | null> {
    let path = FileUtil.getPath(filename);
    if (await FileUtil.fileExists(path)) {
      return await RNFS.readFile(path,'utf8');
    }
    return null;
  },

};
