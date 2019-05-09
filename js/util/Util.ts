import ImageResizer from 'react-native-image-resizer';

import { screenWidth, screenHeight, pxRatio } from '../views/styles'

import { MeshUtil } from './MeshUtil'
import { DataUtil } from './DataUtil'
import {EventUtil} from "./EventUtil";
import { FileUtil } from "./FileUtil";
import { core } from "../core";

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
      let targetPath = FileUtil.getPath(targetFilename);

      ImageResizer.createResizedImage(pictureURI, screenWidth * pxRatio * scaleFactor, screenHeight * pxRatio * scaleFactor, 'JPEG', 90)
        .then(({uri}) => {
          return FileUtil.safeMoveFile(uri, targetPath);
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
    pictureUri += '?r=' + core.sessionMemory.cacheBusterUniqueElement
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
};

